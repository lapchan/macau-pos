// PrintService — URL parsing + TCP write. Option 2 polish: also captures
// `label` (display string) + `return` (URL to send the cashier back to).

import Foundation
import Network
import SwiftUI

enum PrintError: Error, LocalizedError {
    case invalidScheme
    case missingParam(String)
    case invalidPort
    case base64Decode
    case dataTooLarge(Int)
    case timeout
    case connectionFailed(String)
    case writeFailed(String)
    case localNetworkDenied

    var errorDescription: String? {
        switch self {
        case .invalidScheme: return "Not a pos-print URL"
        case .missingParam(let p): return "Missing param: \(p)"
        case .invalidPort: return "Invalid port"
        case .base64Decode: return "Could not decode bytes"
        case .dataTooLarge(let n): return "Payload too large: \(n) bytes (max 64 KB)"
        case .timeout: return "Printer connection timed out"
        case .connectionFailed(let m): return "Connection failed: \(m)"
        case .writeFailed(let m): return "Write failed: \(m)"
        case .localNetworkDenied: return "Local Network permission denied"
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
            await MainActor.run {
                state.label = parsed.label
                state.returnUrl = parsed.returnUrl
                state.lastHost = parsed.host
                state.lastPort = Int(parsed.port)
                state.autoReturnSecondsRemaining = nil // cancel any pending countdown
            }

            try await sendTCP(host: parsed.host, port: parsed.port, data: parsed.data)
            let elapsedMs = Int(Date().timeIntervalSince(started) * 1000)

            await MainActor.run {
                state.lastEvent = "Receipt printed"
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
            let msg = err.errorDescription ?? "Unknown error"
            await MainActor.run {
                state.lastEvent = msg
                state.lastEventColor = .error
                state.appendHistory(.init(
                    timestamp: Date(),
                    label: state.label.isEmpty ? "(unknown)" : state.label,
                    bytes: 0,
                    durationMs: 0,
                    success: false,
                    errorText: msg
                ))
                // No auto-return on error — cashier needs to read the message.
                state.autoReturnSecondsRemaining = nil
            }
        } catch {
            let msg = "Unexpected: \(error.localizedDescription)"
            await MainActor.run {
                state.lastEvent = msg
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
        let returnUrl: URL?
    }

    private static func parse(url: URL) throws -> ParsedURL {
        guard url.scheme == "pos-print" else { throw PrintError.invalidScheme }
        guard url.host == "send" else { throw PrintError.invalidScheme }

        guard let comps = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            throw PrintError.invalidScheme
        }
        let items = comps.queryItems ?? []
        func qi(_ name: String) -> String? {
            items.first(where: { $0.name == name })?.value
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

        let label = qi("label") ?? ""
        let returnUrl = (qi("return")).flatMap { URL(string: $0) }

        return ParsedURL(host: host, port: port, data: data, label: label, returnUrl: returnUrl)
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
