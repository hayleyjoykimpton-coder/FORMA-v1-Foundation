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

/** Internal phase roadmap — Foundation is active, later phases are locked. */
export function PhaseJourney({ phases, active }: { phases: string[]; active: string }) {
  return (
    <div className="phase-journey">
      {phases.map((phase, index) => {
        const isActive = phase === active;
        return (
          <div className={`phase-step${isActive ? " active" : " locked"}`} key={phase}>
            <span className="phase-dot" />
            <div>
              <strong>{phase}</strong>
              <small>{isActive ? "In progress" : "Unlocks later"}</small>
            </div>
            {index < phases.length - 1 ? <span className="phase-line" /> : null}
          </div>
        );
      })}
    </div>
  );
}

/** Editorial 7-day training schedule with the current day highlighted. */
export function WeeklySchedule({
  schedule,
  todayName,
}: {
  schedule: ScheduleDay[];
  todayName: string;
}) {
  return (
    <div className="weekly-schedule">
      {schedule.map((entry) => {
        const isToday = entry.day === todayName;
        return (
          <article
            className={`schedule-card${isToday ? " today" : ""}${entry.rest ? " rest" : ""}`}
            key={entry.day}
          >
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
            {isToday ? <span className="schedule-today-pill">Today</span> : null}
          </article>
        );
      })}
    </div>
  );
}
