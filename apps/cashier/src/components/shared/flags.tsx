/**
 * Country flag component using flag-icons library (lipis/flag-icons)
 * High-quality SVG flags rendered via CSS classes.
 * @see https://flagicons.lipis.dev/
 */
import "flag-icons/css/flag-icons.min.css";

const FLAG_CODES: Record<string, string> = {
  en: "gb",
  tc: "hk",
  sc: "cn",
  pt: "pt",
  ja: "jp",
};

export function Flag({ code, size = 20, className }: { code: string; size?: number; className?: string }) {
  const countryCode = FLAG_CODES[code];
  if (!countryCode) return null;

  const height = Math.round(size * 0.75);

  return (
    <span
      className={`fi fi-${countryCode} inline-block rounded-[3px] overflow-hidden shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)] ${className || ""}`}
      style={{ width: size, height, backgroundSize: "cover" }}
      aria-hidden="true"
    />
  );
}
