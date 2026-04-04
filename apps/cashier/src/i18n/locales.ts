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
  cancel: string;
  addFilter: string;
  member: string;
  lock: string;
  logout: string;
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
  variants: string;
  variantsAvailable: string;
  selectOptions: string;
  addToCartWith: string;
  inStock: string;
  unlimitedStock: string;

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

  // Receipt template
  receiptOrder: string;
  receiptDate: string;
  receiptSubtotal: string;
  receiptTax: string;
  receiptTotal: string;
  receiptPayment: string;
  receiptCashReceived: string;
  receiptChange: string;
  receiptThankYou: string;
  receiptReprint: string;
  receiptPrinting: string;

  // History page
  orderHistory: string;
  historyOrders: string;
  noOrdersYet: string;
  ordersWillAppear: string;
  historyItems: string;
  historyItem: string;
  historyPayment: string;
  status_completed: string;
  status_pending: string;
  status_refunded: string;
  status_voided: string;

  // History filters
  filterThisShift: string;
  filterToday: string;
  filterYesterday: string;
  filterLast7Days: string;
  filterClear: string;
  searchOrderNumber: string;
  noMatchingOrders: string;
  tryAdjustFilters: string;
  loadingOrders: string;
  currentShift: string;

  // Error
  paymentFailedHint: string;

  // Shift
  shiftStart: string;
  shiftStartSub: string;
  shiftOpeningFloat: string;
  shiftFloatHint: string;
  shiftStartBtn: string;
  shiftStarting: string;
  shiftFloatZero: string;
  shiftSummary: string;
  shiftDuration: string;
  shiftOrders: string;
  shiftSales: string;
  shiftPaymentBreakdown: string;
  shiftExpectedCash: string;
  shiftEndBtn: string;
  shiftEnd: string;
  shiftEndSub: string;
  shiftActualCash: string;
  shiftVariance: string;
  shiftWithinTolerance: string;
  shiftOverTolerance: string;
  shiftNotes: string;
  shiftNotesPlaceholder: string;
  shiftCloseBtn: string;
  shiftClosing: string;
  shiftClosed: string;
};

const translations: Record<Locale, TranslationKeys> = {
  tc: {
    search: "搜尋商品...",
    cancel: "取消",
    addFilter: "新增篩選...",
    member: "會員",
    lock: "鎖定",
    logout: "登出",
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
    variants: "多款",
    variantsAvailable: "{count} 款可選",
    selectOptions: "請選擇規格",
    addToCartWith: "加入購物車 · MOP {price}",
    inStock: "{count} 件有貨",
    unlimitedStock: "庫存充足",
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
    receiptOrder: "訂單",
    receiptDate: "日期",
    receiptSubtotal: "小計",
    receiptTax: "稅額",
    receiptTotal: "合計",
    receiptPayment: "付款方式",
    receiptCashReceived: "收到現金",
    receiptChange: "找零",
    receiptThankYou: "多謝光臨！",
    receiptReprint: "重印收據",
    receiptPrinting: "列印中...",
    orderHistory: "訂單紀錄",
    historyOrders: "張訂單",
    noOrdersYet: "暫無訂單",
    ordersWillAppear: "完成訂單後會顯示在此處",
    historyItems: "件",
    historyItem: "件",
    historyPayment: "付款方式",
    status_completed: "已完成",
    status_pending: "處理中",
    status_refunded: "已退款",
    status_voided: "已作廢",
    filterThisShift: "本班",
    filterToday: "今天",
    filterYesterday: "昨天",
    filterLast7Days: "近7天",
    filterClear: "清除",
    searchOrderNumber: "搜尋訂單編號...",
    noMatchingOrders: "沒有符合的訂單",
    tryAdjustFilters: "請調整篩選條件",
    loadingOrders: "載入中...",
    currentShift: "本班",
    paymentFailedHint: "請重試或選擇其他付款方式",
    shiftStart: "開始輪更",
    shiftStartSub: "登入後開始你的輪更",
    shiftOpeningFloat: "開班金額 (MOP)",
    shiftFloatHint: "開始前請點算現金",
    shiftStartBtn: "開始輪更",
    shiftStarting: "開始中...",
    shiftFloatZero: "如無現金可輸入 0",
    shiftSummary: "輪更摘要",
    shiftDuration: "時長",
    shiftOrders: "訂單",
    shiftSales: "銷售",
    shiftPaymentBreakdown: "付款方式明細",
    shiftExpectedCash: "應有現金",
    shiftEndBtn: "結束輪更",
    shiftEnd: "結束輪更",
    shiftEndSub: "請點算現金",
    shiftActualCash: "實際現金",
    shiftVariance: "差異",
    shiftWithinTolerance: "在容許範圍內 (±MOP 5)",
    shiftOverTolerance: "超出容許範圍 — 需經理審批",
    shiftNotes: "備註（選填）",
    shiftNotesPlaceholder: "添加輪更備註...",
    shiftCloseBtn: "結束輪更",
    shiftClosing: "結束中...",
    shiftClosed: "輪更已結束",
  },
  sc: {
    search: "搜索商品...",
    cancel: "取消",
    addFilter: "添加筛选...",
    member: "会员",
    lock: "锁定",
    logout: "登出",
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
    variants: "多款",
    variantsAvailable: "{count} 款可选",
    selectOptions: "请选择规格",
    addToCartWith: "加入购物车 · MOP {price}",
    inStock: "{count} 件有货",
    unlimitedStock: "库存充足",
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
    receiptOrder: "订单",
    receiptDate: "日期",
    receiptSubtotal: "小计",
    receiptTax: "税额",
    receiptTotal: "合计",
    receiptPayment: "付款方式",
    receiptCashReceived: "收到现金",
    receiptChange: "找零",
    receiptThankYou: "感谢光临！",
    receiptReprint: "重印收据",
    receiptPrinting: "打印中...",
    orderHistory: "订单记录",
    historyOrders: "张订单",
    noOrdersYet: "暂无订单",
    ordersWillAppear: "完成订单后会显示在此处",
    historyItems: "件",
    historyItem: "件",
    historyPayment: "付款方式",
    status_completed: "已完成",
    status_pending: "处理中",
    status_refunded: "已退款",
    status_voided: "已作废",
    filterThisShift: "本班",
    filterToday: "今天",
    filterYesterday: "昨天",
    filterLast7Days: "近7天",
    filterClear: "清除",
    searchOrderNumber: "搜索订单编号...",
    noMatchingOrders: "没有符合的订单",
    tryAdjustFilters: "请调整筛选条件",
    loadingOrders: "加载中...",
    currentShift: "本班",
    paymentFailedHint: "请重试或选择其他付款方式",
    shiftStart: "开始轮更",
    shiftStartSub: "登入后开始你的轮更",
    shiftOpeningFloat: "开班金额 (MOP)",
    shiftFloatHint: "开始前请点算现金",
    shiftStartBtn: "开始轮更",
    shiftStarting: "开始中...",
    shiftFloatZero: "如无现金可输入 0",
    shiftSummary: "轮更摘要",
    shiftDuration: "时长",
    shiftOrders: "订单",
    shiftSales: "销售",
    shiftPaymentBreakdown: "付款方式明细",
    shiftExpectedCash: "应有现金",
    shiftEndBtn: "结束轮更",
    shiftEnd: "结束轮更",
    shiftEndSub: "请点算现金",
    shiftActualCash: "实际现金",
    shiftVariance: "差异",
    shiftWithinTolerance: "在容许范围内 (±MOP 5)",
    shiftOverTolerance: "超出容许范围 — 需经理审批",
    shiftNotes: "备注（选填）",
    shiftNotesPlaceholder: "添加轮更备注...",
    shiftCloseBtn: "结束轮更",
    shiftClosing: "结束中...",
    shiftClosed: "轮更已结束",
  },
  en: {
    search: "Search items...",
    cancel: "Cancel",
    addFilter: "Add filter...",
    member: "Member",
    lock: "Lock",
    logout: "Logout",
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
    variants: "Options",
    variantsAvailable: "{count} variants available",
    selectOptions: "Select options",
    addToCartWith: "Add to cart · MOP {price}",
    inStock: "{count} in stock",
    unlimitedStock: "Unlimited stock",
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
    receiptOrder: "Order",
    receiptDate: "Date",
    receiptSubtotal: "Subtotal",
    receiptTax: "Tax",
    receiptTotal: "Total",
    receiptPayment: "Payment",
    receiptCashReceived: "Cash received",
    receiptChange: "Change",
    receiptThankYou: "Thank you!",
    receiptReprint: "Reprint receipt",
    receiptPrinting: "Printing...",
    orderHistory: "Order History",
    historyOrders: "orders",
    noOrdersYet: "No orders yet",
    ordersWillAppear: "Orders will appear here once completed",
    historyItems: "items",
    historyItem: "item",
    historyPayment: "Payment",
    status_completed: "Completed",
    status_pending: "Pending",
    status_refunded: "Refunded",
    status_voided: "Voided",
    filterThisShift: "This Shift",
    filterToday: "Today",
    filterYesterday: "Yesterday",
    filterLast7Days: "Last 7 Days",
    filterClear: "Clear",
    searchOrderNumber: "Search order number...",
    noMatchingOrders: "No matching orders",
    tryAdjustFilters: "Try adjusting your filters",
    loadingOrders: "Loading...",
    currentShift: "Current shift",
    paymentFailedHint: "Please try again or use another method",
    shiftStart: "Start Your Shift",
    shiftStartSub: "Sign in to start your shift",
    shiftOpeningFloat: "Opening Cash Float (MOP)",
    shiftFloatHint: "Count your cash drawer before starting",
    shiftStartBtn: "Start Shift",
    shiftStarting: "Opening...",
    shiftFloatZero: "Enter 0 if no cash float",
    shiftSummary: "Shift Summary",
    shiftDuration: "Duration",
    shiftOrders: "Orders",
    shiftSales: "Sales",
    shiftPaymentBreakdown: "Payment Breakdown",
    shiftExpectedCash: "Expected Cash",
    shiftEndBtn: "End Shift",
    shiftEnd: "End Shift",
    shiftEndSub: "Count your cash drawer",
    shiftActualCash: "Actual Cash Counted",
    shiftVariance: "Variance",
    shiftWithinTolerance: "Within tolerance (±MOP 5)",
    shiftOverTolerance: "Exceeds tolerance — requires manager approval",
    shiftNotes: "Notes (optional)",
    shiftNotesPlaceholder: "Add any notes about this shift...",
    shiftCloseBtn: "Close Shift",
    shiftClosing: "Closing...",
    shiftClosed: "Shift Closed",
  },
  pt: {
    search: "Pesquisar produtos...",
    cancel: "Cancelar",
    addFilter: "Adicionar filtro...",
    member: "Membro",
    lock: "Bloquear",
    logout: "Sair",
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
    variants: "Opções",
    variantsAvailable: "{count} variantes disponíveis",
    selectOptions: "Selecionar opções",
    addToCartWith: "Adicionar · MOP {price}",
    inStock: "{count} em estoque",
    unlimitedStock: "Estoque ilimitado",
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
    receiptOrder: "Pedido",
    receiptDate: "Data",
    receiptSubtotal: "Subtotal",
    receiptTax: "Imposto",
    receiptTotal: "Total",
    receiptPayment: "Pagamento",
    receiptCashReceived: "Dinheiro recebido",
    receiptChange: "Troco",
    receiptThankYou: "Obrigado!",
    receiptReprint: "Reimprimir recibo",
    receiptPrinting: "A imprimir...",
    orderHistory: "Histórico de Pedidos",
    historyOrders: "pedidos",
    noOrdersYet: "Sem pedidos ainda",
    ordersWillAppear: "Os pedidos aparecerão aqui após a conclusão",
    historyItems: "itens",
    historyItem: "item",
    historyPayment: "Pagamento",
    status_completed: "Concluído",
    status_pending: "Pendente",
    status_refunded: "Reembolsado",
    status_voided: "Anulado",
    filterThisShift: "Este Turno",
    filterToday: "Hoje",
    filterYesterday: "Ontem",
    filterLast7Days: "Últimos 7 Dias",
    filterClear: "Limpar",
    searchOrderNumber: "Pesquisar número do pedido...",
    noMatchingOrders: "Nenhum pedido encontrado",
    tryAdjustFilters: "Tente ajustar os filtros",
    loadingOrders: "A carregar...",
    currentShift: "Turno atual",
    paymentFailedHint: "Por favor, tente novamente ou use outro método",
    shiftStart: "Iniciar Turno",
    shiftStartSub: "Inicie sessão para começar o turno",
    shiftOpeningFloat: "Fundo de Caixa (MOP)",
    shiftFloatHint: "Conte a gaveta antes de começar",
    shiftStartBtn: "Iniciar Turno",
    shiftStarting: "A iniciar...",
    shiftFloatZero: "Insira 0 se não houver fundo",
    shiftSummary: "Resumo do Turno",
    shiftDuration: "Duração",
    shiftOrders: "Pedidos",
    shiftSales: "Vendas",
    shiftPaymentBreakdown: "Métodos de Pagamento",
    shiftExpectedCash: "Dinheiro Esperado",
    shiftEndBtn: "Terminar Turno",
    shiftEnd: "Terminar Turno",
    shiftEndSub: "Conte a gaveta",
    shiftActualCash: "Dinheiro Contado",
    shiftVariance: "Variação",
    shiftWithinTolerance: "Dentro da tolerância (±MOP 5)",
    shiftOverTolerance: "Excede tolerância — aprovação do gerente necessária",
    shiftNotes: "Notas (opcional)",
    shiftNotesPlaceholder: "Adicionar notas sobre este turno...",
    shiftCloseBtn: "Fechar Turno",
    shiftClosing: "A fechar...",
    shiftClosed: "Turno Fechado",
  },
  ja: {
    search: "商品を検索...",
    cancel: "キャンセル",
    addFilter: "フィルターを追加...",
    member: "会員",
    lock: "ロック",
    logout: "ログアウト",
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
    variants: "バリエーション",
    variantsAvailable: "{count} 種類あり",
    selectOptions: "オプションを選択",
    addToCartWith: "カートに追加 · MOP {price}",
    inStock: "{count} 在庫あり",
    unlimitedStock: "在庫無制限",
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
    receiptOrder: "注文番号",
    receiptDate: "日付",
    receiptSubtotal: "小計",
    receiptTax: "税額",
    receiptTotal: "合計",
    receiptPayment: "お支払い",
    receiptCashReceived: "お預り",
    receiptChange: "お釣り",
    receiptThankYou: "ありがとうございました！",
    receiptReprint: "レシート再印刷",
    receiptPrinting: "印刷中...",
    orderHistory: "注文履歴",
    historyOrders: "件の注文",
    noOrdersYet: "注文はまだありません",
    ordersWillAppear: "注文が完了するとここに表示されます",
    historyItems: "点",
    historyItem: "点",
    historyPayment: "支払い方法",
    status_completed: "完了",
    status_pending: "保留中",
    status_refunded: "返金済み",
    status_voided: "無効",
    filterThisShift: "このシフト",
    filterToday: "今日",
    filterYesterday: "昨日",
    filterLast7Days: "過去7日間",
    filterClear: "クリア",
    searchOrderNumber: "注文番号を検索...",
    noMatchingOrders: "該当する注文がありません",
    tryAdjustFilters: "フィルターを調整してください",
    loadingOrders: "読み込み中...",
    currentShift: "現在のシフト",
    paymentFailedHint: "もう一度お試しいただくか、別の方法をご利用ください",
    shiftStart: "シフト開始",
    shiftStartSub: "サインインしてシフトを開始",
    shiftOpeningFloat: "開始時現金 (MOP)",
    shiftFloatHint: "開始前にレジの現金を数えてください",
    shiftStartBtn: "シフト開始",
    shiftStarting: "開始中...",
    shiftFloatZero: "現金がない場合は0を入力",
    shiftSummary: "シフト概要",
    shiftDuration: "経過時間",
    shiftOrders: "注文",
    shiftSales: "売上",
    shiftPaymentBreakdown: "支払方法内訳",
    shiftExpectedCash: "想定現金",
    shiftEndBtn: "シフト終了",
    shiftEnd: "シフト終了",
    shiftEndSub: "レジの現金を数えてください",
    shiftActualCash: "実際の現金",
    shiftVariance: "差異",
    shiftWithinTolerance: "許容範囲内 (±MOP 5)",
    shiftOverTolerance: "許容範囲超過 — マネージャー承認が必要",
    shiftNotes: "メモ（任意）",
    shiftNotesPlaceholder: "このシフトのメモを追加...",
    shiftCloseBtn: "シフト終了",
    shiftClosing: "終了中...",
    shiftClosed: "シフト終了",
  },
};

export function t(locale: Locale, key: keyof TranslationKeys): string {
  return translations[locale]?.[key] || translations.en[key] || key;
}

/**
 * Get the product display name for a given locale.
 *
 * Logic:
 * 1. If translations[locale] exists → show it
 * 2. Otherwise → fall back to product.name (the merchant's default name)
 *
 * The `name` field is the merchant's primary product name — displayed
 * regardless of system language when no translation is available.
 */
export function getProductName(
  product: { name: string; translations?: Record<string, string> | null },
  locale: Locale
): string {
  const trans = product.translations;
  if (trans && trans[locale]) return trans[locale];
  return product.name;
}
