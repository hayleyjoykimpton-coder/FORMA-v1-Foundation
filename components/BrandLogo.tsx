/** Life & Soul wordmark — brown on white (luxe palette) */
export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/brand/logo.svg"
      alt="Life & Soul"
      className={`brand-logo ${className}`.trim()}
      width={175}
      height={34}
    />
  );
}
