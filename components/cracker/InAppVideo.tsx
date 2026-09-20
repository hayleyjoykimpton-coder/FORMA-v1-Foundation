"use client";

import { toEmbedUrl } from "@/lib/videoEmbed";

export function InAppVideo({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const embed = toEmbedUrl(url);
  if (!embed) {
    return (
      <a className="secondary-btn" href={url} target="_blank" rel="noopener noreferrer">
        Watch video
      </a>
    );
  }
  return (
    <div className="in-app-video">
      <iframe
        src={embed}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  );
}
