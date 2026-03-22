export type Locale = "tc" | "sc" | "en" | "pt" | "ja";

export const localeNames: Record<Locale, string> = {
  tc: "繁體中文",
  sc: "简体中文",
  en: "English",
  pt: "Português",
  ja: "日本語",
};

export const localeFlags: Record<Locale, string> = {
  tc: "🇭🇰",
  sc: "🇨🇳",
  en: "🇬🇧",
  pt: "🇵🇹",
  ja: "🇯🇵",
};

type TranslationKeys = {
  // Header
  search: string;
  member: string;
  language: string;

  // Categories
  all: string;
  beverages: string;
  snacks: string;
  frozen: string;
  dairy: string;
  household: string;
  care: string;
  popular: string;

  // Products
  items: string;
  outOfStock: string;
  noResults: string;
  tryOther: string;

  // Cart
  cart: string;
  emptyCart: string;
  tapToAdd: string;
  clear: string;
  subtotal: string;
  tax: string;
  total: string;

  // Checkout
  charge: string;
  pay: string;
  cash: string;
  card: string;
  qrPay: string;
  cancel: string;
  processing: string;
  paymentSuccess: string;
  paymentFailed: string;
  tryAgain: string;
  newOrder: string;
  amountDue: string;
  orderNumber: string;
  thankYou: string;
  receiptSent: string;

  // Checkout modal
  checkout: string;
  takePayment: string;
  orderSummary: string;
  discount: string;
  serviceFee: string;
  itemCount: string;
  selectPayment: string;
  tapCard: string;
  insertCard: string;
  scanQr: string;
  cashPayment: string;
  readyToTap: string;
  presentCard: string;
  waitingForCard: string;
  enterCashReceived: string;
  cashReceived: string;
  changeDue: string;
  exactAmount: string;
  confirmCash: string;
  scanToPay: string;
  waitingForPayment: string;
  printReceipt: string;
  emailReceipt: string;
  noReceipt: string;
  done: string;
  payAnother: string;
  terminalConnected: string;
  terminalMode: string;

  // History
  history: string;
  receipts: string;
};

const translations: Record<Locale, TranslationKeys> = {
  tc: {
    search: "搜尋商品...",
    member: "會員",
    language: "語言",
    all: "全部",
    beverages: "飲品",
    snacks: "零食",
    frozen: "冷凍",
    dairy: "乳製品",
    household: "家居",
    care: "護理",
    popular: "熱賣",
    items: "件商品",
    outOfStock: "售罄",
    noResults: "找不到商品",
    tryOther: "嘗試其他搜尋字詞",
    cart: "購物車",
    emptyCart: "購物車是空的",
    tapToAdd: "點擊商品以添加",
    clear: "清空",
    subtotal: "小計",
    tax: "稅項",
    total: "合計",
    charge: "結帳",
    pay: "付款",
    cash: "現金",
    card: "刷卡",
    qrPay: "掃碼支付",
    cancel: "取消",
    processing: "付款處理中...",
    paymentSuccess: "付款成功",
    paymentFailed: "付款失敗",
    tryAgain: "重試",
    newOrder: "新訂單",
    amountDue: "應付金額",
    orderNumber: "訂單編號",
    thankYou: "謝謝光臨！",
    receiptSent: "收據已發送",
    checkout: "結帳",
    takePayment: "收款",
    orderSummary: "訂單摘要",
    discount: "折扣",
    serviceFee: "服務費",
    itemCount: "件商品",
    selectPayment: "選擇付款方式",
    tapCard: "拍卡",
    insertCard: "插卡",
    scanQr: "掃碼",
    cashPayment: "現金付款",
    readyToTap: "準備拍卡",
    presentCard: "請出示信用卡或手機",
    waitingForCard: "等待拍卡...",
    enterCashReceived: "輸入收到金額",
    cashReceived: "收到現金",
    changeDue: "找零",
    exactAmount: "剛好",
    confirmCash: "確認收款",
    scanToPay: "請掃描二維碼付款",
    waitingForPayment: "等待付款...",
    printReceipt: "列印收據",
    emailReceipt: "電郵收據",
    noReceipt: "不需要收據",
    done: "完成",
    payAnother: "繼續收款",
    terminalConnected: "終端已連接",
    terminalMode: "終端模式",
    history: "紀錄",
    receipts: "單據",
  },
  sc: {
    search: "搜索商品...",
    member: "会员",
    language: "语言",
    all: "全部",
    beverages: "饮品",
    snacks: "零食",
    frozen: "冷冻",
    dairy: "乳制品",
    household: "家居",
    care: "护理",
    popular: "热卖",
    items: "件商品",
    outOfStock: "售罄",
    noResults: "找不到商品",
    tryOther: "尝试其他搜索词",
    cart: "购物车",
    emptyCart: "购物车是空的",
    tapToAdd: "点击商品添加",
    clear: "清空",
    subtotal: "小计",
    tax: "税项",
    total: "合计",
    charge: "结账",
    pay: "付款",
    cash: "现金",
    card: "刷卡",
    qrPay: "扫码支付",
    cancel: "取消",
    processing: "付款处理中...",
    paymentSuccess: "付款成功",
    paymentFailed: "付款失败",
    tryAgain: "重试",
    newOrder: "新订单",
    amountDue: "应付金额",
    orderNumber: "订单编号",
    thankYou: "谢谢光临！",
    receiptSent: "收据已发送",
    checkout: "结账",
    takePayment: "收款",
    orderSummary: "订单摘要",
    discount: "折扣",
    serviceFee: "服务费",
    itemCount: "件商品",
    selectPayment: "选择付款方式",
    tapCard: "拍卡",
    insertCard: "插卡",
    scanQr: "扫码",
    cashPayment: "现金付款",
    readyToTap: "准备拍卡",
    presentCard: "请出示信用卡或手机",
    waitingForCard: "等待拍卡...",
    enterCashReceived: "输入收到金额",
    cashReceived: "收到现金",
    changeDue: "找零",
    exactAmount: "刚好",
    confirmCash: "确认收款",
    scanToPay: "请扫描二维码付款",
    waitingForPayment: "等待付款...",
    printReceipt: "打印收据",
    emailReceipt: "邮件收据",
    noReceipt: "不需要收据",
    done: "完成",
    payAnother: "继续收款",
    terminalConnected: "终端已连接",
    terminalMode: "终端模式",
    history: "记录",
    receipts: "单据",
  },
  en: {
    search: "Search items...",
    member: "Member",
    language: "Language",
    all: "All",
    beverages: "Drinks",
    snacks: "Snacks",
    frozen: "Frozen",
    dairy: "Dairy",
    household: "Home",
    care: "Care",
    popular: "Popular",
    items: "items",
    outOfStock: "Sold out",
    noResults: "No items found",
    tryOther: "Try a different search",
    cart: "Cart",
    emptyCart: "Cart is empty",
    tapToAdd: "Tap items to add",
    clear: "Clear",
    subtotal: "Subtotal",
    tax: "Tax",
    total: "Total",
    charge: "Charge",
    pay: "Pay",
    cash: "Cash",
    card: "Card",
    qrPay: "QR Pay",
    cancel: "Cancel",
    processing: "Processing payment...",
    paymentSuccess: "Payment successful",
    paymentFailed: "Payment failed",
    tryAgain: "Try again",
    newOrder: "New order",
    amountDue: "Amount due",
    orderNumber: "Order #",
    thankYou: "Thank you!",
    receiptSent: "Receipt sent",
    checkout: "Checkout",
    takePayment: "Take payment",
    orderSummary: "Order summary",
    discount: "Discount",
    serviceFee: "Service fee",
    itemCount: "items",
    selectPayment: "Select payment method",
    tapCard: "Tap",
    insertCard: "Insert",
    scanQr: "Scan QR",
    cashPayment: "Cash",
    readyToTap: "Ready to tap",
    presentCard: "Present card or device",
    waitingForCard: "Waiting for card...",
    enterCashReceived: "Enter cash received",
    cashReceived: "Cash received",
    changeDue: "Change due",
    exactAmount: "Exact",
    confirmCash: "Confirm payment",
    scanToPay: "Scan QR code to pay",
    waitingForPayment: "Waiting for payment...",
    printReceipt: "Print receipt",
    emailReceipt: "Email receipt",
    noReceipt: "No receipt",
    done: "Done",
    payAnother: "Next order",
    terminalConnected: "Terminal connected",
    terminalMode: "Terminal mode",
    history: "History",
    receipts: "Receipts",
  },
  pt: {
    search: "Pesquisar produtos...",
    member: "Membro",
    language: "Idioma",
    all: "Todos",
    beverages: "Bebidas",
    snacks: "Lanches",
    frozen: "Congelados",
    dairy: "Laticínios",
    household: "Casa",
    care: "Cuidados",
    popular: "Popular",
    items: "produtos",
    outOfStock: "Esgotado",
    noResults: "Nenhum produto encontrado",
    tryOther: "Tente outra pesquisa",
    cart: "Carrinho",
    emptyCart: "Carrinho vazio",
    tapToAdd: "Toque para adicionar",
    clear: "Limpar",
    subtotal: "Subtotal",
    tax: "Imposto",
    total: "Total",
    charge: "Cobrar",
    pay: "Pagar",
    cash: "Dinheiro",
    card: "Cartão",
    qrPay: "QR Pay",
    cancel: "Cancelar",
    processing: "Processando pagamento...",
    paymentSuccess: "Pagamento bem-sucedido",
    paymentFailed: "Pagamento falhou",
    tryAgain: "Tentar novamente",
    newOrder: "Novo pedido",
    amountDue: "Valor a pagar",
    orderNumber: "Pedido nº",
    thankYou: "Obrigado!",
    receiptSent: "Recibo enviado",
    checkout: "Finalizar",
    takePayment: "Receber pagamento",
    orderSummary: "Resumo do pedido",
    discount: "Desconto",
    serviceFee: "Taxa de serviço",
    itemCount: "produtos",
    selectPayment: "Selecione o método de pagamento",
    tapCard: "Aproximar",
    insertCard: "Inserir",
    scanQr: "QR Code",
    cashPayment: "Dinheiro",
    readyToTap: "Pronto para aproximar",
    presentCard: "Apresente o cartão ou dispositivo",
    waitingForCard: "Aguardando cartão...",
    enterCashReceived: "Insira o valor recebido",
    cashReceived: "Dinheiro recebido",
    changeDue: "Troco",
    exactAmount: "Exato",
    confirmCash: "Confirmar pagamento",
    scanToPay: "Escaneie o QR code para pagar",
    waitingForPayment: "Aguardando pagamento...",
    printReceipt: "Imprimir recibo",
    emailReceipt: "Enviar recibo",
    noReceipt: "Sem recibo",
    done: "Concluído",
    payAnother: "Próximo pedido",
    terminalConnected: "Terminal conectado",
    terminalMode: "Modo terminal",
    history: "Histórico",
    receipts: "Recibos",
  },
  ja: {
    search: "商品を検索...",
    member: "会員",
    language: "言語",
    all: "すべて",
    beverages: "ドリンク",
    snacks: "スナック",
    frozen: "冷凍",
    dairy: "乳製品",
    household: "日用品",
    care: "ケア",
    popular: "人気",
    items: "件の商品",
    outOfStock: "売り切れ",
    noResults: "商品が見つかりません",
    tryOther: "他のキーワードをお試しください",
    cart: "カート",
    emptyCart: "カートは空です",
    tapToAdd: "商品をタップして追加",
    clear: "クリア",
    subtotal: "小計",
    tax: "税",
    total: "合計",
    charge: "会計",
    pay: "支払い",
    cash: "現金",
    card: "カード",
    qrPay: "QR決済",
    cancel: "キャンセル",
    processing: "支払い処理中...",
    paymentSuccess: "支払い完了",
    paymentFailed: "支払い失敗",
    tryAgain: "再試行",
    newOrder: "新規注文",
    amountDue: "お支払い金額",
    orderNumber: "注文番号",
    thankYou: "ありがとうございます！",
    receiptSent: "レシート送信済み",
    checkout: "お会計",
    takePayment: "お支払い",
    orderSummary: "注文内容",
    discount: "割引",
    serviceFee: "サービス料",
    itemCount: "件の商品",
    selectPayment: "お支払い方法を選択",
    tapCard: "タッチ",
    insertCard: "挿入",
    scanQr: "QR決済",
    cashPayment: "現金",
    readyToTap: "タッチしてください",
    presentCard: "カードまたはデバイスをかざしてください",
    waitingForCard: "カードを待っています...",
    enterCashReceived: "受取金額を入力",
    cashReceived: "お預かり",
    changeDue: "お釣り",
    exactAmount: "ちょうど",
    confirmCash: "支払い確認",
    scanToPay: "QRコードをスキャンしてお支払い",
    waitingForPayment: "支払いを待っています...",
    printReceipt: "レシート印刷",
    emailReceipt: "レシート送信",
    noReceipt: "レシート不要",
    done: "完了",
    payAnother: "次の注文",
    terminalConnected: "端末接続済み",
    terminalMode: "端末モード",
    history: "履歴",
    receipts: "レシート",
  },
};

export function t(locale: Locale, key: keyof TranslationKeys): string {
  return translations[locale]?.[key] || translations.en[key] || key;
}

export function getProductName(
  product: { name: string; nameCn: string; nameTc?: string; nameSc?: string; nameJa?: string; namePt?: string },
  locale: Locale
): string {
  switch (locale) {
    case "tc": return product.nameTc || product.nameCn || product.name;
    case "sc": return product.nameSc || product.nameCn || product.name;
    case "ja": return product.nameJa || product.nameCn || product.name;
    case "pt": return product.namePt || product.name;
    default: return product.name;
  }
}
