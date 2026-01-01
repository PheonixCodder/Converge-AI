import {
  CallSessionEndedEvent,
  CallSessionParticipantLeftEvent,
  CallSessionStartedEvent,
  CallTranscriptionReadyEvent,
  CallRecordingReadyEvent,
  MessageNewEvent,
} from "@stream-io/node-sdk";
import { streamVideo } from "@/lib/stream-video";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { and, eq, not } from "drizzle-orm";
import { inngest } from "@/inngest/client";
import OpenAI from "openai";
import { streamChat } from "@/lib/stream-chat";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { generateAvatarUri } from "@/lib/avatar";
import { env } from "@/lib/env";

/* ------------------------------------------------------------------ */
/* Utilities */
/* ------------------------------------------------------------------ */

function extractMeetingIdFromCid(callCid: unknown): string | null {
  if (typeof callCid !== "string") return null;

  const parts = callCid.split(":");
  if (parts.length !== 2) return null;

  return parts[1];
}

/* ------------------------------------------------------------------ */
/* OpenAI Client */
/* ------------------------------------------------------------------ */

const openaiClient = new OpenAI({
  apiKey: env.OPENAI_API_KEY!,
});

/* ------------------------------------------------------------------ */
/* Webhook Verification */
/* ------------------------------------------------------------------ */

export const verifySignatureWithSD = (body: string, signature: string) =>
  streamVideo.verifyWebhook(body, signature);

/* ------------------------------------------------------------------ */
/* Webhook Handler */
/* ------------------------------------------------------------------ */

export const POST = async (req: NextRequest) => {
  const signature = req.headers.get("x-signature");
  const apiKey = req.headers.get("x-api-key");

  if (!signature || !apiKey) {
    return NextResponse.json(
      { error: "Missing signature or API key" },
      { status: 401 }
    );
  }

  const body = await req.text();

  if (!verifySignatureWithSD(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = (payload as Record<string, unknown>)?.type;

  /* ------------------------------------------------------------------ */
  /* Call Started */
  /* ------------------------------------------------------------------ */

  if (eventType === "call.session_started") {
    const event = payload as CallSessionStartedEvent;
    const meetingId = event.call.custom?.meetingId;

    if (!meetingId) {
      return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
    }

    const [existingMeeting] = await db
      .select()
      .from(meetings)
      .where(
        and(
          eq(meetings.id, meetingId),
          not(eq(meetings.status, "completed")),
          not(eq(meetings.status, "active")),
          not(eq(meetings.status, "cancelled")),
          not(eq(meetings.status, "processing"))
        )
      );

    if (!existingMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    await db
      .update(meetings)
      .set({
        status: "active",
        startedAt: new Date(),
      })
      .where(eq(meetings.id, meetingId));

    const [existingAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, existingMeeting.agentId));

    if (!existingAgent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const call = streamVideo.video.call("default", meetingId);

    const realtimeClient = await streamVideo.video.connectOpenAi({
      call,
      openAiApiKey: env.OPENAI_API_KEY!,
      agentUserId: existingAgent.userId,
    });

    realtimeClient.updateSession({
      instructions: existingAgent.instructions,
    });
  }

  /* ------------------------------------------------------------------ */
  /* Participant Left */
  /* ------------------------------------------------------------------ */

  else if (eventType === "call.session_participant_left") {
    const event = payload as CallSessionParticipantLeftEvent;
    const meetingId = extractMeetingIdFromCid(event.call_cid);

    if (!meetingId) {
      return NextResponse.json({ error: "Invalid call_cid" }, { status: 400 });
    }

    const call = streamVideo.video.call("default", meetingId);
    await call.end();
  }

  /* ------------------------------------------------------------------ */
  /* Call Ended */
  /* ------------------------------------------------------------------ */

  else if (eventType === "call.session_ended") {
    const event = payload as CallSessionEndedEvent;
    const meetingId = event.call.custom?.meetingId;

    if (!meetingId) {
      return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
    }

    await db
      .update(meetings)
      .set({
        status: "processing",
        endedAt: new Date(),
      })
      .where(and(eq(meetings.id, meetingId), eq(meetings.status, "active")));
  }

  /* ------------------------------------------------------------------ */
  /* Transcription Ready */
  /* ------------------------------------------------------------------ */

  else if (eventType === "call.transcription_ready") {
    const event = payload as CallTranscriptionReadyEvent;
    const meetingId = extractMeetingIdFromCid(event.call_cid);

    if (!meetingId) {
      return NextResponse.json({ error: "Invalid call_cid" }, { status: 400 });
    }

    const [updatedMeeting] = await db
      .update(meetings)
      .set({
        transcriptUrl: event.call_transcription.url,
      })
      .where(eq(meetings.id, meetingId))
      .returning();

    if (!updatedMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    await inngest.send({
      name: "meetings/processing",
      data: {
        meetingId: updatedMeeting.id,
        transcriptUrl: updatedMeeting.transcriptUrl,
      },
    });
  }

  /* ------------------------------------------------------------------ */
  /* Recording Ready */
  /* ------------------------------------------------------------------ */

  else if (eventType === "call.recording_ready") {
    const event = payload as CallRecordingReadyEvent;
    const meetingId = extractMeetingIdFromCid(event.call_cid);

    if (!meetingId) {
      return NextResponse.json({ error: "Invalid call_cid" }, { status: 400 });
    }

    await db
      .update(meetings)
      .set({
        recordingUrl: event.call_recording.url,
      })
      .where(eq(meetings.id, meetingId));
  }

  /* ------------------------------------------------------------------ */
  /* Post-Meeting Chat */
  /* ------------------------------------------------------------------ */

  if (eventType === "message.new") {
    const event = payload as MessageNewEvent;

    const userId = event.user?.id;
    const channelId = event.channel_id;
    const text = event.message?.text;

    if (!userId || !channelId || typeof text !== "string") {
      return NextResponse.json(
        { error: "Invalid message payload" },
        { status: 400 }
      );
    }

    const [existingMeeting] = await db
      .select()
      .from(meetings)
      .where(and(eq(meetings.id, channelId), eq(meetings.status, "completed")));

    if (!existingMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const [existingAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, userId));

    if (!existingAgent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (userId === existingAgent.userId) {
      const instructions = `
You are an AI assistant helping the user revisit a recently completed meeting.

${existingMeeting.summary}

Original assistant instructions:
${existingAgent.instructions}
      `.trim();

      const channel = streamChat.channel("messaging", channelId);
      await channel.watch();

      const previousMessages = channel.state.messages
        .slice(-5)
        .filter((msg) => typeof msg.text === "string" && msg.text.trim() !== "")
        .map<ChatCompletionMessageParam>((message) => ({
          role: message.user?.id === existingAgent.id ? "assistant" : "user",
          content: message.text!,
        }));

      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: instructions },
          ...previousMessages,
          { role: "user", content: text },
        ],
      });

      const reply = response.choices[0]?.message?.content;
      if (!reply) {
        return NextResponse.json(
          { error: "No response from AI" },
          { status: 500 }
        );
      }

      const avatarUrl = generateAvatarUri({
        seed: existingAgent.id,
        variant: "botttsNeutral",
      });

      await streamChat.upsertUser({
        id: existingAgent.id,
        name: existingAgent.name,
        image: avatarUrl,
      });

      await channel.sendMessage({
        text: reply,
        user: {
          id: existingAgent.id,
          name: existingAgent.name,
          image: avatarUrl,
        },
      });
    }
  }

  return NextResponse.json({ message: "Webhook received" }, { status: 200 });
};
