/**
 * Phone number normalization for multi-region support.
 * Stores numbers in E.164-like format: +{countryCode}{number}
 *
 * Default region: Macau (+853)
 */

// Common country codes by digit length (for auto-detection)
const COUNTRY_CODES: Record<string, string> = {
  "1": "US/CA",    // 1 + 10 digits
  "44": "UK",      // 44 + 10 digits
  "81": "JP",      // 81 + 9-10 digits
  "82": "KR",      // 82 + 9-10 digits
  "86": "CN",      // 86 + 11 digits
  "351": "PT",     // 351 + 9 digits
  "852": "HK",     // 852 + 8 digits
  "853": "MO",     // 853 + 8 digits
  "886": "TW",     // 886 + 9 digits
  "60": "MY",      // 60 + 9-10 digits
  "65": "SG",      // 65 + 8 digits
  "66": "TH",      // 66 + 9 digits
};

const DEFAULT_COUNTRY_CODE = "853"; // Macau

// Macau numbers: 6xxxxxxx or 28xxxxxx (8 digits, start with 6 or 28)
const MACAU_LOCAL_PATTERN = /^[6]\d{7}$|^28\d{6}$/;

/**
 * Normalize a phone number to +countryCode format.
 * - "+85365281234" → "+85365281234" (already normalized)
 * - "85365281234" → "+85365281234" (add +)
 * - "65281234" → "+85365281234" (add default country code)
 * - "+1-555-123-4567" → "+15551234567" (strip formatting)
 */
export function normalizePhone(phone: string, defaultCode = DEFAULT_COUNTRY_CODE): string {
  // Strip all non-digit characters except leading +
  const hasPlus = phone.startsWith("+");
  const digits = phone.replace(/[^0-9]/g, "");

  if (!digits) return phone;

  // Already has + prefix — trust it
  if (hasPlus) return `+${digits}`;

  // Check if it already starts with a known country code
  for (const code of Object.keys(COUNTRY_CODES).sort((a, b) => b.length - a.length)) {
    if (digits.startsWith(code) && digits.length > code.length + 5) {
      return `+${digits}`;
    }
  }

  // Looks like a local number — add default country code
  return `+${defaultCode}${digits}`;
}

/**
 * Strip phone to digits only for flexible matching.
 * Returns an array of candidate forms to search against.
 *
 * Input "+85365281234" → ["85365281234", "65281234", "+85365281234"]
 * Input "65281234" → ["65281234", "85365281234", "+85365281234"]
 */
export function phoneSearchCandidates(input: string, defaultCode = DEFAULT_COUNTRY_CODE): string[] {
  const digits = input.replace(/[^0-9]/g, "");
  if (!digits) return [];

  const candidates = new Set<string>();

  // Raw digits
  candidates.add(digits);
  // With + prefix
  candidates.add(`+${digits}`);

  // Try stripping known country codes
  for (const code of Object.keys(COUNTRY_CODES).sort((a, b) => b.length - a.length)) {
    if (digits.startsWith(code) && digits.length > code.length + 3) {
      const local = digits.slice(code.length);
      candidates.add(local);
      candidates.add(`+${digits}`);
    }
  }

  // Try adding default country code
  if (!digits.startsWith(defaultCode)) {
    candidates.add(`+${defaultCode}${digits}`);
    candidates.add(`${defaultCode}${digits}`);
  }

  return Array.from(candidates);
}

/**
 * Format a phone number for display.
 * "+85365281234" → "+853 6528 1234"
 */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  const hasPlus = phone.startsWith("+");

  // Macau: +853 XXXX XXXX
  if (digits.startsWith("853") && digits.length === 11) {
    return `+853 ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  // HK: +852 XXXX XXXX
  if (digits.startsWith("852") && digits.length === 11) {
    return `+852 ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  // China: +86 XXX XXXX XXXX
  if (digits.startsWith("86") && digits.length === 13) {
    return `+86 ${digits.slice(2, 5)} ${digits.slice(5, 9)} ${digits.slice(9)}`;
  }

  return hasPlus ? `+${digits}` : digits;
}
