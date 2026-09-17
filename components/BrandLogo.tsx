"use client";

/** Life & Soul wordmark for Cracker challenge mode. */
export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/logo.png"
      alt="Life & Soul"
      className={`brand-logo ${className}`.trim()}
      width={175}
      height={34}
    />
  );
}
