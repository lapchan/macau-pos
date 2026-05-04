// Localization for the POS Print Receiver app.
// Mirrors the cashier's 5 supported locales: EN, TC, SC, PT, JP.
// The cashier passes its current locale via the pos-print:// URL's `locale`
// query param; we fall back to "en" if absent or unrecognized.

import Foundation

enum AppLocale: String, CaseIterable {
    case en, tc, sc, pt, ja

    static func from(_ raw: String?) -> AppLocale {
        switch raw?.lowercased() {
        case "en": return .en
        case "tc", "zh-hk", "zh-tw": return .tc
        case "sc", "zh-cn", "zh-hans": return .sc
        case "pt", "pt-pt", "pt-br": return .pt
        case "ja", "jp", "ja-jp": return .ja
        default: return .en
        }
    }
}

enum L10n {
    case appTitle
    case ready
    case awaitingPrintJob
    case receiptPrinted
    case returnToCashier
    case pillHint
    case recentPrints
    case settings
    case settingsBundleIdLabel
    case settingsBundleIdFooter
    case settingsSave
    case settingsClear
    case settingsCurrent
    case settingsHowTo
    case settingsDone

    // Errors (mirrors PrintError cases)
    case errInvalidURL
    case errMissingParam
    case errInvalidPort
    case errBase64
    case errTooLarge
    case errTimeout
    case errConnection
    case errWrite
    case errPermission
    case errUnknown
    case testConnection
    case testing
    case printerReady
}

// Compact translation table. Each L10n key maps to a 5-tuple in
// (en, tc, sc, pt, ja) order. A new key fails-fast at compile time
// because the tuple shape is fixed.
private let strings: [L10n: (String, String, String, String, String)] = [
    .appTitle:                ("POS Print",          "POS 打印",         "POS 打印",         "Impressão POS",     "POSプリント"),
    .ready:                   ("Ready",              "就緒",             "就绪",             "Pronto",             "準備完了"),
    .awaitingPrintJob:        ("Awaiting print job", "等待打印工作",     "等待打印工作",     "À espera de trabalho", "印刷ジョブ待機中"),
    .receiptPrinted:          ("Receipt printed",    "收據已打印",       "收据已打印",       "Recibo impresso",    "レシートを印刷しました"),
    .returnToCashier:         ("Return to Cashier",  "返回收銀台",       "返回收银台",       "Voltar ao Caixa",    "レジに戻る"),
    .pillHint:                ("Or tap “← Cashier” at top-left",  "或點按左上角的「← 收銀台」",  "或点按左上角的「← 收银台」",  "Ou toque em “← Caixa” no canto superior esquerdo",  "または左上の「← レジ」をタップ"),
    .recentPrints:            ("Recent prints",      "最近打印",         "最近打印",         "Impressões recentes", "最近の印刷"),
    .settings:                ("Settings",           "設定",             "设置",             "Definições",         "設定"),
    .settingsBundleIdLabel:   ("Cashier app bundle ID", "收銀台 App Bundle ID", "收银台 App Bundle ID", "Bundle ID do Caixa", "レジ App の Bundle ID"),
    .settingsBundleIdFooter:  ("Optional override. Leave blank for auto-detection.", "可選覆蓋值。留空即使用自動偵測。", "可选覆盖值。留空即使用自动检测。", "Substituição opcional. Deixe em branco para deteção automática.", "オプションの上書き。空白にすると自動検出します。"),
    .settingsSave:            ("Save",               "儲存",             "保存",             "Guardar",            "保存"),
    .settingsClear:           ("Clear",              "清除",             "清除",             "Limpar",             "クリア"),
    .settingsCurrent:         ("Currently saved",    "目前已儲存",       "当前已保存",       "Atualmente guardado", "現在保存中"),
    .settingsHowTo:           ("How to find it",     "如何尋找",         "如何寻找",         "Como encontrar",     "見つけ方"),
    .settingsDone:            ("Done",               "完成",             "完成",             "Concluído",          "完了"),

    .errInvalidURL:           ("Invalid URL",        "URL 無效",         "URL 无效",         "URL inválido",       "無効な URL"),
    .errMissingParam:         ("Missing parameter",  "缺少參數",         "缺少参数",         "Parâmetro em falta", "パラメーターが不足"),
    .errInvalidPort:          ("Invalid port",       "端口無效",         "端口无效",         "Porta inválida",     "無効なポート"),
    .errBase64:               ("Could not decode receipt", "無法解碼收據", "无法解码收据", "Não foi possível descodificar o recibo", "レシートをデコードできません"),
    .errTooLarge:             ("Receipt too large",  "收據過大",         "收据过大",         "Recibo demasiado grande", "レシートが大きすぎます"),
    .errTimeout:              ("Printer timed out",  "打印機超時",       "打印机超时",       "Tempo limite da impressora", "プリンターがタイムアウトしました"),
    .errConnection:           ("Connection failed",  "連接失敗",         "连接失败",         "Falha na conexão",   "接続に失敗しました"),
    .errWrite:                ("Write failed",       "寫入失敗",         "写入失败",         "Falha de escrita",   "書き込みに失敗"),
    .errPermission:           ("Local Network permission denied", "本機網絡權限被拒絕", "本机网络权限被拒绝", "Permissão de rede local negada", "ローカルネットワークの許可が拒否されました"),
    .errUnknown:              ("Unknown error",      "未知錯誤",         "未知错误",         "Erro desconhecido",  "不明なエラー"),
    .testConnection:          ("Test connection",    "測試連線",         "测试连接",         "Testar ligação",     "接続をテスト"),
    .testing:                 ("Testing…",           "測試中…",          "测试中…",          "A testar…",          "テスト中…"),
    .printerReady:            ("Printer reachable",  "打印機可用",       "打印机可用",       "Impressora disponível", "プリンター接続済み"),
]

func t(_ key: L10n, _ locale: AppLocale = .en) -> String {
    guard let row = strings[key] else { return "<\(key)>" }
    switch locale {
    case .en: return row.0
    case .tc: return row.1
    case .sc: return row.2
    case .pt: return row.3
    case .ja: return row.4
    }
}
