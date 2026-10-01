"use client";

import { useMemo, useState } from "react";
import { fileToResizedDataUrl } from "@/lib/images";
import {
  PHOTO_CATEGORIES,
  PHOTO_LABELS,
  photoCrackerWeek,
  uid,
  type PhotoCategory,
  type ProgressPhoto,
} from "@/lib/progress";

type Props = {
  currentWeek: number;
  photos: ProgressPhoto[];
  onAddPhoto: (photo: ProgressPhoto) => void;
  onDeletePhoto: (id: string) => void;
  profileInitial: string;
  profilePhoto?: string;
  onOpenProfile: () => void;
};

const WEEKS = [1, 2, 3, 4, 5, 6] as const;

function latestFor(photos: ProgressPhoto[], week: number, category: PhotoCategory): ProgressPhoto | null {
  const matches = photos.filter(
    (photo) => photoCrackerWeek(photo) === week && photo.category === category,
  );
  return matches.length ? matches[matches.length - 1] : null;
}

export function MoveProgressPhotos({
  currentWeek,
  photos,
  onAddPhoto,
  onDeletePhoto,
  profileInitial,
  profilePhoto,
  onOpenProfile,
}: Props) {
  const [addWeek, setAddWeek] = useState(Math.min(6, Math.max(1, currentWeek)));
  const [addCategory, setAddCategory] = useState<PhotoCategory>("front");
  const [compareCategory, setCompareCategory] = useState<PhotoCategory>("front");
  const [leftWeek, setLeftWeek] = useState(1);
  const [rightWeek, setRightWeek] = useState(Math.min(6, Math.max(2, currentWeek)));
  const [busy, setBusy] = useState(false);

  const left = latestFor(photos, leftWeek, compareCategory);
  const right = latestFor(photos, rightWeek, compareCategory);

  const byWeek = useMemo(() => {
    return WEEKS.map((week) => ({
      week,
      shots: PHOTO_CATEGORIES.map((category) => ({
        category,
        photo: latestFor(photos, week, category),
      })),
    }));
  }, [photos]);

  const handleFile = async (file: File | null, week: number, category: PhotoCategory) => {
    if (!file) return;
    setBusy(true);
    try {
      const image = await fileToResizedDataUrl(file);
      const existing = latestFor(photos, week, category);
      if (existing) onDeletePhoto(existing.id);
      onAddPhoto({
        id: uid(),
        date: new Date().toISOString(),
        image,
        category,
        notes: "",
        week,
      });
    } catch {
      /* unreadable file */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen cracker-screen cracker-move cracker-move-panel move-photos-screen" aria-busy={busy}>
      <header className="cracker-topbar">
        <div>
          <p className="cracker-screen-kicker">MOVE</p>
          <h1 className="cracker-screen-title">PROGRESS PHOTOS</h1>
          <p className="cracker-edu-focus">
            Same light, same pose each week. Compare week 1 with later weeks to see your change.
          </p>
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

      <section className="card move-photos-add" aria-label="Add a progress photo">
        <p className="eyebrow">ADD A PHOTO</p>
        <label className="mini-label">Week</label>
        <div className="cracker-week-chips" role="group" aria-label="Photo week">
          {WEEKS.map((week) => (
            <button
              key={week}
              type="button"
              className={`cracker-week-chip${addWeek === week ? " active" : ""}${
                week === currentWeek ? " is-programme" : ""
              }`}
              onClick={() => setAddWeek(week)}
            >
              W{week}
            </button>
          ))}
        </div>
        <label className="mini-label">Pose</label>
        <div className="choice-row">
          {PHOTO_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className={`choice mini${addCategory === category ? " selected" : ""}`}
              onClick={() => setAddCategory(category)}
            >
              {PHOTO_LABELS[category]}
            </button>
          ))}
        </div>
        <label className="cta-btn photo-upload-cta">
          {busy ? "Saving…" : `Add ${PHOTO_LABELS[addCategory].toLowerCase()} · week ${addWeek}`}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            disabled={busy}
            onChange={(event) => {
              void handleFile(event.target.files?.[0] ?? null, addWeek, addCategory);
              event.target.value = "";
            }}
          />
        </label>
      </section>

      <section className="card move-photos-compare" aria-label="Compare weeks">
        <p className="eyebrow">COMPARE WEEKS</p>
        <div className="choice-row">
          {PHOTO_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className={`choice mini${compareCategory === category ? " selected" : ""}`}
              onClick={() => setCompareCategory(category)}
            >
              {PHOTO_LABELS[category]}
            </button>
          ))}
        </div>
        <div className="compare-pickers">
          <label className="field">
            <span>Left</span>
            <select value={leftWeek} onChange={(event) => setLeftWeek(Number(event.target.value))}>
              {WEEKS.map((week) => (
                <option key={week} value={week}>
                  Week {week}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Right</span>
            <select value={rightWeek} onChange={(event) => setRightWeek(Number(event.target.value))}>
              {WEEKS.map((week) => (
                <option key={week} value={week}>
                  Week {week}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="compare-grid move-photos-compare-grid">
          <CompareSlot
            week={leftWeek}
            category={compareCategory}
            photo={left}
            busy={busy}
            onAdd={(file) => void handleFile(file, leftWeek, compareCategory)}
            onDelete={onDeletePhoto}
          />
          <CompareSlot
            week={rightWeek}
            category={compareCategory}
            photo={right}
            busy={busy}
            onAdd={(file) => void handleFile(file, rightWeek, compareCategory)}
            onDelete={onDeletePhoto}
          />
        </div>
      </section>

      <section aria-label="Photos by week">
        <p className="eyebrow move-photos-week-heading">BY WEEK</p>
        <div className="move-photos-week-stack">
          {byWeek.map(({ week, shots }) => (
            <article key={week} className="card move-photos-week">
              <p className="eyebrow">WEEK {week}</p>
              <div className="photo-grid">
                {shots.map(({ category, photo }) => (
                  <div className="photo-cell" key={category}>
                    {photo ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.image} alt={`${PHOTO_LABELS[category]} week ${week}`} />
                        <button
                          type="button"
                          className="photo-del"
                          aria-label={`Delete ${PHOTO_LABELS[category]} week ${week}`}
                          onClick={() => {
                            if (typeof window !== "undefined" && window.confirm("Remove this photo?")) {
                              onDeletePhoto(photo.id);
                            }
                          }}
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <label className="move-photos-empty-slot">
                        <span>+ {PHOTO_LABELS[category]}</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          hidden
                          disabled={busy}
                          onChange={(event) => {
                            void handleFile(event.target.files?.[0] ?? null, week, category);
                            event.target.value = "";
                          }}
                        />
                      </label>
                    )}
                    <span className="photo-cap">{PHOTO_LABELS[category]}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function CompareSlot({
  week,
  category,
  photo,
  busy,
  onAdd,
  onDelete,
}: {
  week: number;
  category: PhotoCategory;
  photo: ProgressPhoto | null;
  busy: boolean;
  onAdd: (file: File | null) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="compare-cell">
      {photo ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.image} alt={`Week ${week} ${PHOTO_LABELS[category]}`} />
          <button
            type="button"
            className="photo-del"
            aria-label={`Delete week ${week} ${PHOTO_LABELS[category]}`}
            onClick={() => {
              if (typeof window !== "undefined" && window.confirm("Remove this photo?")) {
                onDelete(photo.id);
              }
            }}
          >
            ×
          </button>
        </>
      ) : (
        <label className="compare-placeholder empty-cta-card move-photos-empty-slot">
          <p>No week {week} {PHOTO_LABELS[category].toLowerCase()} yet.</p>
          <span className="secondary-btn">Add photo</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            disabled={busy}
            onChange={(event) => {
              onAdd(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
        </label>
      )}
      <span className="photo-cap">
        Week {week} · {PHOTO_LABELS[category]}
      </span>
    </div>
  );
}
