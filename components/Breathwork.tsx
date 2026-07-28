"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BREATHWORK_PROTOCOLS,
  protocolById,
  protocolDurationSeconds,
  type BreathProtocol,
} from "@/lib/wellness";

type Screen = "pick" | "run" | "done";

export function BreathworkSession({
  onComplete,
  onCancel,
  preferCalm,
}: {
  onComplete: (protocolId: string) => void;
  onCancel: () => void;
  /** Surface the wind-down protocol first (Align / evening). */
  preferCalm?: boolean;
}) {
  const ordered = useMemo(() => {
    if (!preferCalm) return BREATHWORK_PROTOCOLS;
    const calm = BREATHWORK_PROTOCOLS.find((p) => p.id === "calm_478");
    const rest = BREATHWORK_PROTOCOLS.filter((p) => p.id !== "calm_478");
    return calm ? [calm, ...rest] : BREATHWORK_PROTOCOLS;
  }, [preferCalm]);

  const [screen, setScreen] = useState<Screen>("pick");
  const [protocol, setProtocol] = useState<BreathProtocol | null>(null);
  const [cycleIndex, setCycleIndex] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const advancing = useRef(false);

  const currentPhase = protocol?.phases[phaseIndex] ?? null;
  const expandClass =
    currentPhase?.inhale === true ? "expand" : currentPhase?.inhale === false ? "contract" : "hold";

  useEffect(() => {
    if (screen !== "run" || !protocol) return;
    advancing.current = false;
    const phase = protocol.phases[phaseIndex];
    if (!phase) return;
    setSecondsLeft(phase.seconds);

    const tick = window.setInterval(() => {
      setSecondsLeft((left) => {
        if (left <= 1) {
          if (advancing.current) return 0;
          advancing.current = true;
          window.clearInterval(tick);

          const lastPhase = phaseIndex >= protocol.phases.length - 1;
          const lastCycle = cycleIndex >= protocol.cycles - 1;
          if (!lastPhase) {
            setPhaseIndex((index) => index + 1);
          } else if (!lastCycle) {
            setCycleIndex((index) => index + 1);
            setPhaseIndex(0);
          } else {
            setScreen("done");
          }
          return 0;
        }
        return left - 1;
      });
    }, 1000);

    return () => window.clearInterval(tick);
  }, [screen, protocol, cycleIndex, phaseIndex]);

  const start = (id: string) => {
    const next = protocolById(id);
    if (!next) return;
    setProtocol(next);
    setCycleIndex(0);
    setPhaseIndex(0);
    setSecondsLeft(next.phases[0]?.seconds ?? 0);
    setScreen("run");
  };

  if (screen === "pick") {
    return (
      <div className="app">
        <div className="shell">
          <div className="onboard-screen breathwork-screen">
            <div className="onboard-top">
              <button type="button" className="ghost-btn" onClick={onCancel}>
                ‹ Back
              </button>
              <span className="eyebrow">Breathwork</span>
            </div>
            <div className="onboard-body">
              <h1>Settle your nervous system</h1>
              <p className="onboard-lead">
                A few minutes of guided breath — no equipment, no pressure. Pick a pattern that fits this moment.
              </p>
              <div className="breath-protocol-list">
                {ordered.map((item) => {
                  const mins = Math.max(1, Math.round(protocolDurationSeconds(item) / 60));
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="card breath-protocol-card"
                      onClick={() => start(item.id)}
                    >
                      <div>
                        <strong>{item.name}</strong>
                        <small className="muted">{item.blurb}</small>
                      </div>
                      <span className="breath-protocol-meta">~{mins} min</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "done" && protocol) {
    return (
      <div className="app">
        <div className="shell">
          <div className="onboard-screen breathwork-screen">
            <div className="onboard-body breath-done">
              <span className="eyebrow">Complete</span>
              <h1>Beautifully done</h1>
              <p className="onboard-lead">
                You finished {protocol.name}. Carry that calm into the rest of your day — or into Align rest.
              </p>
              <div className="onboard-nav">
                <button type="button" className="cta-btn" onClick={() => onComplete(protocol.id)}>
                  Save & return
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!protocol || !currentPhase) return null;

  return (
    <div className="app">
      <div className="shell">
        <div className="onboard-screen breathwork-screen">
          <div className="onboard-top">
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                setScreen("pick");
                setProtocol(null);
              }}
            >
              ‹ Protocols
            </button>
            <span className="eyebrow">{protocol.name}</span>
          </div>
          <div className="onboard-body breath-run">
            <p className="muted">
              Cycle {cycleIndex + 1} of {protocol.cycles}
            </p>
            <div className={`breath-orb ${expandClass}`} aria-hidden>
              <span>{secondsLeft}</span>
            </div>
            <h2 className="breath-phase-label">{currentPhase.label}</h2>
            <p className="muted">Follow the circle — no need to count yourself.</p>
            <button type="button" className="text-btn" onClick={onCancel}>
              End early
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
