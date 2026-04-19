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
  update: string;
  logout: string;
  language: string;
  theme: string;
  settings: string;
  keypad: string;
  keypadDesc: string;
  customItem: string;
  addNote: string;
  keypadNotePlaceholder: string;
  confirm: string;
  library: string;
  favorites: string;
  favoritesDesc: string;
  removeFavoriteTitle: string;
  removeFavoriteHint: string;
  addCustomer: string;
  searchByPhone: string;
  scanMembership: string;
  noCustomerFound: string;
  customerLinked: string;
  customerProfile: string;
  phone: string;
  email: string;
  memberSince: string;
  lastVisit: string;
  totalSpent: string;
  cashierTab: string;
  orders: string;
  reportsTab: string;
  drawerReport: string;
  salesReport: string;
  allOrders: string;
  posOrders: string;
  onlineOrders: string;
  totalSales: string;
  avgOrder: string;
  refunds: string;
  notes: string;
  removeCustomer: string;

  // Drawer ledger
  drawerLedger: string;
  drawerTime: string;
  drawerEvent: string;
  drawerIn: string;
  drawerOut: string;
  drawerBalance: string;
  drawerNoEntries: string;
  eventOpeningFloat: string;
  eventCashSale: string;
  eventChangeGiven: string;
  eventRefund: string;
  eventShiftClose: string;

  // Payment methods (shared)
  paymentCash: string;
  paymentCardTap: string;
  paymentCardInsert: string;
  paymentQr: string;
  paymentSubTap: string;
  paymentSubInsert: string;
  paymentSubQr: string;
  paymentUnknown: string;

  // Lock screen
  lockTooManyAttempts: string;
  lockInvalidPin: string;
  lockConnectionError: string;
  lockOffline: string;
  lockOnline: string;
  lockRefresh: string;
  lockReloadTitle: string;
  lockReloadMessage: string;
  lockReloadChecking: string;
  lockReloadCancel: string;
  lockReloadConfirm: string;

  // Preload
  preloadTitle: string;
  preloadImages: string;
  preloadSkip: string;

  // Update banner
  updateAvailableTitle: string;
  updateAvailableBody: string;
  updateAvailableReload: string;
  updateAvailableLater: string;

  // Misc
  receiptDiscount: string;
  startShiftToSeeDrawer: string;
  comingSoon: string;
  pointsAbbrev: string;
  searchMoreResults: string;
  scanBarcode: string;
  scanAdded: string;
  scanCustomerLinked: string;
  scanNotFound: string;
  scanError: string;
  scanSearchOnline: string;
  scanDismiss: string;
  scanLookupSearching: string;
  scanLookupFoundFrom: string;
  scanLookupFoundFromCn: string;
  scanLookupFoundFromJp: string;
  scanLookupFoundFromUs: string;
  scanLookupBrand: string;
  scanLookupCategory: string;
  scanLookupOrigin: string;
  scanLookupRegisteredTitle: string;
  scanLookupRegisteredBody: string;
  scanLookupErrorTimeout: string;
  scanLookupErrorAuth: string;
  scanLookupErrorGeneric: string;
  scanAddToCart: string;
  tempProductTitle: string;
  tempProductFromGs1Hk: string;
  tempProductFromGs1Cn: string;
  tempProductFromGs1Jp: string;
  tempProductFromGs1Us: string;

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
  addDiscount: string;
  applyDiscount: string;
  percentage: string;
  serviceFee: string;
  itemCount: string;
  selectPayment: string;
  tapCard: string;
  insertCard: string;
  scanQr: string;
  scanWallet: string;
  paymentSubScanWallet: string;
  scanWalletPrompt: string;
  scanWalletHint: string;
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
  terminalOffline: string;
  terminalMode: string;
  orderSavedOffline: string;
  orderSavedOfflineHint: string;
  pendingOrders: string;
  ordersSynced: string;

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
  status_new: string;
  status_completed: string;
  status_pending: string;
  status_refunded: string;
  status_voided: string;
  voidOrder: string;
  refundOrder: string;
  resumePayment: string;
  parkOrder: string;
  comingSoonToast: string;
  voidConfirmTitle: string;
  refundConfirmTitle: string;
  voidConfirmBody: string;
  refundConfirmBody: string;
  cashRefundAmount: string;
  voidUnpaidConfirmTitle: string;
  voidUnpaidConfirmBody: string;

  // History filters
  filterThisShift: string;
  filterToday: string;
  filterYesterday: string;
  filterLast7Days: string;
  filterAll: string;
  filterQuick: string;
  filterCustomRange: string;
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
    update: "更新",
    logout: "登出",
    language: "語言",
    theme: "主題",
    settings: "設定",
    keypad: "鍵盤",
    keypadDesc: "自訂品項及定價",
    customItem: "自訂品項",
    addNote: "備註",
    keypadNotePlaceholder: "輸入品項描述...",
    confirm: "確認",
    library: "商品庫",
    favorites: "收藏",
    favoritesDesc: "尚未收藏任何商品",
    removeFavoriteTitle: "取消收藏？",
    removeFavoriteHint: "此商品將從收藏清單中移除",
    addCustomer: "新增顧客",
    searchByPhone: "輸入手機號碼搜尋...",
    scanMembership: "掃描會員碼",
    noCustomerFound: "找不到顧客",
    customerLinked: "已連結顧客",
    customerProfile: "顧客資料",
    phone: "電話",
    email: "電郵",
    memberSince: "加入日期",
    lastVisit: "最近到訪",
    totalSpent: "累計消費",
    cashierTab: "收銀台",
    orders: "訂單",
    reportsTab: "報表",
    drawerReport: "現金錢櫃",
    salesReport: "銷售",
    allOrders: "全部訂單",
    posOrders: "門店",
    onlineOrders: "線上",
    totalSales: "總銷售",
    avgOrder: "平均訂單",
    refunds: "退款",
    notes: "備註",
    removeCustomer: "移除顧客",
    drawerLedger: "現金錢櫃記錄",
    drawerTime: "時間",
    drawerEvent: "事件",
    drawerIn: "收入",
    drawerOut: "支出",
    drawerBalance: "結餘",
    drawerNoEntries: "暫無記錄",
    eventOpeningFloat: "開工備用金",
    eventCashSale: "現金銷售",
    eventChangeGiven: "找零",
    eventRefund: "退款",
    eventShiftClose: "收班結算",
    paymentCash: "現金",
    paymentCardTap: "拍卡",
    paymentCardInsert: "插卡",
    paymentQr: "掃碼支付",
    paymentSubTap: "NFC / Apple Pay",
    paymentSubInsert: "晶片 / 刷卡",
    paymentSubQr: "支付寶 / 微信",
    paymentUnknown: "未知",
    lockTooManyAttempts: "嘗試次數過多，正在登出...",
    lockInvalidPin: "PIN碼錯誤（剩餘{remaining}次）",
    lockConnectionError: "連接錯誤，請重試。",
    lockOffline: "離線中",
    lockOnline: "已連線",
    lockRefresh: "重新整理",
    lockReloadTitle: "重新載入應用程式",
    lockReloadMessage: "確定要重新載入嗎？",
    lockReloadChecking: "正在檢查連線...",
    lockReloadCancel: "取消",
    lockReloadConfirm: "重新載入",
    preloadTitle: "正在準備商品資料",
    preloadImages: "張圖片",
    preloadSkip: "跳過",
    updateAvailableTitle: "有新版本可用",
    updateAvailableBody: "請重新載入以繼續使用。",
    updateAvailableReload: "重新載入",
    updateAvailableLater: "稍後",
    receiptDiscount: "折扣",
    startShiftToSeeDrawer: "開始班次以查看錢櫃",
    comingSoon: "即將推出",
    pointsAbbrev: "積分",
    searchMoreResults: "還有{count}個",
    scanBarcode: "掃描條碼",
    scanAdded: "已加入：{name}",
    scanCustomerLinked: "已連結會員：{name}",
    scanNotFound: "找不到條碼：{code}",
    scanError: "掃描失敗：{code}",
    scanSearchOnline: "上網搜尋",
    scanDismiss: "關閉",
    scanLookupSearching: "正在查詢條碼資料庫…",
    scanLookupFoundFrom: "來自 GS1 香港",
    scanLookupFoundFromCn: "來自 GS1 中國",
    scanLookupFoundFromJp: "來自日本商店",
    scanLookupFoundFromUs: "來自 UPCItemDB",
    scanLookupBrand: "品牌",
    scanLookupCategory: "類別",
    scanLookupOrigin: "產地",
    scanLookupRegisteredTitle: "條碼已登記",
    scanLookupRegisteredBody: "此條碼屬有效 GS1 條碼，但產品資料尚未上傳。可直接建立臨時商品。",
    scanLookupErrorTimeout: "查詢逾時，請檢查網絡後重試。",
    scanLookupErrorAuth: "條碼資料庫授權失效，請聯絡管理員。",
    scanLookupErrorGeneric: "條碼資料庫暫時無法查詢。",
    scanAddToCart: "加入購物車",
    tempProductTitle: "輸入售價",
    tempProductFromGs1Hk: "來自 GS1 香港",
    tempProductFromGs1Cn: "來自 GS1 中國",
    tempProductFromGs1Jp: "來自日本商店",
    tempProductFromGs1Us: "來自 UPCItemDB",
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
    addToCartWith: "加入購物車 · {currency} {price}",
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
    addDiscount: "新增折扣",
    applyDiscount: "套用折扣",
    percentage: "百分比",
    serviceFee: "服務費",
    itemCount: "件商品",
    selectPayment: "選擇付款方式",
    tapCard: "拍卡",
    insertCard: "插卡",
    scanQr: "掃碼",
    scanWallet: "掃描錢包",
    paymentSubScanWallet: "掃描客戶二維碼",
    scanWalletPrompt: "請掃描客戶錢包二維碼",
    scanWalletHint: "將掃碼器對準客戶手機屏幕",
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
    terminalOffline: "離線",
    terminalMode: "終端模式",
    orderSavedOffline: "訂單已本地儲存",
    orderSavedOfflineHint: "連線恢復後將自動同步",
    pendingOrders: "待同步",
    ordersSynced: "訂單已同步",
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
    status_new: "待付款",
    status_completed: "已完成",
    status_pending: "處理中",
    status_refunded: "已退款",
    status_voided: "已作廢",
    voidOrder: "作廢訂單",
    refundOrder: "退款",
    resumePayment: "繼續付款",
    parkOrder: "掛單",
    comingSoonToast: "即將推出",
    voidConfirmTitle: "確定作廢此訂單？",
    refundConfirmTitle: "確定退款此訂單？",
    voidConfirmBody: "訂單將被取消，庫存將恢復",
    refundConfirmBody: "將退還全額，庫存將恢復",
    cashRefundAmount: "需退還現金",
    voidUnpaidConfirmTitle: "取消此未付款訂單？",
    voidUnpaidConfirmBody: "訂單將被刪除，庫存將恢復",
    filterThisShift: "本班",
    filterToday: "今天",
    filterYesterday: "昨天",
    filterLast7Days: "近7天",
    filterAll: "全部日期",
    filterQuick: "快速選擇",
    filterCustomRange: "自訂日期",
    filterClear: "清除",
    searchOrderNumber: "搜尋訂單編號...",
    noMatchingOrders: "沒有符合的訂單",
    tryAdjustFilters: "請調整篩選條件",
    loadingOrders: "載入中...",
    currentShift: "本班",
    paymentFailedHint: "請重試或選擇其他付款方式",
    shiftStart: "開始輪更",
    shiftStartSub: "登入後開始你的輪更",
    shiftOpeningFloat: "開班金額 ({currency})",
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
    shiftWithinTolerance: "在容許範圍內 (±{currency} 5)",
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
    update: "更新",
    logout: "登出",
    language: "语言",
    theme: "主题",
    settings: "设置",
    keypad: "键盘",
    keypadDesc: "自定义品项及定价",
    customItem: "自定义品项",
    addNote: "备注",
    keypadNotePlaceholder: "输入品项描述...",
    confirm: "确认",
    library: "商品库",
    favorites: "收藏",
    favoritesDesc: "尚未收藏任何商品",
    removeFavoriteTitle: "取消收藏？",
    removeFavoriteHint: "此商品将从收藏列表中移除",
    addCustomer: "添加顾客",
    searchByPhone: "输入手机号码搜索...",
    scanMembership: "扫描会员码",
    noCustomerFound: "找不到顾客",
    customerLinked: "已关联顾客",
    customerProfile: "顾客资料",
    phone: "电话",
    email: "邮箱",
    memberSince: "加入日期",
    lastVisit: "最近到访",
    totalSpent: "累计消费",
    cashierTab: "收银台",
    orders: "订单",
    reportsTab: "报表",
    drawerReport: "现金钱柜",
    salesReport: "销售",
    allOrders: "全部订单",
    posOrders: "门店",
    onlineOrders: "线上",
    totalSales: "总销售",
    avgOrder: "平均订单",
    refunds: "退款",
    notes: "备注",
    removeCustomer: "移除顾客",
    drawerLedger: "现金钱柜记录",
    drawerTime: "时间",
    drawerEvent: "事件",
    drawerIn: "收入",
    drawerOut: "支出",
    drawerBalance: "结余",
    drawerNoEntries: "暂无记录",
    eventOpeningFloat: "开班备用金",
    eventCashSale: "现金销售",
    eventChangeGiven: "找零",
    eventRefund: "退款",
    eventShiftClose: "收班结算",
    paymentCash: "现金",
    paymentCardTap: "拍卡",
    paymentCardInsert: "插卡",
    paymentQr: "扫码支付",
    paymentSubTap: "NFC / Apple Pay",
    paymentSubInsert: "芯片 / 刷卡",
    paymentSubQr: "支付宝 / 微信",
    paymentUnknown: "未知",
    lockTooManyAttempts: "尝试次数过多，正在登出...",
    lockInvalidPin: "PIN码错误（剩余{remaining}次）",
    lockConnectionError: "连接错误，请重试。",
    lockOffline: "离线中",
    lockOnline: "已连线",
    lockRefresh: "重新加载",
    lockReloadTitle: "重新加载应用",
    lockReloadMessage: "确定要重新加载吗？",
    lockReloadChecking: "正在检查连线...",
    lockReloadCancel: "取消",
    lockReloadConfirm: "重新加载",
    preloadTitle: "正在准备商品资料",
    preloadImages: "张图片",
    preloadSkip: "跳过",
    updateAvailableTitle: "有新版本可用",
    updateAvailableBody: "请重新加载以继续使用。",
    updateAvailableReload: "重新加载",
    updateAvailableLater: "稍后",
    receiptDiscount: "折扣",
    startShiftToSeeDrawer: "开始班次以查看钱柜",
    comingSoon: "即将推出",
    pointsAbbrev: "积分",
    searchMoreResults: "还有{count}个",
    scanBarcode: "扫描条码",
    scanAdded: "已加入：{name}",
    scanCustomerLinked: "已链接会员：{name}",
    scanNotFound: "找不到条码：{code}",
    scanError: "扫描失败：{code}",
    scanSearchOnline: "在线搜索",
    scanDismiss: "关闭",
    scanLookupSearching: "正在查询条码数据库…",
    scanLookupFoundFrom: "来自 GS1 香港",
    scanLookupFoundFromCn: "来自 GS1 中国",
    scanLookupFoundFromJp: "来自日本商店",
    scanLookupFoundFromUs: "来自 UPCItemDB",
    scanLookupBrand: "品牌",
    scanLookupCategory: "类别",
    scanLookupOrigin: "产地",
    scanLookupRegisteredTitle: "条码已登记",
    scanLookupRegisteredBody: "此条码是有效的 GS1 条码，但产品资料尚未上传。可直接创建临时商品。",
    scanLookupErrorTimeout: "查询超时，请检查网络后重试。",
    scanLookupErrorAuth: "条码数据库授权失效，请联系管理员。",
    scanLookupErrorGeneric: "条码数据库暂时无法查询。",
    scanAddToCart: "加入购物车",
    tempProductTitle: "输入售价",
    tempProductFromGs1Hk: "来自 GS1 香港",
    tempProductFromGs1Cn: "来自 GS1 中国",
    tempProductFromGs1Jp: "来自日本商店",
    tempProductFromGs1Us: "来自 UPCItemDB",
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
    addToCartWith: "加入购物车 · {currency} {price}",
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
    addDiscount: "添加折扣",
    applyDiscount: "应用折扣",
    percentage: "百分比",
    serviceFee: "服务费",
    itemCount: "件商品",
    selectPayment: "选择付款方式",
    tapCard: "拍卡",
    insertCard: "插卡",
    scanQr: "扫码",
    scanWallet: "扫描钱包",
    paymentSubScanWallet: "扫描客户二维码",
    scanWalletPrompt: "请扫描客户钱包二维码",
    scanWalletHint: "将扫码器对准客户手机屏幕",
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
    terminalOffline: "离线",
    terminalMode: "终端模式",
    orderSavedOffline: "订单已本地保存",
    orderSavedOfflineHint: "恢复连接后将自动同步",
    pendingOrders: "待同步",
    ordersSynced: "订单已同步",
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
    status_new: "待付款",
    status_completed: "已完成",
    status_pending: "处理中",
    status_refunded: "已退款",
    status_voided: "已作废",
    voidOrder: "作废订单",
    refundOrder: "退款",
    resumePayment: "继续付款",
    parkOrder: "挂单",
    comingSoonToast: "即将推出",
    voidConfirmTitle: "确定作废此订单？",
    refundConfirmTitle: "确定退款此订单？",
    voidConfirmBody: "订单将被取消，库存将恢复",
    refundConfirmBody: "将退还全额，库存将恢复",
    cashRefundAmount: "需退还现金",
    voidUnpaidConfirmTitle: "取消此未付款订单？",
    voidUnpaidConfirmBody: "订单将被删除，库存将恢复",
    filterThisShift: "本班",
    filterToday: "今天",
    filterYesterday: "昨天",
    filterLast7Days: "近7天",
    filterAll: "全部日期",
    filterQuick: "快速选择",
    filterCustomRange: "自定义日期",
    filterClear: "清除",
    searchOrderNumber: "搜索订单编号...",
    noMatchingOrders: "没有符合的订单",
    tryAdjustFilters: "请调整筛选条件",
    loadingOrders: "加载中...",
    currentShift: "本班",
    paymentFailedHint: "请重试或选择其他付款方式",
    shiftStart: "开始轮更",
    shiftStartSub: "登入后开始你的轮更",
    shiftOpeningFloat: "开班金额 ({currency})",
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
    shiftWithinTolerance: "在容许范围内 (±{currency} 5)",
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
    update: "Update",
    logout: "Logout",
    language: "Language",
    theme: "Theme",
    settings: "Settings",
    keypad: "Keypad",
    keypadDesc: "Create custom items and pricing",
    customItem: "Custom Item",
    addNote: "Note",
    keypadNotePlaceholder: "Enter item description...",
    confirm: "Confirm",
    library: "Library",
    favorites: "Favorites",
    favoritesDesc: "No favorites yet",
    removeFavoriteTitle: "Remove favorite?",
    removeFavoriteHint: "This item will be removed from favorites",
    addCustomer: "Add Customer",
    searchByPhone: "Enter phone number...",
    scanMembership: "Scan membership",
    noCustomerFound: "No customer found",
    customerLinked: "Customer linked",
    customerProfile: "Customer Profile",
    phone: "Phone",
    email: "Email",
    memberSince: "Member since",
    lastVisit: "Last visit",
    totalSpent: "Total spent",
    cashierTab: "Cashier",
    orders: "Orders",
    reportsTab: "Reports",
    drawerReport: "Drawer",
    salesReport: "Sales",
    allOrders: "All Orders",
    posOrders: "In-store",
    onlineOrders: "Online",
    totalSales: "Total Sales",
    avgOrder: "Avg Order",
    refunds: "Refunds",
    notes: "Notes",
    removeCustomer: "Remove Customer",
    drawerLedger: "Cash Drawer Ledger",
    drawerTime: "Time",
    drawerEvent: "Event",
    drawerIn: "In",
    drawerOut: "Out",
    drawerBalance: "Balance",
    drawerNoEntries: "No entries yet",
    eventOpeningFloat: "Opening Float",
    eventCashSale: "Cash Sale",
    eventChangeGiven: "Change Given",
    eventRefund: "Refund",
    eventShiftClose: "Shift Close",
    paymentCash: "Cash",
    paymentCardTap: "Card (Tap)",
    paymentCardInsert: "Card (Insert)",
    paymentQr: "QR Pay",
    paymentSubTap: "NFC / Apple Pay",
    paymentSubInsert: "Chip / Swipe",
    paymentSubQr: "Alipay / WeChat",
    paymentUnknown: "Unknown",
    lockTooManyAttempts: "Too many attempts. Logging out...",
    lockInvalidPin: "Invalid PIN ({remaining} left)",
    lockConnectionError: "Connection error. Try again.",
    lockOffline: "Offline",
    lockOnline: "Online",
    lockRefresh: "Refresh",
    lockReloadTitle: "Reload App",
    lockReloadMessage: "Are you sure you want to reload?",
    lockReloadChecking: "Checking connection...",
    lockReloadCancel: "Cancel",
    lockReloadConfirm: "Reload",
    preloadTitle: "Preparing product data",
    preloadImages: "images",
    preloadSkip: "Skip",
    updateAvailableTitle: "New version available",
    updateAvailableBody: "Reload to continue using the POS.",
    updateAvailableReload: "Reload",
    updateAvailableLater: "Later",
    receiptDiscount: "Discount",
    startShiftToSeeDrawer: "Start a shift to see drawer",
    comingSoon: "Coming soon",
    pointsAbbrev: "pts",
    searchMoreResults: "+{count} more",
    scanBarcode: "Scan Barcode",
    scanAdded: "Added: {name}",
    scanCustomerLinked: "Customer linked: {name}",
    scanNotFound: "Not found: {code}",
    scanError: "Scan failed: {code}",
    scanSearchOnline: "Search online",
    scanDismiss: "Dismiss",
    scanLookupSearching: "Looking up barcode database…",
    scanLookupFoundFrom: "From GS1 Hong Kong",
    scanLookupFoundFromCn: "From GS1 China",
    scanLookupFoundFromJp: "From Japan marketplace",
    scanLookupFoundFromUs: "From UPCItemDB",
    scanLookupBrand: "Brand",
    scanLookupCategory: "Category",
    scanLookupOrigin: "Origin",
    scanLookupRegisteredTitle: "Registered barcode",
    scanLookupRegisteredBody: "Valid GS1 barcode, but no product details on file. You can still create a temp product.",
    scanLookupErrorTimeout: "Lookup timed out — check your connection and try again.",
    scanLookupErrorAuth: "Barcode database auth expired. Contact the admin.",
    scanLookupErrorGeneric: "Barcode database is unreachable right now.",
    scanAddToCart: "Add to cart",
    tempProductTitle: "Enter price",
    tempProductFromGs1Hk: "From GS1 Hong Kong",
    tempProductFromGs1Cn: "From GS1 China",
    tempProductFromGs1Jp: "From Japan marketplace",
    tempProductFromGs1Us: "From UPCItemDB",
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
    addToCartWith: "Add to cart · {currency} {price}",
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
    addDiscount: "Add Discount",
    applyDiscount: "Apply Discount",
    percentage: "Percentage",
    serviceFee: "Service fee",
    itemCount: "items",
    selectPayment: "Select payment method",
    tapCard: "Tap",
    insertCard: "Insert",
    scanQr: "Scan QR",
    scanWallet: "Scan Wallet",
    paymentSubScanWallet: "Scan customer QR",
    scanWalletPrompt: "Scan customer's wallet QR code",
    scanWalletHint: "Point the scanner at the customer's phone",
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
    terminalOffline: "Offline",
    terminalMode: "Terminal mode",
    orderSavedOffline: "Order saved locally",
    orderSavedOfflineHint: "Will sync when connection returns",
    pendingOrders: "pending",
    ordersSynced: "orders synced",
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
    status_new: "Awaiting payment",
    status_completed: "Completed",
    status_pending: "Pending",
    status_refunded: "Refunded",
    status_voided: "Voided",
    voidOrder: "Void",
    refundOrder: "Refund",
    resumePayment: "Resume payment",
    parkOrder: "Park",
    comingSoonToast: "Coming soon",
    voidConfirmTitle: "Void this order?",
    refundConfirmTitle: "Refund this order?",
    voidConfirmBody: "Order will be cancelled, stock restored",
    refundConfirmBody: "Full amount will be refunded, stock restored",
    cashRefundAmount: "Cash to return",
    voidUnpaidConfirmTitle: "Cancel this unpaid order?",
    voidUnpaidConfirmBody: "Order will be deleted and stock restored",
    filterThisShift: "This Shift",
    filterToday: "Today",
    filterYesterday: "Yesterday",
    filterLast7Days: "Last 7 Days",
    filterAll: "All Dates",
    filterQuick: "Quick Select",
    filterCustomRange: "Custom Range",
    filterClear: "Clear",
    searchOrderNumber: "Search order number...",
    noMatchingOrders: "No matching orders",
    tryAdjustFilters: "Try adjusting your filters",
    loadingOrders: "Loading...",
    currentShift: "Current shift",
    paymentFailedHint: "Please try again or use another method",
    shiftStart: "Start Your Shift",
    shiftStartSub: "Sign in to start your shift",
    shiftOpeningFloat: "Opening Cash Float ({currency})",
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
    shiftWithinTolerance: "Within tolerance (±{currency} 5)",
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
    update: "Atualizar",
    logout: "Sair",
    language: "Idioma",
    theme: "Tema",
    settings: "Definições",
    keypad: "Teclado",
    keypadDesc: "Criar itens e preços personalizados",
    customItem: "Item personalizado",
    addNote: "Nota",
    keypadNotePlaceholder: "Descrição do item...",
    confirm: "Confirmar",
    library: "Biblioteca",
    favorites: "Favoritos",
    favoritesDesc: "Ainda sem favoritos",
    removeFavoriteTitle: "Remover favorito?",
    removeFavoriteHint: "Este item sera removido dos favoritos",
    addCustomer: "Adicionar Cliente",
    searchByPhone: "Introduzir número de telefone...",
    scanMembership: "Digitalizar membro",
    noCustomerFound: "Cliente não encontrado",
    customerLinked: "Cliente associado",
    customerProfile: "Perfil do Cliente",
    phone: "Telefone",
    email: "E-mail",
    memberSince: "Membro desde",
    lastVisit: "Última visita",
    totalSpent: "Total gasto",
    cashierTab: "Caixa",
    orders: "Pedidos",
    reportsTab: "Relatórios",
    drawerReport: "Gaveta",
    salesReport: "Vendas",
    allOrders: "Todos Pedidos",
    posOrders: "Na Loja",
    onlineOrders: "Online",
    totalSales: "Vendas Totais",
    avgOrder: "Pedido Médio",
    refunds: "Reembolsos",
    notes: "Notas",
    removeCustomer: "Remover Cliente",
    drawerLedger: "Registo de Caixa",
    drawerTime: "Hora",
    drawerEvent: "Evento",
    drawerIn: "Entrada",
    drawerOut: "Saída",
    drawerBalance: "Saldo",
    drawerNoEntries: "Sem registos",
    eventOpeningFloat: "Fundo de Caixa",
    eventCashSale: "Venda a Dinheiro",
    eventChangeGiven: "Troco",
    eventRefund: "Reembolso",
    eventShiftClose: "Fecho de Turno",
    paymentCash: "Dinheiro",
    paymentCardTap: "Cartão (Tap)",
    paymentCardInsert: "Cartão (Chip)",
    paymentQr: "QR Pay",
    paymentSubTap: "NFC / Apple Pay",
    paymentSubInsert: "Chip / Banda",
    paymentSubQr: "Alipay / WeChat",
    paymentUnknown: "Desconhecido",
    lockTooManyAttempts: "Demasiadas tentativas. A terminar sessão...",
    lockInvalidPin: "PIN inválido ({remaining} restantes)",
    lockConnectionError: "Erro de conexão. Tente novamente.",
    lockOffline: "Offline",
    lockOnline: "Online",
    lockRefresh: "Atualizar",
    lockReloadTitle: "Recarregar App",
    lockReloadMessage: "Tem a certeza que pretende recarregar?",
    lockReloadChecking: "A verificar ligação...",
    lockReloadCancel: "Cancelar",
    lockReloadConfirm: "Recarregar",
    preloadTitle: "A preparar dados dos produtos",
    preloadImages: "imagens",
    preloadSkip: "Saltar",
    updateAvailableTitle: "Nova versão disponível",
    updateAvailableBody: "Recarregue para continuar a usar o POS.",
    updateAvailableReload: "Recarregar",
    updateAvailableLater: "Mais tarde",
    receiptDiscount: "Desconto",
    startShiftToSeeDrawer: "Iniciar turno para ver caixa",
    comingSoon: "Em breve",
    pointsAbbrev: "pts",
    searchMoreResults: "+{count} mais",
    scanBarcode: "Ler Código",
    scanAdded: "Adicionado: {name}",
    scanCustomerLinked: "Cliente vinculado: {name}",
    scanNotFound: "Não encontrado: {code}",
    scanError: "Falha na leitura: {code}",
    scanSearchOnline: "Pesquisar online",
    scanDismiss: "Fechar",
    scanLookupSearching: "Consultando base de dados de códigos…",
    scanLookupFoundFrom: "De GS1 Hong Kong",
    scanLookupFoundFromCn: "De GS1 China",
    scanLookupFoundFromJp: "De mercado japonês",
    scanLookupFoundFromUs: "De UPCItemDB",
    scanLookupBrand: "Marca",
    scanLookupCategory: "Categoria",
    scanLookupOrigin: "Origem",
    scanLookupRegisteredTitle: "Código de barras registado",
    scanLookupRegisteredBody: "Código GS1 válido, mas sem detalhes do produto. Pode criar um produto temporário.",
    scanLookupErrorTimeout: "Consulta expirou — verifique a ligação e tente novamente.",
    scanLookupErrorAuth: "Autenticação da base de dados expirada. Contacte o administrador.",
    scanLookupErrorGeneric: "Base de dados de códigos indisponível no momento.",
    scanAddToCart: "Adicionar ao carrinho",
    tempProductTitle: "Inserir preço",
    tempProductFromGs1Hk: "De GS1 Hong Kong",
    tempProductFromGs1Cn: "De GS1 China",
    tempProductFromGs1Jp: "De mercado japonês",
    tempProductFromGs1Us: "De UPCItemDB",
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
    addToCartWith: "Adicionar · {currency} {price}",
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
    addDiscount: "Adicionar Desconto",
    applyDiscount: "Aplicar Desconto",
    percentage: "Percentagem",
    serviceFee: "Taxa de serviço",
    itemCount: "produtos",
    selectPayment: "Selecione o método de pagamento",
    tapCard: "Aproximar",
    insertCard: "Inserir",
    scanQr: "QR Code",
    scanWallet: "Escanear Carteira",
    paymentSubScanWallet: "Escanear QR do cliente",
    scanWalletPrompt: "Escaneie o QR code da carteira do cliente",
    scanWalletHint: "Aponte o leitor para o celular do cliente",
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
    terminalOffline: "Offline",
    terminalMode: "Modo terminal",
    orderSavedOffline: "Pedido guardado localmente",
    orderSavedOfflineHint: "Sincroniza ao restabelecer ligação",
    pendingOrders: "pendentes",
    ordersSynced: "pedidos sincronizados",
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
    status_new: "A aguardar pagamento",
    status_completed: "Concluído",
    status_pending: "Pendente",
    status_refunded: "Reembolsado",
    status_voided: "Anulado",
    voidOrder: "Anular",
    refundOrder: "Reembolso",
    resumePayment: "Retomar pagamento",
    parkOrder: "Estacionar",
    comingSoonToast: "Em breve",
    voidConfirmTitle: "Anular este pedido?",
    refundConfirmTitle: "Reembolsar este pedido?",
    voidConfirmBody: "Pedido sera cancelado, stock restaurado",
    refundConfirmBody: "Valor total sera reembolsado, stock restaurado",
    cashRefundAmount: "Dinheiro a devolver",
    voidUnpaidConfirmTitle: "Cancelar este pedido não pago?",
    voidUnpaidConfirmBody: "O pedido sera eliminado e o stock restaurado",
    filterThisShift: "Este Turno",
    filterToday: "Hoje",
    filterYesterday: "Ontem",
    filterLast7Days: "Últimos 7 Dias",
    filterAll: "Todas as Datas",
    filterQuick: "Seleção Rápida",
    filterCustomRange: "Intervalo Personalizado",
    filterClear: "Limpar",
    searchOrderNumber: "Pesquisar número do pedido...",
    noMatchingOrders: "Nenhum pedido encontrado",
    tryAdjustFilters: "Tente ajustar os filtros",
    loadingOrders: "A carregar...",
    currentShift: "Turno atual",
    paymentFailedHint: "Por favor, tente novamente ou use outro método",
    shiftStart: "Iniciar Turno",
    shiftStartSub: "Inicie sessão para começar o turno",
    shiftOpeningFloat: "Fundo de Caixa ({currency})",
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
    shiftWithinTolerance: "Dentro da tolerância (±{currency} 5)",
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
    update: "更新",
    logout: "ログアウト",
    language: "言語",
    theme: "テーマ",
    settings: "設定",
    keypad: "キーパッド",
    keypadDesc: "カスタム商品と価格を作成",
    customItem: "カスタム商品",
    addNote: "メモ",
    keypadNotePlaceholder: "商品の説明を入力...",
    confirm: "確認",
    library: "ライブラリ",
    favorites: "お気に入り",
    favoritesDesc: "お気に入りはまだありません",
    removeFavoriteTitle: "お気に入りを解除？",
    removeFavoriteHint: "この商品はお気に入りから削除されます",
    addCustomer: "顧客を追加",
    searchByPhone: "電話番号を入力...",
    scanMembership: "会員コードをスキャン",
    noCustomerFound: "顧客が見つかりません",
    customerLinked: "顧客をリンクしました",
    customerProfile: "顧客プロフィール",
    phone: "電話",
    email: "メール",
    memberSince: "会員登録日",
    lastVisit: "最終来店",
    totalSpent: "累計利用額",
    cashierTab: "レジ",
    orders: "注文",
    reportsTab: "レポート",
    drawerReport: "ドロワー",
    salesReport: "売上",
    allOrders: "全注文",
    posOrders: "店舗",
    onlineOrders: "オンライン",
    totalSales: "総売上",
    avgOrder: "平均注文",
    refunds: "返金",
    notes: "メモ",
    removeCustomer: "顧客を削除",
    drawerLedger: "現金ドロワー記録",
    drawerTime: "時刻",
    drawerEvent: "イベント",
    drawerIn: "入金",
    drawerOut: "出金",
    drawerBalance: "残高",
    drawerNoEntries: "記録なし",
    eventOpeningFloat: "開始時フロート",
    eventCashSale: "現金売上",
    eventChangeGiven: "お釣り",
    eventRefund: "返金",
    eventShiftClose: "シフト精算",
    paymentCash: "現金",
    paymentCardTap: "カード（タップ）",
    paymentCardInsert: "カード（挿入）",
    paymentQr: "QR決済",
    paymentSubTap: "NFC / Apple Pay",
    paymentSubInsert: "チップ / スワイプ",
    paymentSubQr: "Alipay / WeChat",
    paymentUnknown: "不明",
    lockTooManyAttempts: "試行回数を超えました。ログアウトします...",
    lockInvalidPin: "PINが無効です（残り{remaining}回）",
    lockConnectionError: "接続エラー。再試行してください。",
    lockOffline: "オフライン",
    lockOnline: "オンライン",
    lockRefresh: "更新",
    lockReloadTitle: "アプリを再読み込み",
    lockReloadMessage: "再読み込みしますか？",
    lockReloadChecking: "接続を確認中...",
    lockReloadCancel: "キャンセル",
    lockReloadConfirm: "再読み込み",
    preloadTitle: "商品データを準備中",
    preloadImages: "枚の画像",
    preloadSkip: "スキップ",
    updateAvailableTitle: "新しいバージョンがあります",
    updateAvailableBody: "POS を使い続けるには再読み込みしてください。",
    updateAvailableReload: "再読み込み",
    updateAvailableLater: "後で",
    receiptDiscount: "割引",
    startShiftToSeeDrawer: "シフトを開始してドロワーを表示",
    comingSoon: "近日公開",
    pointsAbbrev: "ポイント",
    searchMoreResults: "他{count}件",
    scanBarcode: "バーコードスキャン",
    scanAdded: "追加：{name}",
    scanCustomerLinked: "会員リンク：{name}",
    scanNotFound: "見つかりません：{code}",
    scanError: "読取失敗：{code}",
    scanSearchOnline: "オンライン検索",
    scanDismiss: "閉じる",
    scanLookupSearching: "バーコードDBを検索中…",
    scanLookupFoundFrom: "GS1 香港より",
    scanLookupFoundFromCn: "GS1 中国より",
    scanLookupFoundFromJp: "日本のマーケットプレイスより",
    scanLookupFoundFromUs: "UPCItemDB より",
    scanLookupBrand: "ブランド",
    scanLookupCategory: "カテゴリ",
    scanLookupOrigin: "原産地",
    scanLookupRegisteredTitle: "登録済みバーコード",
    scanLookupRegisteredBody: "有効な GS1 バーコードですが、商品情報は未登録です。一時商品として追加できます。",
    scanLookupErrorTimeout: "検索がタイムアウトしました。接続を確認して再試行してください。",
    scanLookupErrorAuth: "バーコードDBの認証が失効しました。管理者に連絡してください。",
    scanLookupErrorGeneric: "バーコードDBに接続できません。",
    scanAddToCart: "カートに追加",
    tempProductTitle: "価格を入力",
    tempProductFromGs1Hk: "GS1 香港より",
    tempProductFromGs1Cn: "GS1 中国より",
    tempProductFromGs1Jp: "日本のマーケットプレイスより",
    tempProductFromGs1Us: "UPCItemDB より",
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
    addToCartWith: "カートに追加 · {currency} {price}",
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
    addDiscount: "割引を追加",
    applyDiscount: "割引を適用",
    percentage: "パーセント",
    serviceFee: "サービス料",
    itemCount: "件の商品",
    selectPayment: "お支払い方法を選択",
    tapCard: "タッチ",
    insertCard: "挿入",
    scanQr: "QR決済",
    scanWallet: "ウォレット読取",
    paymentSubScanWallet: "お客様のQRを読取",
    scanWalletPrompt: "お客様のウォレットQRをスキャンしてください",
    scanWalletHint: "スキャナをお客様の画面に向けてください",
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
    terminalOffline: "オフライン",
    terminalMode: "端末モード",
    orderSavedOffline: "注文をローカルに保存",
    orderSavedOfflineHint: "接続回復時に自動同期します",
    pendingOrders: "同期待ち",
    ordersSynced: "件の注文を同期済み",
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
    status_new: "支払い待ち",
    status_completed: "完了",
    status_pending: "保留中",
    status_refunded: "返金済み",
    status_voided: "無効",
    voidOrder: "取消",
    refundOrder: "返金",
    resumePayment: "支払いを再開",
    parkOrder: "保留",
    comingSoonToast: "近日公開",
    voidConfirmTitle: "この注文を取消しますか？",
    refundConfirmTitle: "この注文を返金しますか？",
    voidConfirmBody: "注文がキャンセルされ、在庫が復元されます",
    refundConfirmBody: "全額返金され、在庫が復元されます",
    cashRefundAmount: "返金する現金",
    voidUnpaidConfirmTitle: "この未払い注文を取消しますか？",
    voidUnpaidConfirmBody: "注文が削除され、在庫が復元されます",
    filterThisShift: "このシフト",
    filterToday: "今日",
    filterYesterday: "昨日",
    filterLast7Days: "過去7日間",
    filterAll: "全期間",
    filterQuick: "クイック選択",
    filterCustomRange: "カスタム期間",
    filterClear: "クリア",
    searchOrderNumber: "注文番号を検索...",
    noMatchingOrders: "該当する注文がありません",
    tryAdjustFilters: "フィルターを調整してください",
    loadingOrders: "読み込み中...",
    currentShift: "現在のシフト",
    paymentFailedHint: "もう一度お試しいただくか、別の方法をご利用ください",
    shiftStart: "シフト開始",
    shiftStartSub: "サインインしてシフトを開始",
    shiftOpeningFloat: "開始時現金 ({currency})",
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
    shiftWithinTolerance: "許容範囲内 (±{currency} 5)",
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
