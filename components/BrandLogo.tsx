"use client";

/** Life & Soul Christmas Cracker badge for challenge mode. */
export function BrandLogo({
  className = "",
  size = "header",
}: {
  className?: string;
  size?: "header" | "hero" | "mark";
}) {
  const dims = size === "hero" ? 120 : size === "mark" ? 40 : 44;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/christmas-cracker-512.png"
      alt="Life & Soul Christmas Cracker"
      className={`brand-logo brand-logo-${size} ${className}`.trim()}
      width={dims}
      height={dims}
    />
  );
}
