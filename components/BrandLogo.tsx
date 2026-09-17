"use client";

/** Life & Soul / Christmas Cracker brand marks for challenge season. */
export function BrandLogo({
  className = "",
  size = "header",
  variant = "cracker",
}: {
  className?: string;
  size?: "header" | "hero" | "mark" | "wordmark";
  /** cracker = badge · life-and-soul = wordmark · duo = both */
  variant?: "cracker" | "life-and-soul" | "duo";
}) {
  if (variant === "life-and-soul" || size === "wordmark") {
    const height = size === "hero" ? 40 : size === "mark" ? 24 : 32;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/brand/life-and-soul.png"
        alt="Life & Soul"
        className={`brand-logo brand-logo-wordmark brand-logo-${size} ${className}`.trim()}
        height={height}
        style={{ height, width: "auto" }}
      />
    );
  }

  if (variant === "duo") {
    const mark = size === "hero" ? 72 : size === "mark" ? 36 : 44;
    const word = size === "hero" ? 36 : 28;
    return (
      <div className={`brand-logo-duo brand-logo-duo-${size} ${className}`.trim()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/christmas-cracker-512.png"
          alt=""
          className="brand-logo brand-logo-cracker"
          width={mark}
          height={mark}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/life-and-soul.png"
          alt="Life & Soul Christmas Cracker"
          className="brand-logo brand-logo-wordmark"
          height={word}
          style={{ height: word, width: "auto" }}
        />
      </div>
    );
  }

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
