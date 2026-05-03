// SwiftUI Color from a 6 / 8-character hex string ("0071e3" or "#0071e3").
// Used to apply the cashier's --color-pos-accent to the print app's UI.

import SwiftUI

extension Color {
    /// Initialize from a hex like "0071e3" / "#0071e3" / "0071e3FF" (RGBA).
    /// Returns nil for malformed input so callers can fall back to a default.
    init?(hex raw: String) {
        let cleaned = raw.trimmingCharacters(in: CharacterSet(charactersIn: "# \t\n"))
        guard cleaned.count == 6 || cleaned.count == 8,
              let value = UInt64(cleaned, radix: 16) else {
            return nil
        }
        let hasAlpha = cleaned.count == 8
        let r, g, b, a: Double
        if hasAlpha {
            r = Double((value >> 24) & 0xFF) / 255.0
            g = Double((value >> 16) & 0xFF) / 255.0
            b = Double((value >>  8) & 0xFF) / 255.0
            a = Double( value        & 0xFF) / 255.0
        } else {
            r = Double((value >> 16) & 0xFF) / 255.0
            g = Double((value >>  8) & 0xFF) / 255.0
            b = Double( value        & 0xFF) / 255.0
            a = 1.0
        }
        self.init(.sRGB, red: r, green: g, blue: b, opacity: a)
    }
}
