import { db } from "@/db";
import { agents, meetings, user } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { StreamTranscriptItem } from "@/modules/meetings/types";
import { eq, inArray } from "drizzle-orm";
import { createAgent, openai, TextMessage } from "@inngest/agent-kit";
import JSONL from "jsonl-parse-stringify";
import { env } from "@/lib/env";

/* ------------------------------------------------------------------ */
/* Summarizer Agent */
/* ------------------------------------------------------------------ */

const summarizer = createAgent({
  name: "summarizer",
  system: `
You are an expert summarizer. You write readable, concise, simple content.
You are given a transcript of a meeting and you need to summarize it.

Use the following markdown structure for every output:

### Overview
Provide a detailed, engaging summary of the session's content.

### Notes
Break down key content into thematic sections with timestamp ranges.
`.trim(),
  model: openai({
    model: "gpt-4o",
    apiKey: env.OPENAI_API_KEY!,
  }),
});

/* ------------------------------------------------------------------ */
/* Inngest Function */
/* ------------------------------------------------------------------ */

export const meetingProcessing = inngest.createFunction(
  { id: "meeting/processing" },
  { event: "meetings/processing" },
  async ({ event, step }) => {
    /* -------------------------------------------------------------- */
    /* Fetch transcript (MUST be text – Stream returns JSONL) */
    /* -------------------------------------------------------------- */

    const transcriptText = await step.run(
      "fetch-transcript",
      async () => {
        const res = await fetch(event.data.transcriptUrl);

        if (!res.ok) {
          throw new Error(
            `Failed to fetch transcript: ${res.status} ${res.statusText}`
          );
        }

        return res.text(); // IMPORTANT: text(), NOT json()
      }
    );

    console.log(transcriptText)

    if (typeof transcriptText !== "string") {
      throw new Error("Transcript response is not a string");
    }

    /* -------------------------------------------------------------- */
    /* Parse JSONL safely */
    /* -------------------------------------------------------------- */

    const transcript = await step.run(
      "parse-transcript",
      async () => {
        try {
          return JSONL.parse<StreamTranscriptItem>(transcriptText);
        } catch (err) {
          throw new Error(
            "Failed to parse transcript JSONL: " + (err as Error).message
          );
        }
      }
    );

    /* -------------------------------------------------------------- */
    /* Attach speaker names */
    /* -------------------------------------------------------------- */

    const transcriptWithSpeakers = await step.run(
      "add-speakers",
      async () => {
        const speakerIds = [
          ...new Set(transcript.map((item) => item.speaker_id)),
        ];

        const userSpeakers = await db
          .select()
          .from(user)
          .where(inArray(user.id, speakerIds));

        const agentSpeakers = await db
          .select()
          .from(agents)
          .where(inArray(agents.id, speakerIds));

        const speakers = [...userSpeakers, ...agentSpeakers];

        return transcript.map((item) => {
          const speaker = speakers.find(
            (speaker) => speaker.id === item.speaker_id
          );

          return {
            ...item,
            user: {
              name: speaker?.name ?? "Unknown",
            },
          };
        });
      }
    );

    /* -------------------------------------------------------------- */
    /* Summarize */
    /* -------------------------------------------------------------- */

    const { output } = await summarizer.run(
      "Summarize the following transcript:\n\n" +
        JSON.stringify(transcriptWithSpeakers)
    );

    /* -------------------------------------------------------------- */
    /* Persist summary */
    /* -------------------------------------------------------------- */

    await step.run("save-summary", async () => {
      await db
        .update(meetings)
        .set({
          summary: (output[0] as TextMessage).content as string,
          status: "completed",
        })
        .where(eq(meetings.id, event.data.meetingId));
    });
  }
);
