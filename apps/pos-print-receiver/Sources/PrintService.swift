// PrintService — URL parsing + TCP write. Option 2 polish: also captures
// `label` (display string) + `return` (URL to send the cashier back to).

import Foundation
import Network
import SwiftUI

enum PrintError: Error {
    case invalidScheme
    case missingParam(String)
    case invalidPort
    case base64Decode
    case dataTooLarge(Int)
    case timeout
    case connectionFailed(String)
    case writeFailed(String)
    case localNetworkDenied

    /// Localized message for the user-facing UI. Caller passes current locale.
    func userMessage(_ locale: AppLocale) -> String {
        switch self {
        case .invalidScheme: return t(.errInvalidURL, locale)
        case .missingParam: return t(.errMissingParam, locale)
        case .invalidPort: return t(.errInvalidPort, locale)
        case .base64Decode: return t(.errBase64, locale)
        case .dataTooLarge: return t(.errTooLarge, locale)
        case .timeout: return t(.errTimeout, locale)
        case .connectionFailed: return t(.errConnection, locale)
        case .writeFailed: return t(.errWrite, locale)
        case .localNetworkDenied: return t(.errPermission, locale)
        }
    }

    /// Stable code reported back to the cashier; cashier maps to its own
    /// localized message if it wants. Independent of locale.
    var code: String {
        switch self {
        case .invalidScheme: return "invalid_scheme"
        case .missingParam: return "missing_param"
        case .invalidPort: return "invalid_port"
        case .base64Decode: return "base64_decode"
        case .dataTooLarge: return "data_too_large"
        case .timeout: return "timeout"
        case .connectionFailed: return "connection_failed"
        case .writeFailed: return "write_failed"
        case .localNetworkDenied: return "local_network_denied"
        }
    }
}

enum PrintService {
    static let MAX_PAYLOAD: Int = 64 * 1024
    static let DEFAULT_TIMEOUT_SEC: Double = 5

    static func handleURL(_ url: URL, state: AppState) async {
        let started = Date()
        do {
            let parsed = try parse(url: url)

            // Stash metadata before TCP attempt so the UI shows context even on failure.
            // Locale is captured early so error messages localize correctly even
            // if the TCP write itself fails.
            await MainActor.run {
                state.locale = parsed.locale
                state.label = parsed.label
                state.total = parsed.total
                state.cashier = parsed.cashier
                state.paymentMethod = parsed.paymentMethod
                state.itemCount = parsed.itemCount
                state.accentHex = parsed.accentHex
                state.returnUrl = parsed.returnUrl
                state.lastHost = parsed.host
                state.lastPort = Int(parsed.port)
                state.jobId = parsed.jobId
                state.autoReturnSecondsRemaining = nil // cancel any pending countdown
            }

            try await sendTCP(host: parsed.host, port: parsed.port, data: parsed.data)
            let elapsedMs = Int(Date().timeIntervalSince(started) * 1000)

            // Report success to the cashier-side relay so the web cashier
            // can stop polling and silently confirm. Fire-and-forget.
            reportResult(
                returnUrl: parsed.returnUrl,
                jobId: parsed.jobId,
                ok: true,
                errorCode: nil,
                errorMessage: nil,
                durationMs: elapsedMs,
                bytesWritten: parsed.data.count
            )

            await MainActor.run {
                state.lastEvent = t(.receiptPrinted, parsed.locale)
                state.lastEventColor = .success
                state.lastPrintAt = Date()
                state.lastBytes = parsed.data.count
                state.lastDurationMs = elapsedMs
                state.appendHistory(.init(
                    timestamp: Date(),
                    label: parsed.label,
                    bytes: parsed.data.count,
                    durationMs: elapsedMs,
                    success: true,
                    errorText: nil
                ))

                // No auto-return. iOS already shows a "← Safari" back-link in
                // our status bar after a URL-scheme launch — tapping it
                // resurfaces Safari from memory (no reload). exit(0) was
                // briefly used here but kills our app, defeating the purpose
                // of staying alive between prints.
            }
        } catch let err as PrintError {
            let snapshot = await MainActor.run { (state.locale, state.returnUrl, state.jobId) }
            let locale = snapshot.0
            let msg = err.userMessage(locale)
            // Report failure to the cashier-side relay so the cashier can
            // surface the same error. errorCode is the stable enum case;
            // errorMessage is already localized.
            reportResult(
                returnUrl: snapshot.1,
                jobId: snapshot.2,
                ok: false,
                errorCode: err.code,
                errorMessage: msg,
                durationMs: nil,
                bytesWritten: nil
            )
            await MainActor.run {
                state.lastEvent = msg
                state.lastEventColor = .error
                state.appendHistory(.init(
                    timestamp: Date(),
                    label: state.label,
                    bytes: 0,
                    durationMs: 0,
                    success: false,
                    errorText: msg
                ))
                // No auto-return on error — cashier needs to read the message.
                state.autoReturnSecondsRemaining = nil
            }
        } catch {
            let locale = await MainActor.run { state.locale }
            await MainActor.run {
                state.lastEvent = t(.errUnknown, locale)
                state.lastEventColor = .error
                state.autoReturnSecondsRemaining = nil
            }
        }
    }

    private struct ParsedURL {
        let host: String
        let port: UInt16
        let data: Data
        let label: String
        let total: String
        let cashier: String
        let paymentMethod: String
        let itemCount: Int
        let returnUrl: URL?
        let locale: AppLocale
        let accentHex: String
        let jobId: String
    }

    private static func parse(url: URL) throws -> ParsedURL {
        guard url.scheme == "pos-print" else { throw PrintError.invalidScheme }
        guard url.host == "send" else { throw PrintError.invalidScheme }

        guard let comps = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            throw PrintError.invalidScheme
        }
        let items = comps.queryItems ?? []
        // Raw value (used for the base64 `bytes` blob — must keep `+` intact
        // since base64 alphabet uses it).
        func qi(_ name: String) -> String? {
            items.first(where: { $0.name == name })?.value
        }
        // Text value — URLSearchParams encodes spaces as `+` per
        // form-URL-encoded spec; iOS's URLComponents only decodes `%20`,
        // not `+`. So plain-text fields need the substitution.
        func qt(_ name: String) -> String? {
            qi(name)?.replacingOccurrences(of: "+", with: " ")
        }

        guard let host = qi("host"), !host.isEmpty else {
            throw PrintError.missingParam("host")
        }
        guard let portStr = qi("port"), let port = UInt16(portStr) else {
            throw PrintError.invalidPort
        }
        guard let bytesB64 = qi("bytes"), !bytesB64.isEmpty else {
            throw PrintError.missingParam("bytes")
        }

        var b64 = bytesB64.replacingOccurrences(of: " ", with: "+")
        let pad = b64.count % 4
        if pad > 0 { b64 += String(repeating: "=", count: 4 - pad) }
        guard let data = Data(base64Encoded: b64) else {
            throw PrintError.base64Decode
        }
        if data.count > MAX_PAYLOAD {
            throw PrintError.dataTooLarge(data.count)
        }

        let label = qt("label") ?? ""
        let total = qt("total") ?? ""
        let cashier = qt("cashier") ?? ""
        let paymentMethod = qt("payment") ?? ""
        let itemCount = Int(qt("items") ?? "") ?? 0
        let returnUrl = (qt("return")).flatMap { URL(string: $0) }
        let locale = AppLocale.from(qt("locale"))
        // Strip leading # if present, accept both 6-char and 8-char (rgba) hex.
        let accentHex = (qt("accent") ?? "").replacingOccurrences(of: "#", with: "")
        let jobId = qt("jobId") ?? ""

        return ParsedURL(
            host: host, port: port, data: data,
            label: label, total: total, cashier: cashier,
            paymentMethod: paymentMethod, itemCount: itemCount,
            returnUrl: returnUrl, locale: locale, accentHex: accentHex,
            jobId: jobId
        )
    }

    /// POST the print result back to the cashier server keyed by jobId.
    /// Fire-and-forget. Cashier polls the matching GET endpoint to surface
    /// success/error in its UI. Returns immediately; uses a shared default
    /// session so the OS handles the request whether or not we're foreground.
    static func reportResult(
        returnUrl: URL?,
        jobId: String,
        ok: Bool,
        errorCode: String?,
        errorMessage: String?,
        durationMs: Int?,
        bytesWritten: Int?
    ) {
        guard !jobId.isEmpty,
              let host = returnUrl?.host,
              let scheme = returnUrl?.scheme else { return }
        var comps = URLComponents()
        comps.scheme = scheme
        comps.host = host
        if let port = returnUrl?.port { comps.port = port }
        comps.path = "/api/print-result/\(jobId)"
        guard let url = comps.url else { return }

        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.timeoutInterval = 4

        var body: [String: Any] = ["ok": ok]
        if let c = errorCode { body["errorCode"] = c }
        if let m = errorMessage { body["errorMessage"] = m }
        if let d = durationMs { body["durationMs"] = d }
        if let b = bytesWritten { body["bytesWritten"] = b }
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: req).resume()
    }

    private static func sendTCP(host: String, port: UInt16, data: Data, timeoutSec: Double = DEFAULT_TIMEOUT_SEC) async throws {
        let endpointHost = NWEndpoint.Host(host)
        let endpointPort = NWEndpoint.Port(rawValue: port)!
        let conn = NWConnection(host: endpointHost, port: endpointPort, using: .tcp)

        try await withCheckedThrowingContinuation { (cont: CheckedContinuation<Void, Error>) in
            let timeout = DispatchWorkItem {
                conn.cancel()
                cont.resume(throwing: PrintError.timeout)
            }
            DispatchQueue.global().asyncAfter(deadline: .now() + timeoutSec, execute: timeout)

            var resumed = false
            func resumeOnce(_ result: Result<Void, Error>) {
                guard !resumed else { return }
                resumed = true
                timeout.cancel()
                conn.cancel()
                switch result {
                case .success: cont.resume()
                case .failure(let e): cont.resume(throwing: e)
                }
            }

            conn.stateUpdateHandler = { state in
                switch state {
                case .ready:
                    conn.send(content: data, completion: .contentProcessed { error in
                        if let e = error {
                            resumeOnce(.failure(PrintError.writeFailed(e.localizedDescription)))
                        } else {
                            resumeOnce(.success(()))
                        }
                    })
                case .failed(let err):
                    let msg = err.localizedDescription
                    if msg.contains("denied") || msg.contains("entitlement") {
                        resumeOnce(.failure(PrintError.localNetworkDenied))
                    } else {
                        resumeOnce(.failure(PrintError.connectionFailed(msg)))
                    }
                case .cancelled:
                    break
                default:
                    break
                }
            }
            conn.start(queue: .global())
        }
    }
}
