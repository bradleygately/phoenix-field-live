import { useState } from "react";

import { TapButton } from "@/components/primitives";
import { ChangeSheet } from "@/components/sheets/ChangeSheet";
import { CommsSheet } from "@/components/sheets/CommsSheet";
import { GearSheet } from "@/components/sheets/GearSheet";
import { InterviewSheet } from "@/components/sheets/InterviewSheet";
import { OpsSheet } from "@/components/sheets/OpsSheet";
import { ReassignSheet } from "@/components/sheets/ReassignSheet";
import { ReleaseSheet } from "@/components/sheets/ReleaseSheet";
import type { ScheduleItem } from "@/types";

type SheetId =
  | "ops"
  | "change"
  | "reassign"
  | "interview"
  | "release"
  | "gear"
  | "comms";

const ACTIONS: { id: SheetId; label: string }[] = [
  { id: "ops", label: "Ops decision" },
  { id: "change", label: "Log change" },
  { id: "reassign", label: "Reassign crew" },
  { id: "interview", label: "Interview now" },
  { id: "release", label: "Release" },
  { id: "gear", label: "Gear / card" },
  { id: "comms", label: "Urgent comms" },
];

export function QuickActions({
  item,
  candidates,
  fromRoom,
  clock,
}: {
  item: ScheduleItem | null;
  candidates: ScheduleItem[];
  fromRoom: string;
  clock: string;
}) {
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const close = () => setSheet(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {ACTIONS.map((action) => (
          <TapButton
            key={action.id}
            className="h-11 text-[11px] leading-tight"
            onClick={() => setSheet(action.id)}
          >
            {action.label}
          </TapButton>
        ))}
      </div>

      <OpsSheet
        open={sheet === "ops"}
        onClose={close}
        candidates={candidates}
        fromRoom={fromRoom}
      />
      <ChangeSheet open={sheet === "change"} onClose={close} item={item} />
      <ReassignSheet open={sheet === "reassign"} onClose={close} item={item} />
      <InterviewSheet open={sheet === "interview"} onClose={close} item={item} />
      <ReleaseSheet open={sheet === "release"} onClose={close} />
      <GearSheet open={sheet === "gear"} onClose={close} />
      <CommsSheet
        open={sheet === "comms"}
        onClose={close}
        defaults={{ who: "", where: fromRoom, when: clock }}
      />
    </>
  );
}