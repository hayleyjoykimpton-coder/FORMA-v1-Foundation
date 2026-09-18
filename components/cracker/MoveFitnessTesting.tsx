"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEADLIFT_LOAD_GUIDES,
  FITNESS_FINAL_LABEL,
  FITNESS_INITIAL_LABEL,
  THRUSTER_LOAD_GUIDES,
  formatSeconds,
  hasFitnessData,
  loadMoveCheckIns,
  numericalChange,
  parseOptionalNumber,
  parseTimeToSeconds,
  saveMoveCheckIns,
  stampLoggedAt,
  type CardioMode,
  type CrackerMoveCheckIns,
  type DeadliftVariation,
  type FitnessCheckIn,
} from "@/lib/crackerMoveCheckIns";

type TestId = "deadlift" | "cardio500" | "pushups" | "situps" | "confidence" | "finisher";

type Props = {
  profileInitial: string;
  profilePhoto?: string;
  onOpenProfile: () => void;
};

function summaryLine(initial?: FitnessCheckIn, final?: FitnessCheckIn, id?: TestId): string {
  switch (id) {
    case "deadlift": {
      const i = initial?.deadliftReps != null ? String(initial.deadliftReps) : "—";
      const f = final?.deadliftReps != null ? String(final.deadliftReps) : "—";
      const c = numericalChange(initial?.deadliftReps, final?.deadliftReps);
      return `${i} → ${f} · ${c.text}`;
    }
    case "cardio500": {
      const i = formatSeconds(initial?.cardio500Seconds);
      const f = formatSeconds(final?.cardio500Seconds);
      const c = numericalChange(initial?.cardio500Seconds, final?.cardio500Seconds, { asTime: true });
      return `${i} → ${f} · ${c.text}`;
    }
    case "pushups": {
      const i = initial?.pushupReps != null ? String(initial.pushupReps) : "—";
      const f = final?.pushupReps != null ? String(final.pushupReps) : "—";
      const c = numericalChange(initial?.pushupReps, final?.pushupReps);
      return `${i} → ${f} · ${c.text}`;
    }
    case "situps": {
      const i = initial?.situpReps != null ? String(initial.situpReps) : "—";
      const f = final?.situpReps != null ? String(final.situpReps) : "—";
      const c = numericalChange(initial?.situpReps, final?.situpReps);
      return `${i} → ${f} · ${c.text}`;
    }
    case "confidence": {
      const i = initial?.gymConfidence != null ? String(initial.gymConfidence) : "—";
      const f = final?.gymConfidence != null ? String(final.gymConfidence) : "—";
      const c = numericalChange(initial?.gymConfidence, final?.gymConfidence);
      return `${i} → ${f} · ${c.text}`;
    }
    case "finisher": {
      const i = formatSeconds(initial?.finisherSeconds);
      const f = formatSeconds(final?.finisherSeconds);
      const c = numericalChange(initial?.finisherSeconds, final?.finisherSeconds, { asTime: true });
      return `${i} → ${f} · ${c.text}`;
    }
    default:
      return "Tap to log";
  }
}

function ChangeCell({
  initial,
  final,
  asTime,
  unit,
}: {
  initial?: number;
  final?: number;
  asTime?: boolean;
  unit?: string;
}) {
  const change = numericalChange(initial, final, { asTime, unit });
  return <span className="move-compare-change">{change.text}</span>;
}

function TimeInputs({
  value,
  onChange,
  id,
}: {
  value?: number;
  onChange: (seconds: number | undefined) => void;
  id: string;
}) {
  const [text, setText] = useState(value != null ? formatSeconds(value) : "");
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(value != null ? formatSeconds(value) : "");
  }, [value, focused]);
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      placeholder="MM:SS"
      value={text}
      onFocus={() => setFocused(true)}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseTimeToSeconds(e.target.value));
      }}
      onBlur={() => {
        setFocused(false);
        if (value != null) setText(formatSeconds(value));
        else setText("");
      }}
      aria-label="Time MM:SS"
    />
  );
}

export function MoveFitnessTesting({ profileInitial, profilePhoto, onOpenProfile }: Props) {
  const [state, setState] = useState<CrackerMoveCheckIns>({});
  const [editing, setEditing] = useState<TestId | null>(null);
  const [warmupOpen, setWarmupOpen] = useState(false);
  const [draftInitial, setDraftInitial] = useState<FitnessCheckIn>({});
  const [draftFinal, setDraftFinal] = useState<FitnessCheckIn>({});
  const [savedNote, setSavedNote] = useState("");

  useEffect(() => {
    setState(loadMoveCheckIns());
  }, []);

  const initial = state.fitness_initial;
  const final = state.fitness_final;

  const openEditor = (id: TestId) => {
    setDraftInitial({ ...(state.fitness_initial ?? {}) });
    setDraftFinal({ ...(state.fitness_final ?? {}) });
    setEditing(id);
    setSavedNote("");
  };

  const persist = (next: CrackerMoveCheckIns) => {
    saveMoveCheckIns(next);
    setState(next);
  };

  const saveEditor = () => {
    const next: CrackerMoveCheckIns = { ...state };
    if (hasFitnessData(draftInitial)) next.fitness_initial = stampLoggedAt(draftInitial);
    else delete next.fitness_initial;
    if (hasFitnessData(draftFinal)) next.fitness_final = stampLoggedAt(draftFinal);
    else delete next.fitness_final;
    persist(next);
    setSavedNote("Saved");
    setEditing(null);
  };

  const results = useMemo(
    () => [
      { id: "deadlift" as const, label: "Deadlift", line: summaryLine(initial, final, "deadlift") },
      { id: "cardio500" as const, label: "500m Ski/Row", line: summaryLine(initial, final, "cardio500") },
      { id: "pushups" as const, label: "Push-ups", line: summaryLine(initial, final, "pushups") },
      { id: "situps" as const, label: "Ab mat sit-ups", line: summaryLine(initial, final, "situps") },
      {
        id: "confidence" as const,
        label: "Gym confidence",
        line: summaryLine(initial, final, "confidence"),
      },
      { id: "finisher" as const, label: "Finisher", line: summaryLine(initial, final, "finisher") },
    ],
    [initial, final],
  );

  const patchInitial = (patch: Partial<FitnessCheckIn>) =>
    setDraftInitial((c) => ({ ...c, ...patch }));
  const patchFinal = (patch: Partial<FitnessCheckIn>) => setDraftFinal((c) => ({ ...c, ...patch }));

  return (
    <div className="screen cracker-screen cracker-move cracker-move-panel">
      <header className="cracker-topbar">
        <div>
          <p className="cracker-screen-kicker">MOVE</p>
          <h1 className="cracker-screen-title">FITNESS CHECK-IN</h1>
          <p className="cracker-edu-focus">See how far you&apos;ve come.</p>
        </div>
        <button
          type="button"
          className={`avatar cracker-avatar${profilePhoto ? " has-photo" : ""}`}
          onClick={onOpenProfile}
          aria-label="Open profile"
          style={profilePhoto ? { backgroundImage: `url(${profilePhoto})` } : undefined}
        >
          {profilePhoto ? "" : profileInitial}
        </button>
      </header>

      <div className="move-checkin-periods" role="group" aria-label="Check-in periods">
        <span>{FITNESS_INITIAL_LABEL}</span>
        <span>{FITNESS_FINAL_LABEL}</span>
      </div>

      <section className="move-checkin-intro">
        <p className="muted">Estimated duration: 20–30 minutes</p>
        <p>
          Use the same movements, standards and loads at both check-ins wherever appropriate so your
          results can be compared consistently.
        </p>
        <button
          type="button"
          className="move-warmup-toggle"
          aria-expanded={warmupOpen}
          onClick={() => setWarmupOpen((v) => !v)}
        >
          Warm-up {warmupOpen ? "−" : "+"}
        </button>
        {warmupOpen ? (
          <div className="move-warmup-body">
            <p className="muted">3–5 min coach-led</p>
            <ul>
              <li>Light row or bike</li>
              <li>Bodyweight squats</li>
              <li>Static lunges</li>
              <li>Mobility</li>
            </ul>
          </div>
        ) : null}
      </section>

      <section className="move-results-summary" aria-label="Your results">
        <p className="eyebrow">YOUR RESULTS</p>
        <ul>
          {results.map((row) => (
            <li key={row.id}>
              <strong>{row.label}</strong>
              <span>{row.line}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="move-test-stack">
        <TestCard
          title="DEADLIFT"
          summary={summaryLine(initial, final, "deadlift")}
          onOpen={() => openEditor("deadlift")}
        />
        <TestCard
          title="500M SKI OR ROW"
          summary={summaryLine(initial, final, "cardio500")}
          onOpen={() => openEditor("cardio500")}
        />
        <TestCard
          title="PUSH-UPS"
          summary={summaryLine(initial, final, "pushups")}
          onOpen={() => openEditor("pushups")}
        />
        <TestCard
          title="AB MAT SIT-UPS"
          summary={summaryLine(initial, final, "situps")}
          onOpen={() => openEditor("situps")}
        />
        <TestCard
          title="GYM CONFIDENCE"
          summary={summaryLine(initial, final, "confidence")}
          onOpen={() => openEditor("confidence")}
        />
        <TestCard
          title="FINISHER BENCHMARK"
          summary={summaryLine(initial, final, "finisher")}
          onOpen={() => openEditor("finisher")}
        />
      </div>

      {editing ? (
        <div className="move-editor-backdrop" role="presentation" onClick={() => setEditing(null)}>
          <div
            className="move-editor-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Edit test results"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="move-editor-head">
              <h2>{editorTitle(editing)}</h2>
              <button type="button" className="text-btn" onClick={() => setEditing(null)}>
                Close
              </button>
            </div>
            <p className="muted move-editor-standards">{editorStandards(editing)}</p>

            <div className="move-compare-grid move-compare-head">
              <span>INITIAL</span>
              <span>FINAL</span>
              <span>CHANGE</span>
            </div>

            {editing === "deadlift" ? (
              <DeadliftEditor
                initial={draftInitial}
                final={draftFinal}
                onInitial={patchInitial}
                onFinal={patchFinal}
              />
            ) : null}
            {editing === "cardio500" ? (
              <CardioEditor
                initial={draftInitial}
                final={draftFinal}
                onInitial={patchInitial}
                onFinal={patchFinal}
              />
            ) : null}
            {editing === "pushups" ? (
              <RepsEditor
                label="Max quality reps"
                initial={draftInitial.pushupReps}
                final={draftFinal.pushupReps}
                onInitial={(n) => patchInitial({ pushupReps: n })}
                onFinal={(n) => patchFinal({ pushupReps: n })}
              />
            ) : null}
            {editing === "situps" ? (
              <RepsEditor
                label="Max reps in 60s"
                initial={draftInitial.situpReps}
                final={draftFinal.situpReps}
                onInitial={(n) => patchInitial({ situpReps: n })}
                onFinal={(n) => patchFinal({ situpReps: n })}
              />
            ) : null}
            {editing === "confidence" ? (
              <ConfidenceEditor
                initial={draftInitial.gymConfidence}
                final={draftFinal.gymConfidence}
                onInitial={(n) => patchInitial({ gymConfidence: n })}
                onFinal={(n) => patchFinal({ gymConfidence: n })}
              />
            ) : null}
            {editing === "finisher" ? (
              <FinisherEditor
                initial={draftInitial}
                final={draftFinal}
                onInitial={patchInitial}
                onFinal={patchFinal}
              />
            ) : null}

            <button type="button" className="cta-btn" onClick={saveEditor}>
              SAVE RESULTS
            </button>
            {savedNote ? <p className="auth-info">{savedNote}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TestCard({
  title,
  summary,
  onOpen,
}: {
  title: string;
  summary: string;
  onOpen: () => void;
}) {
  return (
    <button type="button" className="move-test-card" onClick={onOpen}>
      <div>
        <strong>{title}</strong>
        <small className="muted">{summary}</small>
      </div>
      <span aria-hidden="true">›</span>
    </button>
  );
}

function editorTitle(id: TestId): string {
  switch (id) {
    case "deadlift":
      return "DEADLIFT";
    case "cardio500":
      return "500M SKI OR ROW";
    case "pushups":
      return "PUSH-UPS";
    case "situps":
      return "AB MAT SIT-UPS";
    case "confidence":
      return "GYM CONFIDENCE";
    case "finisher":
      return "FINISHER BENCHMARK";
  }
}

function editorStandards(id: TestId): string {
  switch (id) {
    case "deadlift":
      return "Full lockout, controlled descent, no lumbar rounding.";
    case "cardio500":
      return "Lower time = improvement. Same erg at both check-ins.";
    case "pushups":
      return "Chest to floor, full elbow lockout, no hip sag.";
    case "situps":
      return "Return fully to the floor between reps. Max in 60 seconds.";
    case "confidence":
      return "How confident do you feel in the gym right now?";
    case "finisher":
      return "250m Ski/Row · 15 Barbell Thrusters · 20 Walking Lunges · 10 Burpees · 250m Ski/Row. Same load where appropriate.";
  }
}

function DeadliftEditor({
  initial,
  final,
  onInitial,
  onFinal,
}: {
  initial: FitnessCheckIn;
  final: FitnessCheckIn;
  onInitial: (p: Partial<FitnessCheckIn>) => void;
  onFinal: (p: Partial<FitnessCheckIn>) => void;
}) {
  const setVariation = (v: DeadliftVariation) => {
    onInitial({ deadliftVariation: v });
    onFinal({ deadliftVariation: v });
  };
  const variation = initial.deadliftVariation ?? final.deadliftVariation ?? "barbell";
  const guides = DEADLIFT_LOAD_GUIDES[variation];

  return (
    <div className="move-editor-fields">
      <p className="eyebrow">Variation</p>
      <div className="choice-row">
        <button
          type="button"
          className={`choice mini${variation === "barbell" ? " selected" : ""}`}
          onClick={() => setVariation("barbell")}
        >
          BARBELL DEADLIFT
        </button>
        <button
          type="button"
          className={`choice mini${variation === "kb_suitcase" ? " selected" : ""}`}
          onClick={() => setVariation("kb_suitcase")}
        >
          DUAL KB SUITCASE
        </button>
      </div>
      <p className="muted">
        Load guide: {guides.join(" / ")} kg (custom allowed)
      </p>

      <div className="move-compare-grid">
        <label>
          Load (kg)
          <input
            type="number"
            inputMode="decimal"
            value={initial.deadliftLoadKg ?? ""}
            onChange={(e) => onInitial({ deadliftLoadKg: parseOptionalNumber(e.target.value) })}
          />
        </label>
        <label>
          Load (kg)
          <input
            type="number"
            inputMode="decimal"
            value={final.deadliftLoadKg ?? ""}
            onChange={(e) => onFinal({ deadliftLoadKg: parseOptionalNumber(e.target.value) })}
          />
        </label>
        <ChangeCell initial={initial.deadliftLoadKg} final={final.deadliftLoadKg} unit=" kg" />
      </div>
      <div className="move-compare-grid">
        <label>
          Max quality reps
          <input
            type="number"
            inputMode="numeric"
            value={initial.deadliftReps ?? ""}
            onChange={(e) => onInitial({ deadliftReps: parseOptionalNumber(e.target.value) })}
          />
        </label>
        <label>
          Max quality reps
          <input
            type="number"
            inputMode="numeric"
            value={final.deadliftReps ?? ""}
            onChange={(e) => onFinal({ deadliftReps: parseOptionalNumber(e.target.value) })}
          />
        </label>
        <ChangeCell initial={initial.deadliftReps} final={final.deadliftReps} />
      </div>
    </div>
  );
}

function CardioEditor({
  initial,
  final,
  onInitial,
  onFinal,
}: {
  initial: FitnessCheckIn;
  final: FitnessCheckIn;
  onInitial: (p: Partial<FitnessCheckIn>) => void;
  onFinal: (p: Partial<FitnessCheckIn>) => void;
}) {
  const mode = initial.cardio500Mode ?? final.cardio500Mode ?? "ski";
  const setMode = (m: CardioMode) => {
    onInitial({ cardio500Mode: m });
    onFinal({ cardio500Mode: m });
  };
  return (
    <div className="move-editor-fields">
      <div className="choice-row">
        <button
          type="button"
          className={`choice mini${mode === "ski" ? " selected" : ""}`}
          onClick={() => setMode("ski")}
        >
          SKI
        </button>
        <button
          type="button"
          className={`choice mini${mode === "row" ? " selected" : ""}`}
          onClick={() => setMode("row")}
        >
          ROW
        </button>
      </div>
      <div className="move-compare-grid">
        <label>
          Time
          <TimeInputs
            id="cardio-initial"
            value={initial.cardio500Seconds}
            onChange={(s) => onInitial({ cardio500Seconds: s })}
          />
        </label>
        <label>
          Time
          <TimeInputs
            id="cardio-final"
            value={final.cardio500Seconds}
            onChange={(s) => onFinal({ cardio500Seconds: s })}
          />
        </label>
        <ChangeCell initial={initial.cardio500Seconds} final={final.cardio500Seconds} asTime />
      </div>
    </div>
  );
}

function RepsEditor({
  label,
  initial,
  final,
  onInitial,
  onFinal,
}: {
  label: string;
  initial?: number;
  final?: number;
  onInitial: (n: number | undefined) => void;
  onFinal: (n: number | undefined) => void;
}) {
  return (
    <div className="move-editor-fields">
      <div className="move-compare-grid">
        <label>
          {label}
          <input
            type="number"
            inputMode="numeric"
            value={initial ?? ""}
            onChange={(e) => onInitial(parseOptionalNumber(e.target.value))}
          />
        </label>
        <label>
          {label}
          <input
            type="number"
            inputMode="numeric"
            value={final ?? ""}
            onChange={(e) => onFinal(parseOptionalNumber(e.target.value))}
          />
        </label>
        <ChangeCell initial={initial} final={final} />
      </div>
    </div>
  );
}

function ConfidenceEditor({
  initial,
  final,
  onInitial,
  onFinal,
}: {
  initial?: number;
  final?: number;
  onInitial: (n: number | undefined) => void;
  onFinal: (n: number | undefined) => void;
}) {
  const scores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return (
    <div className="move-editor-fields">
      <p className="eyebrow">INITIAL</p>
      <div className="move-score-row" role="group" aria-label="Initial confidence">
        {scores.map((n) => (
          <button
            key={`i-${n}`}
            type="button"
            className={`move-score-btn${initial === n ? " selected" : ""}`}
            onClick={() => onInitial(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="eyebrow">FINAL</p>
      <div className="move-score-row" role="group" aria-label="Final confidence">
        {scores.map((n) => (
          <button
            key={`f-${n}`}
            type="button"
            className={`move-score-btn${final === n ? " selected" : ""}`}
            onClick={() => onFinal(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="move-compare-grid move-compare-head">
        <span>{initial ?? "—"}</span>
        <span>{final ?? "—"}</span>
        <ChangeCell initial={initial} final={final} />
      </div>
    </div>
  );
}

function FinisherEditor({
  initial,
  final,
  onInitial,
  onFinal,
}: {
  initial: FitnessCheckIn;
  final: FitnessCheckIn;
  onInitial: (p: Partial<FitnessCheckIn>) => void;
  onFinal: (p: Partial<FitnessCheckIn>) => void;
}) {
  const mode = initial.finisherCardioMode ?? final.finisherCardioMode ?? "ski";
  const setMode = (m: CardioMode) => {
    onInitial({ finisherCardioMode: m });
    onFinal({ finisherCardioMode: m });
  };
  return (
    <div className="move-editor-fields">
      <p className="eyebrow">Cardio</p>
      <div className="choice-row">
        <button
          type="button"
          className={`choice mini${mode === "ski" ? " selected" : ""}`}
          onClick={() => setMode("ski")}
        >
          SKI
        </button>
        <button
          type="button"
          className={`choice mini${mode === "row" ? " selected" : ""}`}
          onClick={() => setMode("row")}
        >
          ROW
        </button>
      </div>
      <p className="muted">Thruster guide: {THRUSTER_LOAD_GUIDES.join(" / ")} kg (custom OK)</p>
      <div className="move-compare-grid">
        <label>
          Thruster load (kg)
          <input
            type="number"
            inputMode="decimal"
            value={initial.finisherThrusterKg ?? ""}
            onChange={(e) => onInitial({ finisherThrusterKg: parseOptionalNumber(e.target.value) })}
          />
        </label>
        <label>
          Thruster load (kg)
          <input
            type="number"
            inputMode="decimal"
            value={final.finisherThrusterKg ?? ""}
            onChange={(e) => onFinal({ finisherThrusterKg: parseOptionalNumber(e.target.value) })}
          />
        </label>
        <ChangeCell initial={initial.finisherThrusterKg} final={final.finisherThrusterKg} unit=" kg" />
      </div>
      <div className="move-compare-grid">
        <label>
          Completion time
          <TimeInputs
            id="finisher-initial"
            value={initial.finisherSeconds}
            onChange={(s) => onInitial({ finisherSeconds: s })}
          />
        </label>
        <label>
          Completion time
          <TimeInputs
            id="finisher-final"
            value={final.finisherSeconds}
            onChange={(s) => onFinal({ finisherSeconds: s })}
          />
        </label>
        <ChangeCell initial={initial.finisherSeconds} final={final.finisherSeconds} asTime />
      </div>
    </div>
  );
}
