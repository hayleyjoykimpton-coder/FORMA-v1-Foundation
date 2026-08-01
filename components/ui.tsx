import type { ReactNode } from "react";
import type { Accent, ScheduleDay } from "@/lib/content";

/** Small uppercase label used above headings throughout the app. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

/** Section heading with an optional trailing action (button/link). */
export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

/** Compact stat tile used across the home, progress and recovery dashboards. */
export function StatTile({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: string;
  note?: string;
  accent?: Accent;
}) {
  return (
    <article className={`stat-tile${accent ? ` accent-${accent}` : ""}`}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {note ? <small className="stat-note">{note}</small> : null}
    </article>
  );
}

/** A soft rounded number field with a floating label. */
export function Field({
  label,
  value,
  onChange,
  step = "1",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

/** Phase roadmap — done / in progress / locked / Align recovery. */
export function PhaseJourney({
  phases,
  statuses,
}: {
  phases: string[];
  statuses: Record<string, "done" | "active" | "locked">;
}) {
  return (
    <div className="phase-journey">
      {phases.map((phase, index) => {
        const status = statuses[phase] ?? "locked";
        const label =
          status === "active"
            ? phase === "Align"
              ? "Recovery block"
              : "In progress"
            : status === "done"
              ? "Complete"
              : "Unlocks later";
        return (
          <div className={`phase-step ${status}`} key={phase}>
            <span className="phase-dot" />
            <div>
              <strong>{phase}</strong>
              <small>{label}</small>
            </div>
            {index < phases.length - 1 ? <span className="phase-line" /> : null}
          </div>
        );
      })}
    </div>
  );
}

/** Editorial training schedule with the current day highlighted. Cards can start a session. */
export function WeeklySchedule({
  schedule,
  todayName,
  onSelect,
}: {
  schedule: ScheduleDay[];
  todayName: string;
  /** When set, non-rest days are tappable (e.g. start that session). */
  onSelect?: (entry: ScheduleDay) => void;
}) {
  return (
    <div className="weekly-schedule">
      {schedule.map((entry) => {
        const isToday = entry.day === todayName;
        const done = Boolean(entry.completed);
        const selectable = Boolean(onSelect) && !entry.rest;
        const className = `schedule-card${isToday ? " today" : ""}${done ? " completed" : ""}${
          entry.rest ? " rest" : ""
        }${selectable ? " selectable" : ""}`;
        const body = (
          <>
            {entry.rest ? (
              <div className="schedule-rest" aria-hidden />
            ) : (
              <div
                className="schedule-thumb"
                style={{ backgroundImage: `url(${entry.image})` }}
                aria-hidden
              />
            )}
            <div className="schedule-copy">
              <span className="schedule-day">{entry.short}</span>
              <strong>{entry.focus}</strong>
            </div>
            {done ? (
              <span className="schedule-done-pill" aria-label="Completed this week">
                ✓ Done
              </span>
            ) : isToday ? (
              <span className="schedule-today-pill">Today</span>
            ) : null}
          </>
        );
        if (selectable) {
          return (
            <button
              type="button"
              className={className}
              key={entry.workoutId ?? entry.day}
              onClick={() => onSelect?.(entry)}
              aria-label={`${done ? "Completed · " : ""}Start ${entry.focus} (${entry.day})`}
            >
              {body}
            </button>
          );
        }
        return (
          <article className={className} key={entry.workoutId ?? entry.day}>
            {body}
          </article>
        );
      })}
    </div>
  );
}
