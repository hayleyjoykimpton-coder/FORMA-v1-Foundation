"use client";

import { ExternalLinkIcon } from "@/components/cracker/icons";
import { CRACKER_FACEBOOK_URL } from "@/lib/connect";

export function ConnectFacebookCta({
  label,
  secondary = false,
}: {
  label: string;
  secondary?: boolean;
}) {
  return (
    <a
      className={`${secondary ? "secondary-btn" : "cta-btn"} cracker-external-cta`}
      href={CRACKER_FACEBOOK_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>{label}</span>
      <ExternalLinkIcon size={16} />
    </a>
  );
}
