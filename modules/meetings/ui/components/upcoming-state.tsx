import { MeetingInfoState } from "@/modules/meetings/ui/components/meeting-info-state";
import { Button } from "@/components/ui/button";
import { BanIcon, VideoIcon } from "lucide-react";
import Link from "next/link";

type UpcomingStateProps = {
  meetingId: string;
};

export const UpcomingState = ({
  meetingId,
}: UpcomingStateProps) => (
  <MeetingInfoState
    image="/img/upcoming.svg"
    title="Not started yet"
    description="Once you start this meeting, a summary will appear here"
  >
    <Button asChild className="w-full lg:w-auto">
      <Link href={`/call/${meetingId}`}>
        <VideoIcon />
        Start meeting
      </Link>
    </Button>
  </MeetingInfoState>
);