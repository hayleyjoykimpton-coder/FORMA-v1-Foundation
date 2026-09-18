"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  INBODY_FINAL_LABEL,
  INBODY_INITIAL_LABEL,
  hasInBodyData,
  hasMeasurementsData,
  loadMoveCheckIns,
  numericalChange,
  parseOptionalNumber,
  saveMoveCheckIns,
  stampLoggedAt,
  type CrackerMoveCheckIns,
  type InBodyCheckIn,
  type MeasurementsCheckIn,
} from "@/lib/crackerMoveCheckIns";

type CardId =
  | "smm"
  | "bfp"
  | "visceral"
  | "chest"
  | "waist"
  | "hips";

type Props = {
  profileInitial: string;
  profilePhoto?: string;
  onOpenProfile: () => void;
};

function ChangeCell({ initial, final, unit }: { initial?: number; final?: number; unit?: string }) {
  const change = numericalChange(initial, final, { unit });
  return <span className="move-compare-change">{change.text}</span>;
}

function formatPair(initial?: number, final?: number, unit = ""): string {
  const i = initial != null ? `${initial}${unit}` : "—";
  const f = final != null ? `${final}${unit}` : "—";
  const c = numericalChange(initial, final, { unit: unit ? ` ${unit}` : undefined });
  return `${i} → ${f} · ${c.text}`;
}

function metricLine(label: string, initial?: number, final?: number, unit = ""): string {
  return `${label}: ${formatPair(initial, final, unit)}`;
}

export function MoveInBodyMeasurements({ profileInitial, profilePhoto, onOpenProfile }: Props) {
  const [state, setState] = useState<CrackerMoveCheckIns>({});
  const [editing, setEditing] = useState<CardId | null>(null);
  const [howtoOpen, setHowtoOpen] = useState(false);
  const [draftInInitial, setDraftInInitial] = useState<InBodyCheckIn>({});
  const [draftInFinal, setDraftInFinal] = useState<InBodyCheckIn>({});
  const [draftMInitial, setDraftMInitial] = useState<MeasurementsCheckIn>({});
  const [draftMFinal, setDraftMFinal] = useState<MeasurementsCheckIn>({});

  useEffect(() => {
    setState(loadMoveCheckIns());
  }, []);

  const inI = state.inbody_initial;
  const inF = state.inbody_final;
  const mI = state.measurements_initial;
  const mF = state.measurements_final;

  const openInBody = (id: CardId) => {
    setDraftInInitial({ ...(state.inbody_initial ?? {}) });
    setDraftInFinal({ ...(state.inbody_final ?? {}) });
    setEditing(id);
  };

  const openMeasure = (id: CardId) => {
    setDraftMInitial({ ...(state.measurements_initial ?? {}) });
    setDraftMFinal({ ...(state.measurements_final ?? {}) });
    setEditing(id);
  };

  const persist = (next: CrackerMoveCheckIns) => {
    saveMoveCheckIns(next);
    setState(next);
  };

  const saveInBody = () => {
    const next: CrackerMoveCheckIns = { ...state };
    if (hasInBodyData(draftInInitial)) next.inbody_initial = stampLoggedAt(draftInInitial);
    else delete next.inbody_initial;
    if (hasInBodyData(draftInFinal)) next.inbody_final = stampLoggedAt(draftInFinal);
    else delete next.inbody_final;
    persist(next);
    setEditing(null);
  };

  const saveMeasurements = () => {
    const next: CrackerMoveCheckIns = { ...state };
    if (hasMeasurementsData(draftMInitial)) next.measurements_initial = stampLoggedAt(draftMInitial);
    else delete next.measurements_initial;
    if (hasMeasurementsData(draftMFinal)) next.measurements_final = stampLoggedAt(draftMFinal);
    else delete next.measurements_final;
    persist(next);
    setEditing(null);
  };

  const results = useMemo(
    () => [
      metricLine("SMM", inI?.skeletalMuscleMassKg, inF?.skeletalMuscleMassKg, " kg"),
      metricLine("Body fat", inI?.bodyFatPercent, inF?.bodyFatPercent, "%"),
      metricLine("Visceral fat", inI?.visceralFat, inF?.visceralFat),
      metricLine("Chest", mI?.chestCm, mF?.chestCm, " cm"),
      metricLine("Waist", mI?.waistCm, mF?.waistCm, " cm"),
      metricLine("Hips", mI?.hipsCm, mF?.hipsCm, " cm"),
    ],
    [inI, inF, mI, mF],
  );

  return (
    <div className="screen cracker-screen cracker-move cracker-move-panel">
      <header className="cracker-topbar">
        <div>
          <p className="cracker-screen-kicker">MOVE</p>
          <h1 className="cracker-screen-title">INBODY + MEASUREMENTS</h1>
          <p className="cracker-edu-focus">Track your starting point and your finish.</p>
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

      <div className="move-checkin-periods" role="group" aria-label="Measurement periods">
        <span>{INBODY_INITIAL_LABEL}</span>
        <span>{INBODY_FINAL_LABEL}</span>
      </div>

      <section className="move-results-summary" aria-label="Your results">
        <p className="eyebrow">YOUR RESULTS</p>
        <ul>
          {results.map((line) => (
            <li key={line}>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="move-metric-section">
        <p className="eyebrow">INBODY</p>
        <div className="move-test-stack">
          <MetricCard
            title="SKELETAL MUSCLE MASS"
            unit="kg"
            summary={formatPair(inI?.skeletalMuscleMassKg, inF?.skeletalMuscleMassKg, " kg")}
            onOpen={() => openInBody("smm")}
          />
          <MetricCard
            title="BODY FAT PERCENTAGE"
            unit="%"
            summary={formatPair(inI?.bodyFatPercent, inF?.bodyFatPercent, "%")}
            onOpen={() => openInBody("bfp")}
          />
          <MetricCard
            title="VISCERAL FAT"
            unit="score"
            summary={formatPair(inI?.visceralFat, inF?.visceralFat)}
            onOpen={() => openInBody("visceral")}
          />
        </div>
      </section>

      <section className="move-metric-section">
        <p className="eyebrow">MEASUREMENTS</p>
        <div className="move-test-stack">
          <MetricCard
            title="CHEST"
            unit="cm"
            summary={formatPair(mI?.chestCm, mF?.chestCm, " cm")}
            onOpen={() => openMeasure("chest")}
          />
          <MetricCard
            title="WAIST"
            unit="cm"
            summary={formatPair(mI?.waistCm, mF?.waistCm, " cm")}
            onOpen={() => openMeasure("waist")}
          />
          <MetricCard
            title="HIPS"
            unit="cm"
            summary={formatPair(mI?.hipsCm, mF?.hipsCm, " cm")}
            onOpen={() => openMeasure("hips")}
          />
        </div>
      </section>

      <button
        type="button"
        className="move-warmup-toggle"
        aria-expanded={howtoOpen}
        onClick={() => setHowtoOpen((v) => !v)}
      >
        HOW TO MEASURE {howtoOpen ? "−" : "+"}
      </button>
      {howtoOpen ? (
        <div className="move-warmup-body">
          <ul>
            <li>
              <strong>Chest</strong> — across nipple line
            </li>
            <li>
              <strong>Waist</strong> — across belly button
            </li>
            <li>
              <strong>Hips</strong> — widest point
            </li>
          </ul>
          <p className="muted">Use the same method at both check-ins.</p>
        </div>
      ) : null}

      {editing && ["smm", "bfp", "visceral"].includes(editing) ? (
        <EditorSheet title={inBodyTitle(editing)} onClose={() => setEditing(null)} onSave={saveInBody}>
          <div className="move-compare-grid move-compare-head">
            <span>START</span>
            <span>FINAL</span>
            <span>CHANGE</span>
          </div>
          {editing === "smm" ? (
            <NumberCompare
              label="kg"
              initial={draftInInitial.skeletalMuscleMassKg}
              final={draftInFinal.skeletalMuscleMassKg}
              unit=" kg"
              onInitial={(n) => setDraftInInitial((c) => ({ ...c, skeletalMuscleMassKg: n }))}
              onFinal={(n) => setDraftInFinal((c) => ({ ...c, skeletalMuscleMassKg: n }))}
            />
          ) : null}
          {editing === "bfp" ? (
            <NumberCompare
              label="%"
              initial={draftInInitial.bodyFatPercent}
              final={draftInFinal.bodyFatPercent}
              unit="%"
              onInitial={(n) => setDraftInInitial((c) => ({ ...c, bodyFatPercent: n }))}
              onFinal={(n) => setDraftInFinal((c) => ({ ...c, bodyFatPercent: n }))}
            />
          ) : null}
          {editing === "visceral" ? (
            <NumberCompare
              label="score"
              initial={draftInInitial.visceralFat}
              final={draftInFinal.visceralFat}
              onInitial={(n) => setDraftInInitial((c) => ({ ...c, visceralFat: n }))}
              onFinal={(n) => setDraftInFinal((c) => ({ ...c, visceralFat: n }))}
            />
          ) : null}
        </EditorSheet>
      ) : null}

      {editing && ["chest", "waist", "hips"].includes(editing) ? (
        <EditorSheet
          title={measureTitle(editing)}
          onClose={() => setEditing(null)}
          onSave={saveMeasurements}
        >
          <div className="move-compare-grid move-compare-head">
            <span>START</span>
            <span>FINAL</span>
            <span>CHANGE</span>
          </div>
          {editing === "chest" ? (
            <NumberCompare
              label="cm"
              initial={draftMInitial.chestCm}
              final={draftMFinal.chestCm}
              unit=" cm"
              onInitial={(n) => setDraftMInitial((c) => ({ ...c, chestCm: n }))}
              onFinal={(n) => setDraftMFinal((c) => ({ ...c, chestCm: n }))}
            />
          ) : null}
          {editing === "waist" ? (
            <NumberCompare
              label="cm"
              initial={draftMInitial.waistCm}
              final={draftMFinal.waistCm}
              unit=" cm"
              onInitial={(n) => setDraftMInitial((c) => ({ ...c, waistCm: n }))}
              onFinal={(n) => setDraftMFinal((c) => ({ ...c, waistCm: n }))}
            />
          ) : null}
          {editing === "hips" ? (
            <NumberCompare
              label="cm"
              initial={draftMInitial.hipsCm}
              final={draftMFinal.hipsCm}
              unit=" cm"
              onInitial={(n) => setDraftMInitial((c) => ({ ...c, hipsCm: n }))}
              onFinal={(n) => setDraftMFinal((c) => ({ ...c, hipsCm: n }))}
            />
          ) : null}
        </EditorSheet>
      ) : null}
    </div>
  );
}

function MetricCard({
  title,
  unit,
  summary,
  onOpen,
}: {
  title: string;
  unit: string;
  summary: string;
  onOpen: () => void;
}) {
  return (
    <button type="button" className="move-test-card" onClick={onOpen}>
      <div>
        <strong>{title}</strong>
        <small className="muted">
          {unit} · {summary}
        </small>
      </div>
      <span aria-hidden="true">›</span>
    </button>
  );
}

function EditorSheet({
  title,
  onClose,
  onSave,
  children,
}: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  children: ReactNode;
}) {
  return (
    <div className="move-editor-backdrop" role="presentation" onClick={onClose}>
      <div
        className="move-editor-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="move-editor-head">
          <h2>{title}</h2>
          <button type="button" className="text-btn" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="move-editor-fields">{children}</div>
        <button type="button" className="cta-btn" onClick={onSave}>
          SAVE
        </button>
      </div>
    </div>
  );
}

function NumberCompare({
  label,
  initial,
  final,
  unit,
  onInitial,
  onFinal,
}: {
  label: string;
  initial?: number;
  final?: number;
  unit?: string;
  onInitial: (n: number | undefined) => void;
  onFinal: (n: number | undefined) => void;
}) {
  return (
    <div className="move-compare-grid">
      <label>
        {label}
        <input
          type="number"
          inputMode="decimal"
          value={initial ?? ""}
          onChange={(e) => onInitial(parseOptionalNumber(e.target.value))}
        />
      </label>
      <label>
        {label}
        <input
          type="number"
          inputMode="decimal"
          value={final ?? ""}
          onChange={(e) => onFinal(parseOptionalNumber(e.target.value))}
        />
      </label>
      <ChangeCell initial={initial} final={final} unit={unit} />
    </div>
  );
}

function inBodyTitle(id: CardId): string {
  if (id === "smm") return "SKELETAL MUSCLE MASS";
  if (id === "bfp") return "BODY FAT PERCENTAGE";
  return "VISCERAL FAT";
}

function measureTitle(id: CardId): string {
  if (id === "chest") return "CHEST";
  if (id === "waist") return "WAIST";
  return "HIPS";
}
