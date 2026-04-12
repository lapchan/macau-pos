// Maps an EAN-13 GS1 country prefix to a public lookup provider.
// Pure / no network — used to decide whether to fire a remote lookup
// when a scanned barcode is not found in the local catalog.
//
// V1: only Hong Kong (489 → BarcodePlus). Add new rows as we onboard
// more national GS1 chapters or commercial APIs.

export type LookupProvider = {
  id: "barcodeplus";
  country: "HK";
};

const PROVIDER_BY_PREFIX: Array<[RegExp, LookupProvider]> = [
  [/^489/, { id: "barcodeplus", country: "HK" }],
];

/**
 * Returns the lookup provider for a given barcode, or null if no provider
 * is configured for that GS1 prefix.
 *
 * Only EAN-13 (13 digits) is considered — UPC-A, EAN-8, and in-store
 * 2xx prefixes return null.
 */
export function getLookupProvider(barcode: string): LookupProvider | null {
  if (!/^\d{13}$/.test(barcode)) return null;
  for (const [re, provider] of PROVIDER_BY_PREFIX) {
    if (re.test(barcode)) return provider;
  }
  return null;
}
