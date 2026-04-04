/**
 * Country flag component using flag-icons library (lipis/flag-icons)
 * High-quality SVG flags rendered via CSS classes.
 * @see https://flagicons.lipis.dev/
 */
import "flag-icons/css/flag-icons.min.css";

const FLAG_CODES: Record<string, string> = {
  en: "gb",   // United Kingdom
  tc: "hk",   // Hong Kong
  sc: "cn",   // China
  pt: "pt",   // Portugal
  ja: "jp",   // Japan
};

export function Flag({ code, className }: { code: string; className?: string }) {
  const countryCode = FLAG_CODES[code];
  if (!countryCode) return null;

  return (
    <span
      className={`fi fi-${countryCode} inline-block rounded-[3px] overflow-hidden shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)] ${className || ""}`}
      style={{ width: 20, height: 15, backgroundSize: "cover" }}
      aria-hidden="true"
    />
  );
}
