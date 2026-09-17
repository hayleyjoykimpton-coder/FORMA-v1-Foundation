"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CRACKER_FITNESS_TEST,
  type CrackerFitnessScores,
  type CrackerFitnessState,
  loadCrackerFitness,
  saveCrackerFitness,
} from "@/lib/crackerProgram";

type TestPhase = "week1" | "week6";

type Draft = {
  deadliftReps: string;
  ski500Seconds: string;
  pushups: string;
  situps60: string;
  confidence: string;
  finisherSeconds: string;
  loadNote: string;
};

const emptyDraft = (): Draft => ({
  deadliftReps: "",
  ski500Seconds: "",
  pushups: "",
  situps60: "",
  confidence: "",
  finisherSeconds: "",
  loadNote: "",
});

function scoresToDraft(scores?: CrackerFitnessScores): Draft {
  if (!scores) return emptyDraft();
  return {
    deadliftReps: scores.deadliftReps != null ? String(scores.deadliftReps) : "",
    ski500Seconds: scores.ski500Seconds != null ? String(scores.ski500Seconds) : "",
    pushups: scores.pushups != null ? String(scores.pushups) : "",
    situps60: scores.situps60 != null ? String(scores.situps60) : "",
    confidence: scores.confidence != null ? String(scores.confidence) : "",
    finisherSeconds: scores.finisherSeconds != null ? String(scores.finisherSeconds) : "",
    loadNote: scores.loadNote ?? "",
  };
}

function parseOptionalNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

function formatSeconds(total?: number): string {
  if (total == null || !Number.isFinite(total)) return "—";
  const m = Math.floor(total / 60);
  const s = Math.round(total % 60);
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}

function deltaLabel(before?: number, after?: number, invert = false): string | null {
  if (before == null || after == null) return null;
  const diff = after - before;
  if (diff === 0) return "Same as Week 1";
  const improved = invert ? diff < 0 : diff > 0;
  const abs = Math.abs(diff);
  const unit = invert ? formatSeconds(abs) : String(abs);
  return improved ? `↑ ${unit} vs Week 1` : `↓ ${unit} vs Week 1`;
}

type Props = {
  weekInCycle: number;
};

export function CrackerFitnessPanel({ weekInCycle }: Props) {
  const crackerWeek = Math.min(6, Math.max(1, weekInCycle));
  const defaultPhase: TestPhase = crackerWeek >= 6 ? "week6" : "week1";
  const [phase, setPhase] = useState<TestPhase>(defaultPhase);
  const [state, setState] = useState<CrackerFitnessState>({});
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [savedNote, setSavedNote] = useState("");
  const [open, setOpen] = useState(crackerWeek === 1 || crackerWeek === 6);

  useEffect(() => {
    const loaded = loadCrackerFitness();
    setState(loaded);
  }, []);

  useEffect(() => {
    const next: TestPhase = crackerWeek >= 6 ? "week6" : "week1";
    setPhase(next);
    setOpen(crackerWeek === 1 || crackerWeek === 6);
  }, [crackerWeek]);

  useEffect(() => {
    setDraft(scoresToDraft(state[phase]));
    setSavedNote("");
  }, [phase, state]);

  const isTestWeek = crackerWeek === 1 || crackerWeek === 6;
  const existing = state[phase];
  const week1 = state.week1;
  const week6 = state.week6;

  const comparison = useMemo(() => {
    if (!week1 || !week6) return null;
    return {
      deadlift: deltaLabel(week1.deadliftReps, week6.deadliftReps),
      ski: deltaLabel(week1.ski500Seconds, week6.ski500Seconds, true),
      pushups: deltaLabel(week1.pushups, week6.pushups),
      situps: deltaLabel(week1.situps60, week6.situps60),
      confidence: deltaLabel(week1.confidence, week6.confidence),
      finisher: deltaLabel(week1.finisherSeconds, week6.finisherSeconds, true),
    };
  }, [week1, week6]);

  const setField = (key: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const save = () => {
    const scores: CrackerFitnessScores = {
      deadliftReps: parseOptionalNumber(draft.deadliftReps),
      ski500Seconds: parseOptionalNumber(draft.ski500Seconds),
      pushups: parseOptionalNumber(draft.pushups),
      situps60: parseOptionalNumber(draft.situps60),
      confidence: parseOptionalNumber(draft.confidence),
      finisherSeconds: parseOptionalNumber(draft.finisherSeconds),
      loadNote: draft.loadNote.trim() || undefined,
      loggedAt: new Date().toISOString(),
    };
    const next: CrackerFitnessState = { ...state, [phase]: scores };
    saveCrackerFitness(next);
    setState(next);
    setSavedNote(phase === "week1" ? "Week 1 test saved" : "Week 6 re-test saved");
  };

  const clearPhase = () => {
    const next = { ...state };
    delete next[phase];
    saveCrackerFitness(next);
    setState(next);
    setDraft(emptyDraft());
    setSavedNote(phase === "week1" ? "Week 1 scores cleared" : "Week 6 scores cleared");
  };

  return (
    <article className={`card cracker-fitness-card${isTestWeek ? " is-test-week" : ""}`}>
      <button
        type="button"
        className="cracker-fitness-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="cracker-fitness-heading">
          <span className="eyebrow">Fitness test</span>
          <strong>{CRACKER_FITNESS_TEST.title}</strong>
          <p className="muted">
            {isTestWeek
              ? crackerWeek === 1
                ? "Week 1 baseline — log your scores today."
                : "Week 6 re-test — compare to your Week 1 baseline."
              : `${CRACKER_FITNESS_TEST.when} · ${CRACKER_FITNESS_TEST.duration}`}
          </p>
        </div>
        <span className="cracker-fitness-chevron">{open ? "−" : "+"}</span>
      </button>

      {open ? (
        <div className="cracker-fitness-body">
          <div className="segmented cracker-fitness-phase">
            <button
              type="button"
              className={phase === "week1" ? "active" : ""}
              onClick={() => setPhase("week1")}
            >
              Week 1{week1?.loggedAt ? " · logged" : ""}
            </button>
            <button
              type="button"
              className={phase === "week6" ? "active" : ""}
              onClick={() => setPhase("week6")}
            >
              Week 6{week6?.loggedAt ? " · logged" : ""}
            </button>
          </div>

          <p className="muted cracker-fitness-meta">
            Warm-up: {CRACKER_FITNESS_TEST.warmUp}. Same loads and ergs both tests.
          </p>

          <ol className="cracker-fitness-stations">
            {CRACKER_FITNESS_TEST.stations.map((station) => (
              <li key={station.id}>
                <strong>{station.name}</strong>
                <small className="muted">
                  {station.score}
                  {station.loadGuide ? ` · ${station.loadGuide}` : ""}
                </small>
              </li>
            ))}
            <li>
              <strong>{CRACKER_FITNESS_TEST.finisher.name}</strong>
              <small className="muted">
                {CRACKER_FITNESS_TEST.finisher.work} · {CRACKER_FITNESS_TEST.finisher.loadGuide}
              </small>
            </li>
          </ol>

          <div className="cracker-fitness-form">
            <label>
              Deadlift max quality reps
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={draft.deadliftReps}
                onChange={(e) => setField("deadliftReps", e.target.value)}
                placeholder="e.g. 12"
              />
            </label>
            <label>
              500m Ski/Row (seconds)
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={draft.ski500Seconds}
                onChange={(e) => setField("ski500Seconds", e.target.value)}
                placeholder="e.g. 125"
              />
            </label>
            <label>
              Push-ups (max reps)
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={draft.pushups}
                onChange={(e) => setField("pushups", e.target.value)}
                placeholder="e.g. 20"
              />
            </label>
            <label>
              Ab mat sit-ups (60s)
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={draft.situps60}
                onChange={(e) => setField("situps60", e.target.value)}
                placeholder="e.g. 28"
              />
            </label>
            <label>
              Confidence (1–10)
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={10}
                value={draft.confidence}
                onChange={(e) => setField("confidence", e.target.value)}
                placeholder="1–10"
              />
            </label>
            <label>
              Finisher time (seconds)
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={draft.finisherSeconds}
                onChange={(e) => setField("finisherSeconds", e.target.value)}
                placeholder="e.g. 240"
              />
            </label>
            <label className="cracker-fitness-note">
              Load note (keep the same Week 1 → 6)
              <input
                type="text"
                value={draft.loadNote}
                onChange={(e) => setField("loadNote", e.target.value)}
                placeholder="e.g. BB 40 kg · thrusters 20 kg"
              />
            </label>
          </div>

          <div className="cracker-fitness-actions">
            <button type="button" className="cta-btn" onClick={save}>
              {existing?.loggedAt
                ? `Update ${phase === "week1" ? "Week 1" : "Week 6"} scores`
                : `Save ${phase === "week1" ? "Week 1" : "Week 6"} scores`}
            </button>
            {existing?.loggedAt ? (
              <button type="button" className="text-btn" onClick={clearPhase}>
                Clear
              </button>
            ) : null}
          </div>
          {savedNote ? <p className="auth-info">{savedNote}</p> : null}
          {existing?.loggedAt ? (
            <p className="muted">
              Last saved {new Date(existing.loggedAt).toLocaleDateString()} · Finisher{" "}
              {formatSeconds(existing.finisherSeconds)}
            </p>
          ) : null}

          {comparison ? (
            <div className="cracker-fitness-compare">
              <span className="eyebrow">Week 1 → Week 6</span>
              <ul>
                {comparison.deadlift ? <li>Deadlift · {comparison.deadlift}</li> : null}
                {comparison.ski ? <li>500m · {comparison.ski}</li> : null}
                {comparison.pushups ? <li>Push-ups · {comparison.pushups}</li> : null}
                {comparison.situps ? <li>Sit-ups · {comparison.situps}</li> : null}
                {comparison.confidence ? <li>Confidence · {comparison.confidence}</li> : null}
                {comparison.finisher ? <li>Finisher · {comparison.finisher}</li> : null}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
