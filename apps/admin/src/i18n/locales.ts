import type { Locale } from "@macau-pos/i18n";

// ─── Translation Keys Type ────────────────────────────────
// Every key used in the admin dashboard. Flat with dot-naming convention.
// Adding a key here enforces it exists in ALL 5 locale objects below.

export type AdminTranslationKeys = {
  // ── Common ──────────────────────────────────────────────
  "common.cancel": string;
  "common.close": string;
  "common.save": string;
  "common.saveChanges": string;
  "common.delete": string;
  "common.edit": string;
  "common.duplicate": string;
  "common.search": string;
  "common.export": string;
  "common.import": string;
  "common.add": string;
  "common.view": string;
  "common.back": string;
  "common.done": string;
  "common.loading": string;
  "common.error": string;
  "common.success": string;
  "common.confirm": string;
  "common.mop": string;
  "common.showingRange": string;
  "common.previousPage": string;
  "common.nextPage": string;
  "common.noResults": string;
  "common.tryAdjusting": string;
  "common.statusActive": string;
  "common.statusDraft": string;
  "common.statusInactive": string;
  "common.statusSoldOut": string;
  "common.vsPrevPeriod": string;
  "common.selected": string;
  "common.clearSelection": string;
  "common.status": string;
  "common.unlimited": string;

  // ── Meta / Branding ─────────────────────────────────────
  "meta.title": string;
  "meta.description": string;

  // ── Sidebar ─────────────────────────────────────────────
  "sidebar.home": string;
  "sidebar.itemsServices": string;
  "sidebar.orders": string;
  "sidebar.paymentsInvoices": string;
  "sidebar.online": string;
  "sidebar.customers": string;
  "sidebar.reports": string;
  "sidebar.terminals": string;
  "sidebar.aiInsights": string;
  "sidebar.staff": string;
  "sidebar.settings": string;
  "sidebar.locations": string;
  "sidebar.takePayment": string;
  "sidebar.notifications": string;
  "sidebar.inbox": string;
  "sidebar.help": string;
  "sidebar.signOut": string;
  "sidebar.expandSidebar": string;
  "sidebar.collapseSidebar": string;
  "sidebar.location": string;
  "sidebar.openMenu": string;

  // ── Login ───────────────────────────────────────────────
  "login.signIn": string;
  "login.signInSubtitle": string;
  "login.emailOrPhone": string;
  "login.emailPlaceholder": string;
  "login.password": string;
  "login.passwordPlaceholder": string;
  "login.showPassword": string;
  "login.hidePassword": string;
  "login.signInButton": string;
  "login.demoHint": string;
  "login.invalidCredentials": string;

  // ── Home / Dashboard ────────────────────────────────────
  "home.title": string;
  "home.welcomeBack": string;

  // ── Setup Progress Card ─────────────────────────────────
  "setup.greeting": string;
  "setup.stepsCompleted": string;
  "setup.finishLater": string;
  "setup.viewAllSteps": string;
  "setup.setupProgress": string;
  "setup.account": string;
  "setup.accountDesc": string;
  "setup.pos": string;
  "setup.posDesc": string;
  "setup.payments": string;
  "setup.paymentsDesc": string;
  "setup.devices": string;
  "setup.devicesDesc": string;

  // ── Quick Actions ───────────────────────────────────────
  "quickActions.title": string;
  "quickActions.addItem": string;
  "quickActions.takePayment": string;
  "quickActions.createDiscount": string;
  "quickActions.addCustomer": string;
  "quickActions.connectTerminal": string;

  // ── Performance Chart ───────────────────────────────────
  "performance.title": string;
  "performance.subtitle": string;
  "performance.allLocations": string;
  "performance.comparePrevious": string;
  "performance.netSales": string;
  "performance.grossSales": string;
  "performance.transactions": string;
  "performance.avgBasket": string;
  "performance.thisPeriod": string;
  "performance.previousPeriod": string;

  // ── AI Insights ─────────────────────────────────────────
  "insights.title": string;
  "insights.subtitle": string;
  "insights.newCount": string;
  "insights.viewAll": string;

  // ── Terminal Status (Dashboard Card) ────────────────────
  "terminalStatus.title": string;
  "terminalStatus.subtitle": string;
  "terminalStatus.synced": string;
  "terminalStatus.online": string;
  "terminalStatus.offline": string;
  "terminalStatus.warnings": string;
  "terminalStatus.needRefill": string;
  "terminalStatus.paymentIssue": string;
  "terminalStatus.total": string;
  "terminalStatus.sales": string;
  "terminalStatus.viewAll": string;
  "terminalStatus.statusRefill": string;

  // ── Items & Services ────────────────────────────────────
  "items.title": string;
  "items.itemCount": string;
  "items.filteredCount": string;
  "items.addItem": string;
  "items.allItems": string;
  "items.searchPlaceholder": string;
  "items.itemsCount": string;
  "items.colItem": string;
  "items.colCategory": string;
  "items.colPrice": string;
  "items.colStock": string;
  "items.colStatus": string;
  "items.selectAll": string;
  "items.selectItem": string;
  "items.sortBy": string;
  "items.actionsFor": string;
  "items.noItemsFound": string;
  "items.noItemsHint": string;
  // Slide-over form
  "items.addProduct": string;
  "items.editProduct": string;
  "items.image": string;
  "items.uploadImage": string;
  "items.uploadHint": string;
  "items.productName": string;
  "items.productNamePlaceholder": string;
  "items.chineseName": string;
  "items.chineseNamePlaceholder": string;
  "items.moreTranslations": string;
  "items.japaneseName": string;
  "items.portugueseName": string;
  "items.sku": string;
  "items.skuPlaceholder": string;
  "items.barcode": string;
  "items.barcodePlaceholder": string;
  "items.sellingPrice": string;
  "items.costPrice": string;
  "items.inventory": string;
  "items.category": string;
  "items.noCategory": string;
  "items.markPopular": string;
  // Category manager
  "items.manageCategories": string;
  "items.categoryManager": string;
  "items.addCategory": string;
  "items.editCategory": string;
  "items.parentCategory": string;
  "items.parentCategoryNone": string;
  "items.categoryNameLabel": string;
  "items.categoryNameEn": string;
  "items.categoryNamePt": string;
  "items.categoryNameJa": string;
  "items.categoryIcon": string;
  "items.categoryProducts": string;
  "items.categoryNoProducts": string;
  "items.categoryActive": string;
  "items.categoryInactive": string;
  "items.deleteCategoryTitle": string;
  "items.deleteCategoryDesc": string;
  "items.categoryOrder": string;
  "items.chooseIcon": string;
  "items.categoryNameRequired": string;
  // Bottom sheet editor
  "items.createItem": string;
  "items.editItem": string;
  "items.description": string;
  "items.descriptionPlaceholder": string;
  "items.availability": string;
  "items.unsavedChanges": string;
  "items.discard": string;
  "items.addLanguage": string;
  "items.removeTranslation": string;
  // Variants
  "items.hasVariants": string;
  "items.addOptionGroup": string;
  "items.generateVariants": string;
  "common.clearAll": string;
  "items.translations": string;
  // Delete dialog
  "items.deleteTitle": string;
  "items.deleteTitleBulk": string;
  "items.deleteDesc": string;
  "items.deleteDescBulk": string;

  // ── Orders ──────────────────────────────────────────────
  "orders.title": string;
  "orders.orderCount": string;
  "orders.filteredCount": string;
  "orders.searchPlaceholder": string;
  "orders.todaysOrders": string;
  "orders.todaysRevenue": string;
  "orders.weekOrders": string;
  "orders.weekRevenue": string;
  "orders.colOrderNumber": string;
  "orders.colDate": string;
  "orders.colItems": string;
  "orders.colTotal": string;
  "orders.colPayment": string;
  "orders.colStatus": string;
  "orders.noOrders": string;
  "orders.noOrdersHint": string;
  "orders.noOrdersHintFiltered": string;
  "orders.statusCompleted": string;
  "orders.statusPending": string;
  "orders.statusCancelled": string;
  "orders.statusRefunded": string;
  "orders.payCash": string;
  "orders.payMpay": string;
  "orders.payAlipay": string;
  "orders.payWechat": string;
  "orders.payVisa": string;
  "orders.payMastercard": string;
  "orders.payUnionpay": string;
  "orders.detail.title": string;
  "orders.detail.orderInfo": string;
  "orders.detail.lineItems": string;
  "orders.detail.paymentInfo": string;
  "orders.detail.date": string;
  "orders.detail.status": string;
  "orders.detail.itemCount": string;
  "orders.detail.subtotal": string;
  "orders.detail.discount": string;
  "orders.detail.tax": string;
  "orders.detail.total": string;
  "orders.detail.product": string;
  "orders.detail.variant": string;
  "orders.detail.unitPrice": string;
  "orders.detail.qty": string;
  "orders.detail.lineTotal": string;
  "orders.detail.paymentMethod": string;
  "orders.detail.amountPaid": string;
  "orders.detail.cashReceived": string;
  "orders.detail.changeGiven": string;
  "orders.detail.paidAt": string;
  "orders.detail.notes": string;
  "orders.detail.notFound": string;
  "orders.detail.notFoundHint": string;
  "orders.allDates": string;
  "orders.allMethods": string;
  "orders.allStatuses": string;
  "orders.filteredOrders": string;
  "orders.filteredRevenue": string;
  "orders.completedOrders": string;
  "orders.avgOrderValue": string;
  "orders.statusVoided": string;

  // ── Customers ───────────────────────────────────────────
  "customers.title": string;
  "customers.memberCount": string;
  "customers.addCustomer": string;
  "customers.totalCustomers": string;
  "customers.newThisMonth": string;
  "customers.activeThisWeek": string;
  "customers.avgSpend": string;
  "customers.searchPlaceholder": string;
  "customers.colCustomer": string;
  "customers.colTier": string;
  "customers.colTotalSpent": string;
  "customers.colVisits": string;
  "customers.colPoints": string;
  "customers.colLastVisit": string;
  "customers.tierRegular": string;
  "customers.tierSilver": string;
  "customers.tierGold": string;
  "customers.tierVip": string;
  "customers.sendMessage": string;
  "customers.moreActions": string;

  // ── Terminals (Full Page) ───────────────────────────────
  "terminals.title": string;
  "terminals.deviceCount": string;
  "terminals.addTerminal": string;
  "terminals.viewGrid": string;
  "terminals.viewList": string;
  "terminals.statusOnline": string;
  "terminals.statusOffline": string;
  "terminals.statusUnpaired": string;
  "terminals.statusWarning": string;
  "terminals.statusMaintenance": string;
  "terminals.revenue": string;
  "terminals.shiftRevenue": string;
  "terminals.stock": string;
  "terminals.synced": string;
  "terminals.colTerminal": string;
  "terminals.colStatus": string;
  "terminals.colStock": string;
  "terminals.colSales": string;
  "terminals.colRevenue": string;
  "terminals.colLastSync": string;
  "terminals.colUptime": string;
  "terminals.actionsFor": string;
  "terminals.viewDetails": string;
  "terminals.restart": string;
  "terminals.configure": string;
  "terminals.disable": string;
  "terminals.enable": string;
  "terminals.statusDisabled": string;
  "terminals.regenerateCode": string;
  "terminals.unlink": string;
  "terminals.unlinkConfirm": string;
  "terminals.unlinkMessage": string;
  "terminals.unlinking": string;
  "terminals.remove": string;
  "terminals.removeConfirm": string;
  "terminals.removeMessage": string;
  "terminals.removing": string;
  "terminals.activationCodeFor": string;
  "terminals.activationCode": string;
  "terminals.activationCodeHint": string;
  "terminals.viewCode": string;
  "terminals.copyCode": string;
  "terminals.terminalCreated": string;
  "terminals.createTerminal": string;
  "terminals.creating": string;
  "terminals.createdMessage": string;
  "terminals.enterActivation": string;
  "terminals.nameLabel": string;
  "terminals.locationLabel": string;
  "terminals.notesLabel": string;
  "terminals.namePlaceholder": string;
  "terminals.locationPlaceholder": string;
  "terminals.notesPlaceholder": string;
  "terminals.searchPlaceholder": string;
  "terminals.allStatuses": string;
  "terminals.noResults": string;
  "terminals.cashier": string;
  "terminals.orders": string;
  "terminals.shiftOrders": string;
  "terminals.colOrders": string;
  "terminals.colCashier": string;
  "terminals.total": string;

  // ── Coming Soon ─────────────────────────────────────────
  "comingSoon.title": string;
  "comingSoon.description": string;

  // ── Date Range ──────────────────────────────────────────
  "dateRange.today": string;
  "dateRange.yesterday": string;
  "dateRange.last7Days": string;
  "dateRange.last14Days": string;
  "dateRange.last30Days": string;
  "dateRange.thisMonth": string;
  "dateRange.selectRange": string;

  // ── Settings ──────────────────────────────────────────
  "settings.pageTitle": string;
  "settings.subtitle": string;
  "settings.tabBusinessInfo": string;
  "settings.tabPaymentMethods": string;
  "settings.tabRegional": string;
  "settings.tabBranding": string;
  "settings.tabReceipt": string;
  "settings.shopDetails": string;
  "settings.shopName": string;
  "settings.shopNamePlaceholder": string;
  "settings.address": string;
  "settings.addressPlaceholder": string;
  "settings.phone": string;
  "settings.email": string;
  "settings.businessHours": string;
  "settings.closed": string;
  "settings.acceptedPaymentMethods": string;
  "settings.paymentMethodsDesc": string;
  "settings.paymentCash": string;
  "settings.paymentCashDesc": string;
  "settings.paymentCard": string;
  "settings.paymentCardDesc": string;
  "settings.paymentMpay": string;
  "settings.paymentMpayDesc": string;
  "settings.paymentAlipay": string;
  "settings.paymentAlipayDesc": string;
  "settings.paymentWechat": string;
  "settings.paymentWechatDesc": string;
  "settings.currencyAndTax": string;
  "settings.currency": string;
  "settings.taxRate": string;
  "settings.defaultLanguage": string;
  "settings.defaultLanguageDesc": string;
  "settings.accentColor": string;
  "settings.accentColorDesc": string;
  "settings.preview": string;
  "settings.sampleButton": string;
  "settings.receiptContent": string;
  "settings.receiptHeaderLabel": string;
  "settings.receiptFooterLabel": string;
  "settings.displayOptions": string;
  "settings.showAddressOnReceipt": string;
  "settings.showPhoneOnReceipt": string;
  "settings.showTaxOnReceipt": string;
  "settings.receiptPreview": string;
  "settings.successBusinessInfo": string;
  "settings.successPaymentMethods": string;
  "settings.successRegional": string;
  "settings.successBranding": string;
  "settings.successReceipt": string;

  // ── Staff ─────────────────────────────────────────────
  "staff.pageTitle": string;
  "staff.teamMembers": string;
  "staff.addStaff": string;
  "staff.editStaff": string;
  "staff.nameLabel": string;
  "staff.emailLabel": string;
  "staff.phoneLabel": string;
  "staff.roleLabel": string;
  "staff.roleOwner": string;
  "staff.roleCashier": string;
  "staff.roleAccountant": string;
  "staff.rolePromoter": string;
  "staff.posAccessLabel": string;
  "staff.posRoleNone": string;
  "staff.posRoleStoreManager": string;
  "staff.adminAccessLabel": string;
  "staff.adminRoleNone": string;
  "staff.pinLabel": string;
  "staff.passwordLabel": string;
  "staff.activeLabel": string;
  "staff.inactiveWarning": string;
  "staff.lastLogin": string;
  "staff.deleteTitle": string;
  "staff.deleteDesc": string;
  "staff.emptyTitle": string;
  "staff.emptyDesc": string;
  "staff.never": string;
  "staff.searchPlaceholder": string;
  "staff.allRoles": string;
  "staff.allStatuses": string;
  "staff.statusActive": string;
  "staff.statusInactive": string;
  "staff.locationsLabel": string;
  "staff.ownerAllLocations": string;
  "staff.allLocations": string;
  "staff.noLocations": string;
  "staff.noLocationsAvailable": string;

  // ── Shifts ────────────────────────────────────────────
  "shifts.title": string;
  "shifts.shiftCount": string;
  "sidebar.shifts": string;
  "shifts.statusOpen": string;
  "shifts.statusPending": string;
  "shifts.statusClosed": string;
  "shifts.statusFlagged": string;
  "shifts.colCashier": string;
  "shifts.colTerminal": string;
  "shifts.colOpened": string;
  "shifts.colDuration": string;
  "shifts.colOrders": string;
  "shifts.colSales": string;
  "shifts.colVariance": string;
  "shifts.colStatus": string;
  "shifts.noShifts": string;
  "shifts.noShiftsHint": string;
  "shifts.approve": string;
  "shifts.flag": string;
  "shifts.cashLedger": string;
  "shifts.ledgerTime": string;
  "shifts.ledgerEvent": string;
  "shifts.ledgerIn": string;
  "shifts.ledgerOut": string;
  "shifts.ledgerBalance": string;
  "shifts.detail.cashier": string;
  "shifts.detail.terminal": string;
  "shifts.detail.location": string;
  "shifts.detail.status": string;
  "shifts.detail.opened": string;
  "shifts.detail.closed": string;
  "shifts.detail.orders": string;
  "shifts.detail.totalSales": string;
  "shifts.detail.openingFloat": string;
  "shifts.detail.expectedCash": string;
  "shifts.detail.actualCash": string;
  "shifts.detail.variance": string;
  "shifts.detail.notes": string;
  "shifts.searchPlaceholder": string;

  // ── Locations ──────────────────────────────────────────
  "locations.title": string;
  "locations.subtitle": string;
  "locations.add": string;
  "locations.addNew": string;
  "locations.allLocations": string;
  "locations.nameLabel": string;
  "locations.addressLabel": string;
  "locations.phoneLabel": string;
  "locations.emailLabel": string;

  // ── Payments & Invoices ───────────────────────────────
  "payments.pageTitle": string;
  "payments.todaysRevenue": string;
  "payments.todaysTransactions": string;
  "payments.cashTotal": string;
  "payments.digitalTotal": string;
  "payments.methodBreakdown": string;
  "payments.filterAll": string;
  "payments.filterCash": string;
  "payments.filterCard": string;
  "payments.filterQR": string;
  "payments.searchPlaceholder": string;
  "payments.orderNumber": string;
  "payments.dateTime": string;
  "payments.method": string;
  "payments.amount": string;
  "payments.cashDetails": string;
  "payments.received": string;
  "payments.change": string;
  "payments.emptyTitle": string;
  "payments.emptyDesc": string;

  // ── AI Insights (Full Page) ───────────────────────────
  "insights.pageTitle": string;
  "insights.totalRevenue": string;
  "insights.totalOrders": string;
  "insights.avgOrderValue": string;
  "insights.productsInCatalog": string;
  "insights.salesTrendTitle": string;
  "insights.noSalesData": string;
  "insights.topProductsTitle": string;
  "insights.noProductData": string;
  "insights.paymentBreakdown": string;
  "insights.noPaymentData": string;
  "insights.insightsTitle": string;
  "insights.topSeller": string;
  "insights.cashPercent": string;
  "insights.avgValue": string;
  "insights.totalProcessed": string;
  "insights.catalogCount": string;

  // ── Online ────────────────────────────────────────────
  "online.pageTitle": string;
  "online.subtitle": string;
  "online.salesChannels": string;
  "online.posTerminal": string;
  "online.posTerminalDesc": string;
  "online.statusActive": string;
  "online.terminalsConnected": string;
  "online.onlineStore": string;
  "online.onlineStoreDesc": string;
  "online.statusEnabled": string;
  "online.enableToStart": string;
  "online.wechatMiniProgram": string;
  "online.wechatDesc": string;
  "online.comingSoon": string;
  "online.storeSettings": string;
  "online.storeUrl": string;
  "online.copied": string;
  "online.copy": string;
  "online.storeDescription": string;
  "online.storeDescPlaceholder": string;
  "online.storeQRCode": string;
  "online.successMessage": string;

  // ── Common (additions) ────────────────────────────────
  "common.saving": string;
  "common.to": string;
  "common.notAvailable": string;

  // ── Reports ─────────────────────────────────────────────
  "reports.pageTitle": string;
  "reports.subtitle": string;
  "reports.totalRevenue": string;
  "reports.totalOrders": string;
  "reports.avgOrderValue": string;
  "reports.topCategory": string;
  "reports.salesTrend": string;
  "reports.last14Days": string;
  "reports.last30Days": string;
  "reports.last90Days": string;
  "reports.last7Days": string;
  "reports.topProducts": string;
  "reports.productName": string;
  "reports.qtySold": string;
  "reports.revenue": string;
  "reports.salesByCategory": string;
  "reports.category": string;
  "reports.orders": string;
  "reports.paymentMethods": string;
  "reports.noData": string;
  "reports.noDataDesc": string;
  "reports.exportCsv": string;
  "reports.date": string;
  "reports.dailyRevenue": string;
  "reports.percentage": string;
};

// ─── Helper Function ──────────────────────────────────────
export function t(locale: Locale, key: keyof AdminTranslationKeys): string {
  return translations[locale]?.[key] || translations.en[key] || key;
}

// ─── Translations ─────────────────────────────────────────

const translations: Record<Locale, AdminTranslationKeys> = {
  // ═══════════════════════════════════════════════════════
  // ENGLISH
  // ═══════════════════════════════════════════════════════
  en: {
    // Common
    "common.cancel": "Cancel",
    "common.close": "Close",
    "common.save": "Save",
    "common.saveChanges": "Save changes",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.duplicate": "Duplicate",
    "common.search": "Search...",
    "common.export": "Export",
    "common.import": "Import",
    "common.add": "Add",
    "common.view": "View",
    "common.back": "Back",
    "common.done": "Done",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.confirm": "Confirm",
    "common.mop": "MOP",
    "common.showingRange": "Showing {start}–{end} of {total}",
    "common.previousPage": "Previous page",
    "common.nextPage": "Next page",
    "common.noResults": "No results found",
    "common.tryAdjusting": "Try adjusting your search or filter",
    "common.statusActive": "Active",
    "common.statusDraft": "Draft",
    "common.statusInactive": "Inactive",
    "common.statusSoldOut": "Sold Out",
    "common.vsPrevPeriod": "vs prev. period",
    "common.selected": "{count} selected",
    "common.clearSelection": "Clear selection",
    "common.status": "Status",
    "common.unlimited": "Unlimited",

    // Meta
    "meta.title": "CountingStars",
    "meta.description": "Modern POS & retail operations platform",

    // Sidebar
    "sidebar.home": "Home",
    "sidebar.itemsServices": "Items & services",
    "sidebar.orders": "Orders",
    "sidebar.paymentsInvoices": "Payments & invoices",
    "sidebar.online": "Online",
    "sidebar.customers": "Customers",
    "sidebar.reports": "Reports",
    "sidebar.terminals": "Machines / Terminals",
    "sidebar.aiInsights": "AI Insights",
    "sidebar.staff": "Staff",
    "sidebar.settings": "Settings",
    "sidebar.locations": "Locations",
    "sidebar.takePayment": "Take payment",
    "sidebar.notifications": "Notifications",
    "sidebar.inbox": "Inbox",
    "sidebar.help": "Help",
    "sidebar.signOut": "Sign out",
    "sidebar.expandSidebar": "Expand sidebar",
    "sidebar.collapseSidebar": "Collapse sidebar",
    "sidebar.location": "Macau · Main Branch",
    "sidebar.openMenu": "Open navigation menu",

    // Login
    "login.signIn": "Sign In",
    "login.signInSubtitle": "Sign in to your account",
    "login.emailOrPhone": "Email or Phone",
    "login.emailPlaceholder": "owner@countingstars.mo",
    "login.password": "Password",
    "login.passwordPlaceholder": "Enter password",
    "login.showPassword": "Show password",
    "login.hidePassword": "Hide password",
    "login.signInButton": "Sign In",
    "login.demoHint": "Demo: owner@countingstars.mo / demo1234",
    "login.invalidCredentials": "Invalid email/phone or password",

    // Home
    "home.title": "Home",
    "home.welcomeBack": "Welcome back to your dashboard",

    // Setup
    "setup.greeting": "Hello! Let's get you set up.",
    "setup.stepsCompleted": "{completed} of {total} steps completed",
    "setup.finishLater": "I'll finish this later",
    "setup.viewAllSteps": "View all steps",
    "setup.setupProgress": "Setup progress",
    "setup.account": "Account",
    "setup.accountDesc": "Set up your business profile and team members",
    "setup.pos": "RetailOS POS",
    "setup.posDesc": "Configure your point of sale for in-store selling",
    "setup.payments": "Payments",
    "setup.paymentsDesc": "Connect payment methods to accept transactions",
    "setup.devices": "Devices",
    "setup.devicesDesc": "Set up terminals and connect hardware",

    // Quick Actions
    "quickActions.title": "Quick actions",
    "quickActions.addItem": "Add item",
    "quickActions.takePayment": "Take payment",
    "quickActions.createDiscount": "Create discount",
    "quickActions.addCustomer": "Add customer",
    "quickActions.connectTerminal": "Connect terminal",

    // Performance
    "performance.title": "Performance",
    "performance.subtitle": "Sales overview for selected period",
    "performance.allLocations": "All locations",
    "performance.comparePrevious": "Compare: Previous period",
    "performance.netSales": "Net sales",
    "performance.grossSales": "Gross sales",
    "performance.transactions": "Transactions",
    "performance.avgBasket": "Avg. basket",
    "performance.thisPeriod": "This period",
    "performance.previousPeriod": "Previous period",

    // AI Insights
    "insights.title": "AI Insights",
    "insights.subtitle": "Powered by CountingStars AI",
    "insights.newCount": "{count} new",
    "insights.viewAll": "View all insights",

    // Terminal Status (Dashboard Card)
    "terminalStatus.title": "Terminal status",
    "terminalStatus.subtitle": "Real-time machine overview",
    "terminalStatus.synced": "Synced {time}",
    "terminalStatus.online": "Online",
    "terminalStatus.offline": "Offline",
    "terminalStatus.warnings": "Warnings",
    "terminalStatus.needRefill": "{count} need refill",
    "terminalStatus.paymentIssue": "{count} payment issue",
    "terminalStatus.total": "{count} total",
    "terminalStatus.sales": "{count} sales",
    "terminalStatus.viewAll": "View all terminals",
    "terminalStatus.statusRefill": "Refill needed",

    // Items & Services
    "items.title": "Items & services",
    "items.itemCount": "{count} items in catalog",
    "items.filteredCount": "{filtered} of {total} items",
    "items.addItem": "Add item",
    "items.allItems": "All items",
    "items.searchPlaceholder": "Search items by name, SKU...",
    "items.itemsCount": "{count} items",
    "items.colItem": "Item",
    "items.colCategory": "Category",
    "items.colPrice": "Price",
    "items.colStock": "Stock",
    "items.colStatus": "Status",
    "items.selectAll": "Select all items",
    "items.selectItem": "Select {name}",
    "items.sortBy": "Sort by {column}",
    "items.actionsFor": "Actions for {name}",
    "items.noItemsFound": "No items found",
    "items.noItemsHint": "Try adjusting your search or filter",
    "items.addProduct": "Add product",
    "items.editProduct": "Edit product",
    "items.image": "Image",
    "items.uploadImage": "Click to upload image",
    "items.uploadHint": "JPEG, PNG, WebP · Max 2MB",
    "items.productName": "Product name",
    "items.productNamePlaceholder": "e.g. Pocari Sweat 500ml",
    "items.chineseName": "Chinese name",
    "items.chineseNamePlaceholder": "e.g. 寶礦力水特",
    "items.moreTranslations": "More translations (Japanese, Portuguese)",
    "items.japaneseName": "Japanese name",
    "items.portugueseName": "Portuguese name",
    "items.sku": "SKU",
    "items.skuPlaceholder": "e.g. BEV-001",
    "items.barcode": "Barcode",
    "items.barcodePlaceholder": "e.g. 4901340101234",
    "items.sellingPrice": "Selling price (MOP)",
    "items.costPrice": "Cost price (MOP)",
    "items.inventory": "Inventory",
    "items.category": "Category",
    "items.noCategory": "No category",
    "items.markPopular": "Mark as popular",
    "items.manageCategories": "Manage categories",
    "items.categoryManager": "Category Manager",
    "items.addCategory": "Add category",
    "items.editCategory": "Edit category",
    "items.parentCategory": "Parent category",
    "items.parentCategoryNone": "None (top-level)",
    "items.categoryNameLabel": "Category name (Chinese)",
    "items.categoryNameEn": "English name",
    "items.categoryNamePt": "Portuguese name",
    "items.categoryNameJa": "Japanese name",
    "items.categoryIcon": "Icon",
    "items.categoryProducts": "{count} products",
    "items.categoryNoProducts": "No products",
    "items.categoryActive": "Active",
    "items.categoryInactive": "Inactive",
    "items.deleteCategoryTitle": "Delete category?",
    "items.deleteCategoryDesc": "Products in this category will become uncategorized. This cannot be undone.",
    "items.categoryOrder": "Display order",
    "items.chooseIcon": "Choose icon",
    "items.categoryNameRequired": "Category name is required",
    "items.createItem": "Create item",
    "items.editItem": "Edit item",
    "items.description": "Description",
    "items.descriptionPlaceholder": "Add a description...",
    "items.availability": "Availability",
    "items.unsavedChanges": "You have unsaved changes. Discard?",
    "items.discard": "Discard",
    "items.addLanguage": "Add language",
    "items.removeTranslation": "Remove translation",
    "items.hasVariants": "This product has variants",
    "items.addOptionGroup": "Add option group (e.g. Size, Color)",
    "items.generateVariants": "Generate variants",
    "common.clearAll": "Clear all",
    "items.translations": "Translations",
    "items.deleteTitle": "Delete product?",
    "items.deleteTitleBulk": "Delete {count} products?",
    "items.deleteDesc": "\"{name}\" will be removed from your catalog. This action cannot be undone.",
    "items.deleteDescBulk": "This will remove {count} products from your catalog. This action cannot be undone.",

    // Orders
    "orders.title": "Orders",
    "orders.orderCount": "{count} orders",
    "orders.filteredCount": "{filtered} of {total} orders",
    "orders.searchPlaceholder": "Search by order number...",
    "orders.todaysOrders": "Today's Orders",
    "orders.todaysRevenue": "Today's Revenue",
    "orders.weekOrders": "This Week Orders",
    "orders.weekRevenue": "This Week Revenue",
    "orders.colOrderNumber": "Order #",
    "orders.colDate": "Date",
    "orders.colItems": "Items",
    "orders.colTotal": "Total",
    "orders.colPayment": "Payment",
    "orders.colStatus": "Status",
    "orders.noOrders": "No orders found",
    "orders.noOrdersHint": "Orders will appear here once created",
    "orders.noOrdersHintFiltered": "Try adjusting your search",
    "orders.statusCompleted": "Completed",
    "orders.statusPending": "Pending",
    "orders.statusCancelled": "Cancelled",
    "orders.statusRefunded": "Refunded",
    "orders.payCash": "Cash",
    "orders.payMpay": "MPay",
    "orders.payAlipay": "Alipay",
    "orders.payWechat": "WeChat Pay",
    "orders.payVisa": "Visa",
    "orders.payMastercard": "Mastercard",
    "orders.payUnionpay": "UnionPay",
    "orders.detail.title": "Order {orderNumber}",
    "orders.detail.orderInfo": "Order Information",
    "orders.detail.lineItems": "Line Items",
    "orders.detail.paymentInfo": "Payment Information",
    "orders.detail.date": "Date",
    "orders.detail.status": "Status",
    "orders.detail.itemCount": "{count} items",
    "orders.detail.subtotal": "Subtotal",
    "orders.detail.discount": "Discount",
    "orders.detail.tax": "Tax",
    "orders.detail.total": "Total",
    "orders.detail.product": "Product",
    "orders.detail.variant": "Variant",
    "orders.detail.unitPrice": "Unit Price",
    "orders.detail.qty": "Qty",
    "orders.detail.lineTotal": "Total",
    "orders.detail.paymentMethod": "Payment Method",
    "orders.detail.amountPaid": "Amount Paid",
    "orders.detail.cashReceived": "Cash Received",
    "orders.detail.changeGiven": "Change Given",
    "orders.detail.paidAt": "Paid At",
    "orders.detail.notes": "Notes",
    "orders.detail.notFound": "Order not found",
    "orders.detail.notFoundHint": "This order may have been deleted or does not exist",
    "orders.allDates": "All dates",
    "orders.allMethods": "All Methods",
    "orders.allStatuses": "All Status",
    "orders.filteredOrders": "Orders",
    "orders.filteredRevenue": "Revenue",
    "orders.completedOrders": "Completed",
    "orders.avgOrderValue": "Avg. Order",
    "orders.statusVoided": "Voided",

    // Customers
    "customers.title": "Customers",
    "customers.memberCount": "{count} registered members",
    "customers.addCustomer": "Add customer",
    "customers.totalCustomers": "Total customers",
    "customers.newThisMonth": "New this month",
    "customers.activeThisWeek": "Active this week",
    "customers.avgSpend": "Avg. spend",
    "customers.searchPlaceholder": "Search by name, phone, email...",
    "customers.colCustomer": "Customer",
    "customers.colTier": "Tier",
    "customers.colTotalSpent": "Total spent",
    "customers.colVisits": "Visits",
    "customers.colPoints": "Points",
    "customers.colLastVisit": "Last visit",
    "customers.tierRegular": "Regular",
    "customers.tierSilver": "Silver",
    "customers.tierGold": "Gold",
    "customers.tierVip": "VIP",
    "customers.sendMessage": "Send message",
    "customers.moreActions": "More actions",

    // Terminals (Full Page)
    "terminals.title": "Machines / Terminals",
    "terminals.deviceCount": "{count} devices registered",
    "terminals.addTerminal": "Add terminal",
    "terminals.viewGrid": "Grid view",
    "terminals.viewList": "List view",
    "terminals.statusOnline": "Online",
    "terminals.statusOffline": "Offline",
    "terminals.statusUnpaired": "Not Paired",
    "terminals.statusWarning": "Warning",
    "terminals.statusMaintenance": "Maintenance",
    "terminals.revenue": "Revenue",
    "terminals.shiftRevenue": "Shift",
    "terminals.stock": "Stock",
    "terminals.synced": "Synced",
    "terminals.colTerminal": "Terminal",
    "terminals.colStatus": "Status",
    "terminals.colStock": "Stock",
    "terminals.colSales": "Sales",
    "terminals.colRevenue": "Revenue",
    "terminals.colLastSync": "Last sync",
    "terminals.colUptime": "Uptime",
    "terminals.actionsFor": "Actions for {name}",
    "terminals.viewDetails": "View details",
    "terminals.restart": "Restart",
    "terminals.configure": "Configure",
    "terminals.disable": "Disable",
    "terminals.enable": "Enable",
    "terminals.statusDisabled": "Disabled",
    "terminals.regenerateCode": "Regenerate Code",
    "terminals.unlink": "Unlink Device",
    "terminals.unlinkConfirm": "Unlink this device?",
    "terminals.unlinkMessage": "The active session on \"{name}\" will be terminated and the device will need to re-activate with a new code.",
    "terminals.unlinking": "Unlinking...",
    "terminals.remove": "Remove",
    "terminals.removeConfirm": "Remove terminal?",
    "terminals.removeMessage": "\"{name}\" will be permanently deleted. This action cannot be undone.",
    "terminals.removing": "Removing...",
    "terminals.activationCodeFor": "Activation Code for {code}",
    "terminals.activationCode": "Activation Code",
    "terminals.activationCodeHint": "Enter this code on the cashier terminal to activate it.",
    "terminals.viewCode": "View Activation Code",
    "terminals.copyCode": "Copy code",
    "terminals.terminalCreated": "Terminal Created",
    "terminals.createTerminal": "Add",
    "terminals.creating": "Adding...",
    "terminals.createdMessage": "Terminal {code} created successfully.",
    "terminals.enterActivation": "Enter this activation code on the cashier terminal:",
    "terminals.nameLabel": "Name",
    "terminals.locationLabel": "Location",
    "terminals.notesLabel": "Notes",
    "terminals.namePlaceholder": "e.g. Front Counter",
    "terminals.locationPlaceholder": "e.g. Ground Floor, Entrance",
    "terminals.notesPlaceholder": "Optional notes",
    "terminals.searchPlaceholder": "Search terminals...",
    "terminals.allStatuses": "All statuses",
    "terminals.noResults": "No terminals found.",
    "terminals.cashier": "Cashier",
    "terminals.orders": "Orders",
    "terminals.shiftOrders": "Shift",
    "terminals.colOrders": "Orders",
    "terminals.colCashier": "Cashier",
    "terminals.total": "Total",

    // Coming Soon
    "comingSoon.title": "Coming soon",
    "comingSoon.description": "The {module} module is under development. Check back soon.",

    // Date Range
    "dateRange.today": "Today",
    "dateRange.yesterday": "Yesterday",
    "dateRange.last7Days": "Last 7 days",
    "dateRange.last14Days": "Last 14 days",
    "dateRange.last30Days": "Last 30 days",
    "dateRange.thisMonth": "This month",
    "dateRange.selectRange": "Select date range",

    // Settings
    "settings.pageTitle": "Settings",
    "settings.subtitle": "Manage your shop configuration",
    "settings.tabBusinessInfo": "Business Info",
    "settings.tabPaymentMethods": "Payment Methods",
    "settings.tabRegional": "Regional",
    "settings.tabBranding": "Branding",
    "settings.tabReceipt": "Receipt",
    "settings.shopDetails": "Shop Details",
    "settings.shopName": "Shop Name",
    "settings.shopNamePlaceholder": "Enter your shop name",
    "settings.address": "Address",
    "settings.addressPlaceholder": "Full shop address",
    "settings.phone": "Phone",
    "settings.email": "Email",
    "settings.businessHours": "Business Hours",
    "settings.closed": "Closed",
    "settings.acceptedPaymentMethods": "Accepted Payment Methods",
    "settings.paymentMethodsDesc": "Enable or disable payment methods.",
    "settings.paymentCash": "Cash",
    "settings.paymentCashDesc": "Accept cash payments",
    "settings.paymentCard": "Card (Visa/Master)",
    "settings.paymentCardDesc": "Accept card payments",
    "settings.paymentMpay": "MPAY",
    "settings.paymentMpayDesc": "Macau mobile payment",
    "settings.paymentAlipay": "Alipay",
    "settings.paymentAlipayDesc": "Alipay and Alipay HK",
    "settings.paymentWechat": "WeChat Pay",
    "settings.paymentWechatDesc": "WeChat Pay payments",
    "settings.currencyAndTax": "Currency & Tax",
    "settings.currency": "Currency",
    "settings.taxRate": "Tax Rate (%)",
    "settings.defaultLanguage": "Default Language",
    "settings.defaultLanguageDesc": "Default display language for the POS.",
    "settings.accentColor": "Accent Color",
    "settings.accentColorDesc": "Primary accent color for the interface.",
    "settings.preview": "Preview",
    "settings.sampleButton": "Sample Button",
    "settings.receiptContent": "Receipt Content",
    "settings.receiptHeaderLabel": "Header Text",
    "settings.receiptFooterLabel": "Footer Text",
    "settings.displayOptions": "Display Options",
    "settings.showAddressOnReceipt": "Show address on receipt",
    "settings.showPhoneOnReceipt": "Show phone on receipt",
    "settings.showTaxOnReceipt": "Show tax on receipt",
    "settings.receiptPreview": "Receipt Preview",
    "settings.successBusinessInfo": "Business info saved",
    "settings.successPaymentMethods": "Payment methods saved",
    "settings.successRegional": "Regional settings saved",
    "settings.successBranding": "Branding saved",
    "settings.successReceipt": "Receipt settings saved",

    // Staff
    "staff.pageTitle": "Staff",
    "staff.teamMembers": "{count} team members",
    "staff.addStaff": "Add staff",
    "staff.editStaff": "Edit staff",
    "staff.nameLabel": "Name",
    "staff.emailLabel": "Email",
    "staff.phoneLabel": "Phone",
    "staff.roleLabel": "Role",
    "staff.roleOwner": "Owner",
    "staff.roleCashier": "Cashier",
    "staff.roleAccountant": "Accountant",
    "staff.rolePromoter": "Promoter",
    "staff.posAccessLabel": "POS Access",
    "staff.posRoleNone": "No POS access",
    "staff.posRoleStoreManager": "Store Manager",
    "staff.adminAccessLabel": "Admin Panel",
    "staff.adminRoleNone": "No admin access",
    "staff.pinLabel": "PIN (4-6 digits)",
    "staff.passwordLabel": "Password",
    "staff.activeLabel": "Active",
    "staff.inactiveWarning": "Inactive staff cannot log in",
    "staff.lastLogin": "Last login",
    "staff.deleteTitle": "Delete staff member?",
    "staff.deleteDesc": "This action cannot be undone.",
    "staff.emptyTitle": "No staff members",
    "staff.emptyDesc": "Add your first team member.",
    "staff.never": "Never",
    "staff.searchPlaceholder": "Search by name, email, phone...",
    "staff.allRoles": "All Roles",
    "staff.allStatuses": "All Status",
    "staff.statusActive": "Active",
    "staff.statusInactive": "Inactive",
    "staff.locationsLabel": "Locations",
    "staff.ownerAllLocations": "Owners have access to all locations",
    "staff.allLocations": "All locations",
    "staff.noLocations": "No location",
    "staff.noLocationsAvailable": "No locations available",

    // Shifts
    "shifts.title": "Shifts",
    "shifts.shiftCount": "{count} shifts",
    "sidebar.shifts": "Shifts",
    "shifts.statusOpen": "Open",
    "shifts.statusPending": "Pending",
    "shifts.statusClosed": "Closed",
    "shifts.statusFlagged": "Flagged",
    "shifts.colCashier": "Cashier",
    "shifts.colTerminal": "Terminal",
    "shifts.colOpened": "Opened",
    "shifts.colDuration": "Duration",
    "shifts.colOrders": "Orders",
    "shifts.colSales": "Sales",
    "shifts.colVariance": "Variance",
    "shifts.colStatus": "Status",
    "shifts.noShifts": "No shifts found",
    "shifts.noShiftsHint": "Shifts appear when cashiers start working",
    "shifts.approve": "Approve",
    "shifts.flag": "Flag",
    "shifts.cashLedger": "Cash Ledger",
    "shifts.ledgerTime": "Time",
    "shifts.ledgerEvent": "Event",
    "shifts.ledgerIn": "In",
    "shifts.ledgerOut": "Out",
    "shifts.ledgerBalance": "Balance",
    "shifts.detail.cashier": "Cashier",
    "shifts.detail.terminal": "Terminal",
    "shifts.detail.location": "Location",
    "shifts.detail.status": "Status",
    "shifts.detail.opened": "Opened",
    "shifts.detail.closed": "Closed",
    "shifts.detail.orders": "Orders",
    "shifts.detail.totalSales": "Total Sales",
    "shifts.detail.openingFloat": "Opening Float",
    "shifts.detail.expectedCash": "Expected Cash",
    "shifts.detail.actualCash": "Actual Cash",
    "shifts.detail.variance": "Variance",
    "shifts.detail.notes": "Notes",
    "shifts.searchPlaceholder": "Search by cashier or terminal...",

    // Locations
    "locations.title": "Locations",
    "locations.subtitle": "Manage your physical store locations",
    "locations.add": "Add Location",
    "locations.addNew": "New Location",
    "locations.allLocations": "All Locations",
    "locations.nameLabel": "Name",
    "locations.addressLabel": "Address",
    "locations.phoneLabel": "Phone",
    "locations.emailLabel": "Email",

    // Payments
    "payments.pageTitle": "Payments & Invoices",
    "payments.todaysRevenue": "Today's Revenue",
    "payments.todaysTransactions": "Today's Transactions",
    "payments.cashTotal": "Cash Total",
    "payments.digitalTotal": "Digital Total",
    "payments.methodBreakdown": "Payment Method Breakdown",
    "payments.filterAll": "All",
    "payments.filterCash": "Cash",
    "payments.filterCard": "Card",
    "payments.filterQR": "QR",
    "payments.searchPlaceholder": "Search by order number...",
    "payments.orderNumber": "Order #",
    "payments.dateTime": "Date/Time",
    "payments.method": "Method",
    "payments.amount": "Amount",
    "payments.cashDetails": "Cash Details",
    "payments.received": "Received",
    "payments.change": "Change",
    "payments.emptyTitle": "No transactions found",
    "payments.emptyDesc": "Transactions will appear here.",

    // AI Insights (Full Page)
    "insights.pageTitle": "AI Insights",
    "insights.totalRevenue": "Total Revenue",
    "insights.totalOrders": "Total Orders",
    "insights.avgOrderValue": "Avg Order Value",
    "insights.productsInCatalog": "Products in Catalog",
    "insights.salesTrendTitle": "Sales Trend (Last 30 Days)",
    "insights.noSalesData": "No sales data yet",
    "insights.topProductsTitle": "Top 10 Products",
    "insights.noProductData": "No product data yet",
    "insights.paymentBreakdown": "Payment Method Breakdown",
    "insights.noPaymentData": "No payment data yet",
    "insights.insightsTitle": "Insights",
    "insights.topSeller": "Top seller: {name} with MOP {amount}",
    "insights.cashPercent": "Cash payments: {pct}% of all transactions",
    "insights.avgValue": "Average order value: MOP {value}",
    "insights.totalProcessed": "Total orders processed: {count}",
    "insights.catalogCount": "{count} products in your catalog",

    // Online
    "online.pageTitle": "Online",
    "online.subtitle": "Manage your sales channels",
    "online.salesChannels": "Sales Channels",
    "online.posTerminal": "POS Terminal",
    "online.posTerminalDesc": "In-store point of sale",
    "online.statusActive": "Active",
    "online.terminalsConnected": "{count} terminals connected",
    "online.onlineStore": "Online Store",
    "online.onlineStoreDesc": "Let customers order online",
    "online.statusEnabled": "Enabled",
    "online.enableToStart": "Enable to start selling online",
    "online.wechatMiniProgram": "WeChat Mini-Program",
    "online.wechatDesc": "Sell through WeChat",
    "online.comingSoon": "Coming Soon",
    "online.storeSettings": "Online Store Settings",
    "online.storeUrl": "Store URL",
    "online.copied": "Copied!",
    "online.copy": "Copy",
    "online.storeDescription": "Store Description",
    "online.storeDescPlaceholder": "Describe your store...",
    "online.storeQRCode": "Store QR Code",
    "online.successMessage": "Settings saved",

    // Common (additions)
    "common.saving": "Saving...",
    "common.to": "to",
    "common.notAvailable": "--",

    // Reports
    "reports.pageTitle": "Reports",
    "reports.subtitle": "Sales analytics and business reports",
    "reports.totalRevenue": "Total Revenue",
    "reports.totalOrders": "Total Orders",
    "reports.avgOrderValue": "Avg Order Value",
    "reports.topCategory": "Top Category",
    "reports.salesTrend": "Sales Trend",
    "reports.last14Days": "Last 14 Days",
    "reports.last30Days": "Last 30 Days",
    "reports.last90Days": "Last 90 Days",
    "reports.last7Days": "Last 7 Days",
    "reports.topProducts": "Top Products",
    "reports.productName": "Product",
    "reports.qtySold": "Qty Sold",
    "reports.revenue": "Revenue",
    "reports.salesByCategory": "Sales by Category",
    "reports.category": "Category",
    "reports.orders": "Orders",
    "reports.paymentMethods": "Payment Methods",
    "reports.noData": "No report data yet",
    "reports.noDataDesc": "Create orders from the cashier to see reports here",
    "reports.exportCsv": "Export CSV",
    "reports.date": "Date",
    "reports.dailyRevenue": "Daily Revenue",
    "reports.percentage": "Percentage",
  },

  // ═══════════════════════════════════════════════════════
  // TRADITIONAL CHINESE (繁體中文) — Primary for Macau
  // ═══════════════════════════════════════════════════════
  tc: {
    "common.cancel": "取消",
    "common.close": "關閉",
    "common.save": "儲存",
    "common.saveChanges": "儲存變更",
    "common.delete": "刪除",
    "common.edit": "編輯",
    "common.duplicate": "複製",
    "common.search": "搜尋...",
    "common.export": "匯出",
    "common.import": "匯入",
    "common.add": "新增",
    "common.view": "檢視",
    "common.back": "返回",
    "common.done": "完成",
    "common.loading": "載入中...",
    "common.error": "錯誤",
    "common.success": "成功",
    "common.confirm": "確認",
    "common.mop": "MOP",
    "common.showingRange": "顯示 {start}–{end} 共 {total} 項",
    "common.previousPage": "上一頁",
    "common.nextPage": "下一頁",
    "common.noResults": "找不到結果",
    "common.tryAdjusting": "請嘗試調整搜尋或篩選條件",
    "common.statusActive": "啟用",
    "common.statusDraft": "草稿",
    "common.statusInactive": "停用",
    "common.statusSoldOut": "售罄",
    "common.vsPrevPeriod": "較上期",
    "common.selected": "已選 {count} 項",
    "common.clearSelection": "清除選擇",
    "common.status": "狀態",
    "common.unlimited": "不限",

    "meta.title": "CountingStars",
    "meta.description": "現代化 POS 及零售管理平台",

    "sidebar.home": "首頁",
    "sidebar.itemsServices": "商品與服務",
    "sidebar.orders": "訂單",
    "sidebar.paymentsInvoices": "付款與發票",
    "sidebar.online": "線上",
    "sidebar.customers": "顧客",
    "sidebar.reports": "報表",
    "sidebar.terminals": "機器 / 終端",
    "sidebar.aiInsights": "AI 洞察",
    "sidebar.staff": "員工",
    "sidebar.settings": "設定",
    "sidebar.locations": "分店",
    "sidebar.takePayment": "收款",
    "sidebar.notifications": "通知",
    "sidebar.inbox": "收件匣",
    "sidebar.help": "幫助",
    "sidebar.signOut": "登出",
    "sidebar.expandSidebar": "展開側欄",
    "sidebar.collapseSidebar": "收合側欄",
    "sidebar.location": "澳門 · 總店",
    "sidebar.openMenu": "開啟導覽選單",

    "login.signIn": "登入",
    "login.signInSubtitle": "登入你的帳戶",
    "login.emailOrPhone": "電郵或電話",
    "login.emailPlaceholder": "owner@countingstars.mo",
    "login.password": "密碼",
    "login.passwordPlaceholder": "請輸入密碼",
    "login.showPassword": "顯示密碼",
    "login.hidePassword": "隱藏密碼",
    "login.signInButton": "登入",
    "login.demoHint": "演示: owner@countingstars.mo / demo1234",
    "login.invalidCredentials": "電郵/電話或密碼不正確",

    "home.title": "首頁",
    "home.welcomeBack": "歡迎回到你的管理面板",

    "setup.greeting": "你好！讓我們開始設定吧。",
    "setup.stepsCompleted": "已完成 {completed}/{total} 個步驟",
    "setup.finishLater": "稍後再完成",
    "setup.viewAllSteps": "查看所有步驟",
    "setup.setupProgress": "設定進度",
    "setup.account": "帳戶",
    "setup.accountDesc": "設定你的商家資料和團隊成員",
    "setup.pos": "RetailOS POS",
    "setup.posDesc": "配置你的銷售終端進行店內銷售",
    "setup.payments": "付款",
    "setup.paymentsDesc": "連接付款方式以接收交易",
    "setup.devices": "設備",
    "setup.devicesDesc": "設定終端機並連接硬件",

    "quickActions.title": "快速操作",
    "quickActions.addItem": "新增商品",
    "quickActions.takePayment": "收款",
    "quickActions.createDiscount": "建立折扣",
    "quickActions.addCustomer": "新增顧客",
    "quickActions.connectTerminal": "連接終端",

    "performance.title": "業績",
    "performance.subtitle": "所選時段的銷售概覽",
    "performance.allLocations": "所有分店",
    "performance.comparePrevious": "對比：上期",
    "performance.netSales": "淨銷售額",
    "performance.grossSales": "總銷售額",
    "performance.transactions": "交易數",
    "performance.avgBasket": "平均消費",
    "performance.thisPeriod": "本期",
    "performance.previousPeriod": "上期",

    "insights.title": "AI 洞察",
    "insights.subtitle": "由 CountingStars AI 提供",
    "insights.newCount": "{count} 條新",
    "insights.viewAll": "查看全部洞察",

    "terminalStatus.title": "終端機狀態",
    "terminalStatus.subtitle": "即時機器概覽",
    "terminalStatus.synced": "已同步 {time}",
    "terminalStatus.online": "在線",
    "terminalStatus.offline": "離線",
    "terminalStatus.warnings": "警告",
    "terminalStatus.needRefill": "{count} 台需補貨",
    "terminalStatus.paymentIssue": "{count} 台付款問題",
    "terminalStatus.total": "共 {count} 台",
    "terminalStatus.sales": "{count} 筆銷售",
    "terminalStatus.viewAll": "查看所有終端",
    "terminalStatus.statusRefill": "需補貨",

    "items.title": "商品與服務",
    "items.itemCount": "目錄中有 {count} 件商品",
    "items.filteredCount": "共 {total} 件中的 {filtered} 件",
    "items.addItem": "新增商品",
    "items.allItems": "全部商品",
    "items.searchPlaceholder": "按名稱、SKU 搜尋...",
    "items.itemsCount": "{count} 件商品",
    "items.colItem": "商品",
    "items.colCategory": "分類",
    "items.colPrice": "價格",
    "items.colStock": "庫存",
    "items.colStatus": "狀態",
    "items.selectAll": "全選商品",
    "items.selectItem": "選擇 {name}",
    "items.sortBy": "按{column}排序",
    "items.actionsFor": "{name} 的操作",
    "items.noItemsFound": "找不到商品",
    "items.noItemsHint": "請嘗試調整搜尋或篩選條件",
    "items.addProduct": "新增商品",
    "items.editProduct": "編輯商品",
    "items.image": "圖片",
    "items.uploadImage": "點擊上傳圖片",
    "items.uploadHint": "JPEG、PNG、WebP · 最大 2MB",
    "items.productName": "商品名稱",
    "items.productNamePlaceholder": "例如 Pocari Sweat 500ml",
    "items.chineseName": "中文名稱",
    "items.chineseNamePlaceholder": "例如 寶礦力水特",
    "items.moreTranslations": "更多翻譯（日文、葡文）",
    "items.japaneseName": "日文名稱",
    "items.portugueseName": "葡文名稱",
    "items.sku": "SKU",
    "items.skuPlaceholder": "例如 BEV-001",
    "items.barcode": "條碼",
    "items.barcodePlaceholder": "例如 4901340101234",
    "items.sellingPrice": "售價 (MOP)",
    "items.costPrice": "成本價 (MOP)",
    "items.inventory": "庫存",
    "items.category": "分類",
    "items.noCategory": "未分類",
    "items.markPopular": "標記為熱門",
    "items.manageCategories": "管理分類",
    "items.categoryManager": "分類管理",
    "items.addCategory": "新增分類",
    "items.editCategory": "編輯分類",
    "items.parentCategory": "上級分類",
    "items.parentCategoryNone": "無（頂層分類）",
    "items.categoryNameLabel": "分類名稱（中文）",
    "items.categoryNameEn": "英文名稱",
    "items.categoryNamePt": "葡文名稱",
    "items.categoryNameJa": "日文名稱",
    "items.categoryIcon": "圖標",
    "items.categoryProducts": "{count} 件商品",
    "items.categoryNoProducts": "沒有商品",
    "items.categoryActive": "已啟用",
    "items.categoryInactive": "已停用",
    "items.deleteCategoryTitle": "刪除分類？",
    "items.deleteCategoryDesc": "此分類中的商品將變為未分類。此操作無法撤銷。",
    "items.categoryOrder": "顯示排序",
    "items.chooseIcon": "選擇圖標",
    "items.categoryNameRequired": "請輸入分類名稱",
    "items.createItem": "新增商品",
    "items.editItem": "編輯商品",
    "items.description": "描述",
    "items.descriptionPlaceholder": "添加描述...",
    "items.availability": "供應狀態",
    "items.unsavedChanges": "有未儲存的更改，確定放棄？",
    "items.discard": "放棄",
    "items.addLanguage": "新增語言",
    "items.removeTranslation": "移除翻譯",
    "items.hasVariants": "此商品有多個規格",
    "items.addOptionGroup": "新增規格分組（如 尺寸、顏色）",
    "items.generateVariants": "生成規格明細",
    "common.clearAll": "清除全部",
    "items.translations": "翻譯",
    "items.deleteTitle": "刪除商品？",
    "items.deleteTitleBulk": "刪除 {count} 件商品？",
    "items.deleteDesc": "「{name}」將從目錄中移除。此操作無法撤銷。",
    "items.deleteDescBulk": "將從目錄中移除 {count} 件商品。此操作無法撤銷。",

    "orders.title": "訂單",
    "orders.orderCount": "{count} 筆訂單",
    "orders.filteredCount": "共 {total} 筆中的 {filtered} 筆",
    "orders.searchPlaceholder": "按訂單號搜尋...",
    "orders.todaysOrders": "今日訂單",
    "orders.todaysRevenue": "今日營收",
    "orders.weekOrders": "本週訂單",
    "orders.weekRevenue": "本週營收",
    "orders.colOrderNumber": "訂單號",
    "orders.colDate": "日期",
    "orders.colItems": "品項",
    "orders.colTotal": "合計",
    "orders.colPayment": "付款方式",
    "orders.colStatus": "狀態",
    "orders.noOrders": "找不到訂單",
    "orders.noOrdersHint": "建立訂單後會顯示在此",
    "orders.noOrdersHintFiltered": "請嘗試調整搜尋條件",
    "orders.statusCompleted": "已完成",
    "orders.statusPending": "待處理",
    "orders.statusCancelled": "已取消",
    "orders.statusRefunded": "已退款",
    "orders.payCash": "現金",
    "orders.payMpay": "MPay",
    "orders.payAlipay": "支付寶",
    "orders.payWechat": "微信支付",
    "orders.payVisa": "Visa",
    "orders.payMastercard": "Mastercard",
    "orders.payUnionpay": "銀聯",
    "orders.detail.title": "訂單 {orderNumber}",
    "orders.detail.orderInfo": "訂單資料",
    "orders.detail.lineItems": "商品明細",
    "orders.detail.paymentInfo": "付款資料",
    "orders.detail.date": "日期",
    "orders.detail.status": "狀態",
    "orders.detail.itemCount": "{count} 件商品",
    "orders.detail.subtotal": "小計",
    "orders.detail.discount": "折扣",
    "orders.detail.tax": "稅額",
    "orders.detail.total": "合計",
    "orders.detail.product": "商品",
    "orders.detail.variant": "規格",
    "orders.detail.unitPrice": "單價",
    "orders.detail.qty": "數量",
    "orders.detail.lineTotal": "小計",
    "orders.detail.paymentMethod": "付款方式",
    "orders.detail.amountPaid": "已付金額",
    "orders.detail.cashReceived": "收到現金",
    "orders.detail.changeGiven": "找零",
    "orders.detail.paidAt": "付款時間",
    "orders.detail.notes": "備註",
    "orders.detail.notFound": "找不到訂單",
    "orders.detail.notFoundHint": "此訂單可能已刪除或不存在",
    "orders.allDates": "所有日期",
    "orders.allMethods": "所有付款方式",
    "orders.allStatuses": "所有狀態",
    "orders.filteredOrders": "訂單數",
    "orders.filteredRevenue": "營收",
    "orders.completedOrders": "已完成",
    "orders.avgOrderValue": "平均消費",
    "orders.statusVoided": "已作廢",

    "customers.title": "顧客",
    "customers.memberCount": "{count} 位已註冊會員",
    "customers.addCustomer": "新增顧客",
    "customers.totalCustomers": "總顧客數",
    "customers.newThisMonth": "本月新增",
    "customers.activeThisWeek": "本週活躍",
    "customers.avgSpend": "平均消費",
    "customers.searchPlaceholder": "按姓名、電話、電郵搜尋...",
    "customers.colCustomer": "顧客",
    "customers.colTier": "等級",
    "customers.colTotalSpent": "總消費",
    "customers.colVisits": "來店次數",
    "customers.colPoints": "積分",
    "customers.colLastVisit": "最後來店",
    "customers.tierRegular": "普通",
    "customers.tierSilver": "銀卡",
    "customers.tierGold": "金卡",
    "customers.tierVip": "VIP",
    "customers.sendMessage": "發送訊息",
    "customers.moreActions": "更多操作",

    "terminals.title": "機器 / 終端",
    "terminals.deviceCount": "已註冊 {count} 台設備",
    "terminals.addTerminal": "新增終端",
    "terminals.viewGrid": "網格檢視",
    "terminals.viewList": "列表檢視",
    "terminals.statusOnline": "在線",
    "terminals.statusOffline": "離線",
    "terminals.statusUnpaired": "未配對",
    "terminals.statusWarning": "警告",
    "terminals.statusMaintenance": "維護中",
    "terminals.revenue": "營收",
    "terminals.shiftRevenue": "當更",
    "terminals.stock": "庫存",
    "terminals.synced": "已同步",
    "terminals.colTerminal": "終端",
    "terminals.colStatus": "狀態",
    "terminals.colStock": "庫存",
    "terminals.colSales": "銷售",
    "terminals.colRevenue": "營收",
    "terminals.colLastSync": "最後同步",
    "terminals.colUptime": "運行時間",
    "terminals.actionsFor": "{name} 的操作",
    "terminals.viewDetails": "查看詳情",
    "terminals.restart": "重啟",
    "terminals.configure": "設定",
    "terminals.disable": "停用",
    "terminals.enable": "啟用",
    "terminals.statusDisabled": "已停用",
    "terminals.regenerateCode": "重新產生代碼",
    "terminals.unlink": "解除綁定",
    "terminals.unlinkConfirm": "確定解除綁定？",
    "terminals.unlinkMessage": "「{name}」的使用中工作階段將被終止，裝置需要使用新代碼重新啟用。",
    "terminals.unlinking": "正在解除...",
    "terminals.remove": "移除",
    "terminals.removeConfirm": "移除終端？",
    "terminals.removeMessage": "「{name}」將被永久刪除，此操作無法撤銷。",
    "terminals.removing": "移除中...",
    "terminals.activationCodeFor": "{code} 的啟用代碼",
    "terminals.activationCode": "啟用代碼",
    "terminals.activationCodeHint": "在收銀終端輸入此代碼以完成啟用。",
    "terminals.viewCode": "查看啟用代碼",
    "terminals.copyCode": "複製代碼",
    "terminals.terminalCreated": "終端已建立",
    "terminals.createTerminal": "新增",
    "terminals.creating": "新增中...",
    "terminals.createdMessage": "終端 {code} 已建立成功。",
    "terminals.enterActivation": "在收銀終端輸入以下啟用代碼：",
    "terminals.nameLabel": "名稱",
    "terminals.locationLabel": "位置",
    "terminals.notesLabel": "備註",
    "terminals.namePlaceholder": "例：前台收銀",
    "terminals.locationPlaceholder": "例：地下大堂",
    "terminals.notesPlaceholder": "選填備註",
    "terminals.searchPlaceholder": "搜尋終端...",
    "terminals.allStatuses": "所有狀態",
    "terminals.noResults": "找不到終端。",
    "terminals.cashier": "收銀員",
    "terminals.orders": "訂單",
    "terminals.shiftOrders": "當更",
    "terminals.colOrders": "訂單",
    "terminals.colCashier": "收銀員",
    "terminals.total": "總計",

    "comingSoon.title": "即將推出",
    "comingSoon.description": "{module}模組正在開發中，敬請期待。",

    "dateRange.today": "今天",
    "dateRange.yesterday": "昨天",
    "dateRange.last7Days": "最近 7 天",
    "dateRange.last14Days": "最近 14 天",
    "dateRange.last30Days": "最近 30 天",
    "dateRange.thisMonth": "本月",
    "dateRange.selectRange": "選擇日期範圍",

    // Settings
    "settings.pageTitle": "設定",
    "settings.subtitle": "管理你的商店設定",
    "settings.tabBusinessInfo": "商業資訊",
    "settings.tabPaymentMethods": "付款方式",
    "settings.tabRegional": "地區設定",
    "settings.tabBranding": "品牌形象",
    "settings.tabReceipt": "收據",
    "settings.shopDetails": "商店資料",
    "settings.shopName": "商店名稱",
    "settings.shopNamePlaceholder": "輸入商店名稱",
    "settings.address": "地址",
    "settings.addressPlaceholder": "完整商店地址",
    "settings.phone": "電話",
    "settings.email": "電郵",
    "settings.businessHours": "營業時間",
    "settings.closed": "休息",
    "settings.acceptedPaymentMethods": "接受的付款方式",
    "settings.paymentMethodsDesc": "啟用或停用付款方式。",
    "settings.paymentCash": "現金",
    "settings.paymentCashDesc": "接受現金付款",
    "settings.paymentCard": "信用卡 (Visa/Master)",
    "settings.paymentCardDesc": "接受信用卡付款",
    "settings.paymentMpay": "MPAY",
    "settings.paymentMpayDesc": "澳門手機支付",
    "settings.paymentAlipay": "支付寶",
    "settings.paymentAlipayDesc": "支付寶及支付寶香港",
    "settings.paymentWechat": "微信支付",
    "settings.paymentWechatDesc": "微信支付付款",
    "settings.currencyAndTax": "貨幣及稅務",
    "settings.currency": "貨幣",
    "settings.taxRate": "稅率 (%)",
    "settings.defaultLanguage": "預設語言",
    "settings.defaultLanguageDesc": "POS的預設顯示語言。",
    "settings.accentColor": "主題顏色",
    "settings.accentColorDesc": "介面的主要主題顏色。",
    "settings.preview": "預覽",
    "settings.sampleButton": "範例按鈕",
    "settings.receiptContent": "收據內容",
    "settings.receiptHeaderLabel": "頂部文字",
    "settings.receiptFooterLabel": "底部文字",
    "settings.displayOptions": "顯示選項",
    "settings.showAddressOnReceipt": "收據上顯示地址",
    "settings.showPhoneOnReceipt": "收據上顯示電話",
    "settings.showTaxOnReceipt": "收據上顯示稅項",
    "settings.receiptPreview": "收據預覽",
    "settings.successBusinessInfo": "商業資訊已儲存",
    "settings.successPaymentMethods": "付款方式已儲存",
    "settings.successRegional": "地區設定已儲存",
    "settings.successBranding": "品牌形象已儲存",
    "settings.successReceipt": "收據設定已儲存",

    // Staff
    "staff.pageTitle": "員工",
    "staff.teamMembers": "{count} 位團隊成員",
    "staff.addStaff": "新增員工",
    "staff.editStaff": "編輯員工",
    "staff.nameLabel": "姓名",
    "staff.emailLabel": "電郵",
    "staff.phoneLabel": "電話",
    "staff.roleLabel": "角色",
    "staff.roleOwner": "店主",
    "staff.roleCashier": "收銀員",
    "staff.roleAccountant": "會計",
    "staff.rolePromoter": "推廣員",
    "staff.posAccessLabel": "POS 權限",
    "staff.posRoleNone": "無 POS 權限",
    "staff.posRoleStoreManager": "店長",
    "staff.adminAccessLabel": "管理面板",
    "staff.adminRoleNone": "無管理權限",
    "staff.pinLabel": "PIN (4-6位)",
    "staff.passwordLabel": "密碼",
    "staff.activeLabel": "啟用",
    "staff.inactiveWarning": "停用的員工無法登入",
    "staff.lastLogin": "最後登入",
    "staff.deleteTitle": "刪除員工？",
    "staff.deleteDesc": "此操作無法撤銷。",
    "staff.emptyTitle": "暫無員工",
    "staff.emptyDesc": "新增你的第一位團隊成員。",
    "staff.never": "從未",
    "staff.searchPlaceholder": "按姓名、電郵、電話搜尋...",
    "staff.allRoles": "所有角色",
    "staff.allStatuses": "所有狀態",
    "staff.statusActive": "啟用",
    "staff.statusInactive": "停用",
    "staff.locationsLabel": "分店",
    "staff.ownerAllLocations": "店主可存取所有分店",
    "staff.allLocations": "所有分店",
    "staff.noLocations": "未分配分店",
    "staff.noLocationsAvailable": "暫無分店",

    // Shifts
    "shifts.title": "輪更",
    "shifts.shiftCount": "{count} 個輪更",
    "sidebar.shifts": "輪更",
    "shifts.statusOpen": "進行中",
    "shifts.statusPending": "待審批",
    "shifts.statusClosed": "已結束",
    "shifts.statusFlagged": "已標記",
    "shifts.colCashier": "收銀員",
    "shifts.colTerminal": "終端",
    "shifts.colOpened": "開始時間",
    "shifts.colDuration": "時長",
    "shifts.colOrders": "訂單",
    "shifts.colSales": "銷售",
    "shifts.colVariance": "差異",
    "shifts.colStatus": "狀態",
    "shifts.noShifts": "找不到輪更記錄",
    "shifts.noShiftsHint": "收銀員開始工作後將會顯示",
    "shifts.approve": "批准",
    "shifts.flag": "標記",
    "shifts.cashLedger": "現金帳目",
    "shifts.ledgerTime": "時間",
    "shifts.ledgerEvent": "事件",
    "shifts.ledgerIn": "收入",
    "shifts.ledgerOut": "支出",
    "shifts.ledgerBalance": "餘額",
    "shifts.detail.cashier": "收銀員",
    "shifts.detail.terminal": "終端",
    "shifts.detail.location": "分店",
    "shifts.detail.status": "狀態",
    "shifts.detail.opened": "開始時間",
    "shifts.detail.closed": "結束時間",
    "shifts.detail.orders": "訂單數",
    "shifts.detail.totalSales": "總銷售額",
    "shifts.detail.openingFloat": "開班金額",
    "shifts.detail.expectedCash": "應有現金",
    "shifts.detail.actualCash": "實際現金",
    "shifts.detail.variance": "差異",
    "shifts.detail.notes": "備註",
    "shifts.searchPlaceholder": "按收銀員或終端搜尋...",

    // Locations
    "locations.title": "分店",
    "locations.subtitle": "管理你的實體店舖位置",
    "locations.add": "新增分店",
    "locations.addNew": "新增分店",
    "locations.allLocations": "所有分店",
    "locations.nameLabel": "名稱",
    "locations.addressLabel": "地址",
    "locations.phoneLabel": "電話",
    "locations.emailLabel": "電郵",

    // Payments
    "payments.pageTitle": "付款與發票",
    "payments.todaysRevenue": "今日收入",
    "payments.todaysTransactions": "今日交易",
    "payments.cashTotal": "現金合計",
    "payments.digitalTotal": "電子支付合計",
    "payments.methodBreakdown": "付款方式分佈",
    "payments.filterAll": "全部",
    "payments.filterCash": "現金",
    "payments.filterCard": "卡",
    "payments.filterQR": "二維碼",
    "payments.searchPlaceholder": "按訂單編號搜尋...",
    "payments.orderNumber": "訂單編號",
    "payments.dateTime": "日期/時間",
    "payments.method": "方式",
    "payments.amount": "金額",
    "payments.cashDetails": "現金詳情",
    "payments.received": "收到",
    "payments.change": "找續",
    "payments.emptyTitle": "暫無交易記錄",
    "payments.emptyDesc": "交易記錄將顯示在這裡。",

    // AI Insights (Full Page)
    "insights.pageTitle": "AI 洞察",
    "insights.totalRevenue": "總收入",
    "insights.totalOrders": "總訂單",
    "insights.avgOrderValue": "平均消費",
    "insights.productsInCatalog": "商品目錄",
    "insights.salesTrendTitle": "銷售趨勢（最近30天）",
    "insights.noSalesData": "暫無銷售數據",
    "insights.topProductsTitle": "最暢銷商品",
    "insights.noProductData": "暫無商品數據",
    "insights.paymentBreakdown": "付款方式分佈",
    "insights.noPaymentData": "暫無付款數據",
    "insights.insightsTitle": "洞察",
    "insights.topSeller": "最暢銷：{name}，MOP {amount}",
    "insights.cashPercent": "現金支付：佔所有交易的{pct}%",
    "insights.avgValue": "平均消費：MOP {value}",
    "insights.totalProcessed": "已處理訂單：{count}",
    "insights.catalogCount": "目錄中有{count}件商品",

    // Online
    "online.pageTitle": "線上",
    "online.subtitle": "管理你的銷售渠道",
    "online.salesChannels": "銷售渠道",
    "online.posTerminal": "POS 終端",
    "online.posTerminalDesc": "店內銷售終端",
    "online.statusActive": "啟用中",
    "online.terminalsConnected": "{count} 台終端已連接",
    "online.onlineStore": "網上商店",
    "online.onlineStoreDesc": "讓客人線上訂購",
    "online.statusEnabled": "已啟用",
    "online.enableToStart": "啟用以開始線上銷售",
    "online.wechatMiniProgram": "微信小程序",
    "online.wechatDesc": "透過微信銷售",
    "online.comingSoon": "即將推出",
    "online.storeSettings": "網上商店設定",
    "online.storeUrl": "商店網址",
    "online.copied": "已複製！",
    "online.copy": "複製",
    "online.storeDescription": "商店描述",
    "online.storeDescPlaceholder": "描述你的商店...",
    "online.storeQRCode": "商店二維碼",
    "online.successMessage": "設定已儲存",

    // Common (additions)
    "common.saving": "儲存中...",
    "common.to": "至",
    "common.notAvailable": "--",

    // Reports
    "reports.pageTitle": "報表",
    "reports.subtitle": "銷售分析與業務報表",
    "reports.totalRevenue": "總營收",
    "reports.totalOrders": "總訂單",
    "reports.avgOrderValue": "平均消費",
    "reports.topCategory": "最佳分類",
    "reports.salesTrend": "銷售趨勢",
    "reports.last14Days": "最近 14 天",
    "reports.last30Days": "最近 30 天",
    "reports.last90Days": "最近 90 天",
    "reports.last7Days": "最近 7 天",
    "reports.topProducts": "熱銷商品",
    "reports.productName": "商品",
    "reports.qtySold": "銷量",
    "reports.revenue": "營收",
    "reports.salesByCategory": "分類銷售",
    "reports.category": "分類",
    "reports.orders": "訂單",
    "reports.paymentMethods": "付款方式",
    "reports.noData": "暫無報表數據",
    "reports.noDataDesc": "從收銀台創建訂單後，報表將在此顯示",
    "reports.exportCsv": "匯出 CSV",
    "reports.date": "日期",
    "reports.dailyRevenue": "每日營收",
    "reports.percentage": "佔比",
  },

  // ═══════════════════════════════════════════════════════
  // SIMPLIFIED CHINESE (简体中文)
  // ═══════════════════════════════════════════════════════
  sc: {
    "common.cancel": "取消",
    "common.close": "关闭",
    "common.save": "保存",
    "common.saveChanges": "保存更改",
    "common.delete": "删除",
    "common.edit": "编辑",
    "common.duplicate": "复制",
    "common.search": "搜索...",
    "common.export": "导出",
    "common.import": "导入",
    "common.add": "添加",
    "common.view": "查看",
    "common.back": "返回",
    "common.done": "完成",
    "common.loading": "加载中...",
    "common.error": "错误",
    "common.success": "成功",
    "common.confirm": "确认",
    "common.mop": "MOP",
    "common.showingRange": "显示 {start}–{end} 共 {total} 项",
    "common.previousPage": "上一页",
    "common.nextPage": "下一页",
    "common.noResults": "未找到结果",
    "common.tryAdjusting": "请尝试调整搜索或筛选条件",
    "common.statusActive": "启用",
    "common.statusDraft": "草稿",
    "common.statusInactive": "停用",
    "common.statusSoldOut": "售罄",
    "common.vsPrevPeriod": "较上期",
    "common.selected": "已选 {count} 项",
    "common.clearSelection": "清除选择",
    "common.status": "状态",
    "common.unlimited": "不限",

    "meta.title": "CountingStars",
    "meta.description": "现代化 POS 及零售管理平台",

    "sidebar.home": "首页",
    "sidebar.itemsServices": "商品与服务",
    "sidebar.orders": "订单",
    "sidebar.paymentsInvoices": "付款与发票",
    "sidebar.online": "线上",
    "sidebar.customers": "顾客",
    "sidebar.reports": "报表",
    "sidebar.terminals": "机器 / 终端",
    "sidebar.aiInsights": "AI 洞察",
    "sidebar.staff": "员工",
    "sidebar.settings": "设置",
    "sidebar.locations": "分店",
    "sidebar.takePayment": "收款",
    "sidebar.notifications": "通知",
    "sidebar.inbox": "收件箱",
    "sidebar.help": "帮助",
    "sidebar.signOut": "退出登录",
    "sidebar.expandSidebar": "展开侧栏",
    "sidebar.collapseSidebar": "收起侧栏",
    "sidebar.location": "澳门 · 总店",
    "sidebar.openMenu": "打开导航菜单",

    "login.signIn": "登录",
    "login.signInSubtitle": "登录你的账户",
    "login.emailOrPhone": "邮箱或手机号",
    "login.emailPlaceholder": "owner@countingstars.mo",
    "login.password": "密码",
    "login.passwordPlaceholder": "请输入密码",
    "login.showPassword": "显示密码",
    "login.hidePassword": "隐藏密码",
    "login.signInButton": "登录",
    "login.demoHint": "演示: owner@countingstars.mo / demo1234",
    "login.invalidCredentials": "邮箱/手机号或密码不正确",

    "home.title": "首页",
    "home.welcomeBack": "欢迎回到管理面板",

    "setup.greeting": "你好！让我们开始设置吧。",
    "setup.stepsCompleted": "已完成 {completed}/{total} 个步骤",
    "setup.finishLater": "稍后再完成",
    "setup.viewAllSteps": "查看所有步骤",
    "setup.setupProgress": "设置进度",
    "setup.account": "账户",
    "setup.accountDesc": "设置你的商家资料和团队成员",
    "setup.pos": "RetailOS POS",
    "setup.posDesc": "配置你的销售终端进行店内销售",
    "setup.payments": "付款",
    "setup.paymentsDesc": "连接付款方式以接收交易",
    "setup.devices": "设备",
    "setup.devicesDesc": "设置终端机并连接硬件",

    "quickActions.title": "快速操作",
    "quickActions.addItem": "添加商品",
    "quickActions.takePayment": "收款",
    "quickActions.createDiscount": "创建折扣",
    "quickActions.addCustomer": "添加顾客",
    "quickActions.connectTerminal": "连接终端",

    "performance.title": "业绩",
    "performance.subtitle": "所选时段的销售概览",
    "performance.allLocations": "所有门店",
    "performance.comparePrevious": "对比：上期",
    "performance.netSales": "净销售额",
    "performance.grossSales": "总销售额",
    "performance.transactions": "交易数",
    "performance.avgBasket": "平均消费",
    "performance.thisPeriod": "本期",
    "performance.previousPeriod": "上期",

    "insights.title": "AI 洞察",
    "insights.subtitle": "由 CountingStars AI 提供",
    "insights.newCount": "{count} 条新",
    "insights.viewAll": "查看全部洞察",

    "terminalStatus.title": "终端机状态",
    "terminalStatus.subtitle": "实时机器概览",
    "terminalStatus.synced": "已同步 {time}",
    "terminalStatus.online": "在线",
    "terminalStatus.offline": "离线",
    "terminalStatus.warnings": "警告",
    "terminalStatus.needRefill": "{count} 台需补货",
    "terminalStatus.paymentIssue": "{count} 台付款问题",
    "terminalStatus.total": "共 {count} 台",
    "terminalStatus.sales": "{count} 笔销售",
    "terminalStatus.viewAll": "查看所有终端",
    "terminalStatus.statusRefill": "需补货",

    "items.title": "商品与服务",
    "items.itemCount": "目录中有 {count} 件商品",
    "items.filteredCount": "共 {total} 件中的 {filtered} 件",
    "items.addItem": "添加商品",
    "items.allItems": "全部商品",
    "items.searchPlaceholder": "按名称、SKU 搜索...",
    "items.itemsCount": "{count} 件商品",
    "items.colItem": "商品",
    "items.colCategory": "分类",
    "items.colPrice": "价格",
    "items.colStock": "库存",
    "items.colStatus": "状态",
    "items.selectAll": "全选商品",
    "items.selectItem": "选择 {name}",
    "items.sortBy": "按{column}排序",
    "items.actionsFor": "{name} 的操作",
    "items.noItemsFound": "未找到商品",
    "items.noItemsHint": "请尝试调整搜索或筛选条件",
    "items.addProduct": "添加商品",
    "items.editProduct": "编辑商品",
    "items.image": "图片",
    "items.uploadImage": "点击上传图片",
    "items.uploadHint": "JPEG、PNG、WebP · 最大 2MB",
    "items.productName": "商品名称",
    "items.productNamePlaceholder": "例如 Pocari Sweat 500ml",
    "items.chineseName": "中文名称",
    "items.chineseNamePlaceholder": "例如 宝矿力水特",
    "items.moreTranslations": "更多翻译（日文、葡文）",
    "items.japaneseName": "日文名称",
    "items.portugueseName": "葡文名称",
    "items.sku": "SKU",
    "items.skuPlaceholder": "例如 BEV-001",
    "items.barcode": "条码",
    "items.barcodePlaceholder": "例如 4901340101234",
    "items.sellingPrice": "售价 (MOP)",
    "items.costPrice": "成本价 (MOP)",
    "items.inventory": "库存",
    "items.category": "分类",
    "items.noCategory": "未分类",
    "items.markPopular": "标记为热门",
    "items.manageCategories": "管理分类",
    "items.categoryManager": "分类管理",
    "items.addCategory": "新增分类",
    "items.editCategory": "编辑分类",
    "items.parentCategory": "上级分类",
    "items.parentCategoryNone": "无（顶层分类）",
    "items.categoryNameLabel": "分类名称（中文）",
    "items.categoryNameEn": "英文名称",
    "items.categoryNamePt": "葡文名称",
    "items.categoryNameJa": "日文名称",
    "items.categoryIcon": "图标",
    "items.categoryProducts": "{count} 件商品",
    "items.categoryNoProducts": "没有商品",
    "items.categoryActive": "已启用",
    "items.categoryInactive": "已停用",
    "items.deleteCategoryTitle": "删除分类？",
    "items.deleteCategoryDesc": "此分类中的商品将变为未分类。此操作无法撤销。",
    "items.categoryOrder": "显示排序",
    "items.chooseIcon": "选择图标",
    "items.categoryNameRequired": "请输入分类名称",
    "items.createItem": "新增商品",
    "items.editItem": "编辑商品",
    "items.description": "描述",
    "items.descriptionPlaceholder": "添加描述...",
    "items.availability": "供应状态",
    "items.unsavedChanges": "有未保存的更改，确定放弃？",
    "items.discard": "放弃",
    "items.addLanguage": "添加语言",
    "items.removeTranslation": "移除翻译",
    "items.hasVariants": "此商品有多个规格",
    "items.addOptionGroup": "新增规格分组（如 尺寸、颜色）",
    "items.generateVariants": "生成规格明细",
    "common.clearAll": "清除全部",
    "items.translations": "翻译",
    "items.deleteTitle": "删除商品？",
    "items.deleteTitleBulk": "删除 {count} 件商品？",
    "items.deleteDesc": "「{name}」将从目录中移除。此操作无法撤销。",
    "items.deleteDescBulk": "将从目录中移除 {count} 件商品。此操作无法撤销。",

    "orders.title": "订单",
    "orders.orderCount": "{count} 笔订单",
    "orders.filteredCount": "共 {total} 笔中的 {filtered} 笔",
    "orders.searchPlaceholder": "按订单号搜索...",
    "orders.todaysOrders": "今日订单",
    "orders.todaysRevenue": "今日营收",
    "orders.weekOrders": "本周订单",
    "orders.weekRevenue": "本周营收",
    "orders.colOrderNumber": "订单号",
    "orders.colDate": "日期",
    "orders.colItems": "品项",
    "orders.colTotal": "合计",
    "orders.colPayment": "付款方式",
    "orders.colStatus": "状态",
    "orders.noOrders": "未找到订单",
    "orders.noOrdersHint": "创建订单后会显示在此",
    "orders.noOrdersHintFiltered": "请尝试调整搜索条件",
    "orders.statusCompleted": "已完成",
    "orders.statusPending": "待处理",
    "orders.statusCancelled": "已取消",
    "orders.statusRefunded": "已退款",
    "orders.payCash": "现金",
    "orders.payMpay": "MPay",
    "orders.payAlipay": "支付宝",
    "orders.payWechat": "微信支付",
    "orders.payVisa": "Visa",
    "orders.payMastercard": "Mastercard",
    "orders.payUnionpay": "银联",
    "orders.detail.title": "订单 {orderNumber}",
    "orders.detail.orderInfo": "订单信息",
    "orders.detail.lineItems": "商品明细",
    "orders.detail.paymentInfo": "付款信息",
    "orders.detail.date": "日期",
    "orders.detail.status": "状态",
    "orders.detail.itemCount": "{count} 件商品",
    "orders.detail.subtotal": "小计",
    "orders.detail.discount": "折扣",
    "orders.detail.tax": "税额",
    "orders.detail.total": "合计",
    "orders.detail.product": "商品",
    "orders.detail.variant": "规格",
    "orders.detail.unitPrice": "单价",
    "orders.detail.qty": "数量",
    "orders.detail.lineTotal": "小计",
    "orders.detail.paymentMethod": "付款方式",
    "orders.detail.amountPaid": "已付金额",
    "orders.detail.cashReceived": "收到现金",
    "orders.detail.changeGiven": "找零",
    "orders.detail.paidAt": "付款时间",
    "orders.detail.notes": "备注",
    "orders.detail.notFound": "找不到订单",
    "orders.detail.notFoundHint": "此订单可能已删除或不存在",
    "orders.allDates": "所有日期",
    "orders.allMethods": "所有付款方式",
    "orders.allStatuses": "所有状态",
    "orders.filteredOrders": "订单数",
    "orders.filteredRevenue": "营收",
    "orders.completedOrders": "已完成",
    "orders.avgOrderValue": "平均消费",
    "orders.statusVoided": "已作废",

    "customers.title": "顾客",
    "customers.memberCount": "{count} 位已注册会员",
    "customers.addCustomer": "添加顾客",
    "customers.totalCustomers": "总顾客数",
    "customers.newThisMonth": "本月新增",
    "customers.activeThisWeek": "本周活跃",
    "customers.avgSpend": "平均消费",
    "customers.searchPlaceholder": "按姓名、电话、邮箱搜索...",
    "customers.colCustomer": "顾客",
    "customers.colTier": "等级",
    "customers.colTotalSpent": "总消费",
    "customers.colVisits": "来店次数",
    "customers.colPoints": "积分",
    "customers.colLastVisit": "最后来店",
    "customers.tierRegular": "普通",
    "customers.tierSilver": "银卡",
    "customers.tierGold": "金卡",
    "customers.tierVip": "VIP",
    "customers.sendMessage": "发送消息",
    "customers.moreActions": "更多操作",

    "terminals.title": "机器 / 终端",
    "terminals.deviceCount": "已注册 {count} 台设备",
    "terminals.addTerminal": "添加终端",
    "terminals.viewGrid": "网格视图",
    "terminals.viewList": "列表视图",
    "terminals.statusOnline": "在线",
    "terminals.statusOffline": "离线",
    "terminals.statusUnpaired": "未配对",
    "terminals.statusWarning": "警告",
    "terminals.statusMaintenance": "维护中",
    "terminals.revenue": "营收",
    "terminals.shiftRevenue": "当更",
    "terminals.stock": "库存",
    "terminals.synced": "已同步",
    "terminals.colTerminal": "终端",
    "terminals.colStatus": "状态",
    "terminals.colStock": "库存",
    "terminals.colSales": "销售",
    "terminals.colRevenue": "营收",
    "terminals.colLastSync": "最后同步",
    "terminals.colUptime": "运行时间",
    "terminals.actionsFor": "{name} 的操作",
    "terminals.viewDetails": "查看详情",
    "terminals.restart": "重启",
    "terminals.configure": "设置",
    "terminals.disable": "停用",
    "terminals.enable": "启用",
    "terminals.statusDisabled": "已停用",
    "terminals.regenerateCode": "重新生成代码",
    "terminals.unlink": "解除绑定",
    "terminals.unlinkConfirm": "确定解除绑定？",
    "terminals.unlinkMessage": "「{name}」的使用中工作阶段将被终止，设备需要使用新代码重新启用。",
    "terminals.unlinking": "正在解除...",
    "terminals.remove": "移除",
    "terminals.removeConfirm": "移除终端？",
    "terminals.removeMessage": "「{name}」将被永久删除，此操作无法撤销。",
    "terminals.removing": "移除中...",
    "terminals.activationCodeFor": "{code} 的激活代码",
    "terminals.activationCode": "激活代码",
    "terminals.activationCodeHint": "在收银终端输入此代码以完成激活。",
    "terminals.viewCode": "查看激活代码",
    "terminals.copyCode": "复制代码",
    "terminals.terminalCreated": "终端已创建",
    "terminals.createTerminal": "新增",
    "terminals.creating": "新增中...",
    "terminals.createdMessage": "终端 {code} 已创建成功。",
    "terminals.enterActivation": "在收银终端输入以下激活代码：",
    "terminals.nameLabel": "名称",
    "terminals.locationLabel": "位置",
    "terminals.notesLabel": "备注",
    "terminals.namePlaceholder": "例：前台收银",
    "terminals.locationPlaceholder": "例：一楼大厅",
    "terminals.notesPlaceholder": "选填备注",
    "terminals.searchPlaceholder": "搜索终端...",
    "terminals.allStatuses": "所有状态",
    "terminals.noResults": "未找到终端。",
    "terminals.cashier": "收银员",
    "terminals.orders": "订单",
    "terminals.shiftOrders": "当更",
    "terminals.colOrders": "订单",
    "terminals.colCashier": "收银员",
    "terminals.total": "总计",

    "comingSoon.title": "即将推出",
    "comingSoon.description": "{module}模块正在开发中，敬请期待。",

    "dateRange.today": "今天",
    "dateRange.yesterday": "昨天",
    "dateRange.last7Days": "最近 7 天",
    "dateRange.last14Days": "最近 14 天",
    "dateRange.last30Days": "最近 30 天",
    "dateRange.thisMonth": "本月",
    "dateRange.selectRange": "选择日期范围",

    // Settings
    "settings.pageTitle": "设定",
    "settings.subtitle": "管理你的商店设定",
    "settings.tabBusinessInfo": "商业资讯",
    "settings.tabPaymentMethods": "付款方式",
    "settings.tabRegional": "地区设定",
    "settings.tabBranding": "品牌形象",
    "settings.tabReceipt": "收据",
    "settings.shopDetails": "商店资料",
    "settings.shopName": "商店名称",
    "settings.shopNamePlaceholder": "输入商店名称",
    "settings.address": "地址",
    "settings.addressPlaceholder": "完整商店地址",
    "settings.phone": "电话",
    "settings.email": "电邮",
    "settings.businessHours": "营业时间",
    "settings.closed": "休息",
    "settings.acceptedPaymentMethods": "接受的付款方式",
    "settings.paymentMethodsDesc": "启用或停用付款方式。",
    "settings.paymentCash": "现金",
    "settings.paymentCashDesc": "接受现金付款",
    "settings.paymentCard": "信用卡 (Visa/Master)",
    "settings.paymentCardDesc": "接受信用卡付款",
    "settings.paymentMpay": "MPAY",
    "settings.paymentMpayDesc": "澳门手机支付",
    "settings.paymentAlipay": "支付宝",
    "settings.paymentAlipayDesc": "支付宝及支付宝香港",
    "settings.paymentWechat": "微信支付",
    "settings.paymentWechatDesc": "微信支付付款",
    "settings.currencyAndTax": "货币及税务",
    "settings.currency": "货币",
    "settings.taxRate": "税率 (%)",
    "settings.defaultLanguage": "预设语言",
    "settings.defaultLanguageDesc": "POS的预设显示语言。",
    "settings.accentColor": "主题颜色",
    "settings.accentColorDesc": "界面的主要主题颜色。",
    "settings.preview": "预览",
    "settings.sampleButton": "范例按钮",
    "settings.receiptContent": "收据内容",
    "settings.receiptHeaderLabel": "顶部文字",
    "settings.receiptFooterLabel": "底部文字",
    "settings.displayOptions": "显示选项",
    "settings.showAddressOnReceipt": "收据上显示地址",
    "settings.showPhoneOnReceipt": "收据上显示电话",
    "settings.showTaxOnReceipt": "收据上显示税项",
    "settings.receiptPreview": "收据预览",
    "settings.successBusinessInfo": "商业资讯已保存",
    "settings.successPaymentMethods": "付款方式已保存",
    "settings.successRegional": "地区设定已保存",
    "settings.successBranding": "品牌形象已保存",
    "settings.successReceipt": "收据设定已保存",

    // Staff
    "staff.pageTitle": "员工",
    "staff.teamMembers": "{count} 位团队成员",
    "staff.addStaff": "新增员工",
    "staff.editStaff": "编辑员工",
    "staff.nameLabel": "姓名",
    "staff.emailLabel": "电邮",
    "staff.phoneLabel": "电话",
    "staff.roleLabel": "角色",
    "staff.roleOwner": "店主",
    "staff.roleCashier": "收银员",
    "staff.roleAccountant": "会计",
    "staff.rolePromoter": "推广员",
    "staff.posAccessLabel": "POS 权限",
    "staff.posRoleNone": "无 POS 权限",
    "staff.posRoleStoreManager": "店长",
    "staff.adminAccessLabel": "管理面板",
    "staff.adminRoleNone": "无管理权限",
    "staff.pinLabel": "PIN (4-6位)",
    "staff.passwordLabel": "密码",
    "staff.activeLabel": "启用",
    "staff.inactiveWarning": "停用的员工无法登入",
    "staff.lastLogin": "最后登入",
    "staff.deleteTitle": "删除员工？",
    "staff.deleteDesc": "此操作无法撤销。",
    "staff.emptyTitle": "暂无员工",
    "staff.emptyDesc": "新增你的第一位团队成员。",
    "staff.never": "从未",
    "staff.searchPlaceholder": "按姓名、邮箱、电话搜索...",
    "staff.allRoles": "所有角色",
    "staff.allStatuses": "所有状态",
    "staff.statusActive": "启用",
    "staff.statusInactive": "停用",
    "staff.locationsLabel": "门店",
    "staff.ownerAllLocations": "店主可访问所有门店",
    "staff.allLocations": "所有门店",
    "staff.noLocations": "未分配门店",
    "staff.noLocationsAvailable": "暂无门店",

    // Shifts
    "shifts.title": "輪更",
    "shifts.shiftCount": "{count} 个轮更",
    "sidebar.shifts": "輪更",
    "shifts.statusOpen": "进行中",
    "shifts.statusPending": "待审批",
    "shifts.statusClosed": "已结束",
    "shifts.statusFlagged": "已标记",
    "shifts.colCashier": "收银员",
    "shifts.colTerminal": "终端",
    "shifts.colOpened": "开始时间",
    "shifts.colDuration": "时长",
    "shifts.colOrders": "订单",
    "shifts.colSales": "销售",
    "shifts.colVariance": "差异",
    "shifts.colStatus": "状态",
    "shifts.noShifts": "找不到轮更记录",
    "shifts.noShiftsHint": "收银员开始工作后将会显示",
    "shifts.approve": "批准",
    "shifts.flag": "标记",
    "shifts.cashLedger": "现金账目",
    "shifts.ledgerTime": "时间",
    "shifts.ledgerEvent": "事件",
    "shifts.ledgerIn": "收入",
    "shifts.ledgerOut": "支出",
    "shifts.ledgerBalance": "余额",
    "shifts.detail.cashier": "收银员",
    "shifts.detail.terminal": "终端",
    "shifts.detail.location": "门店",
    "shifts.detail.status": "状态",
    "shifts.detail.opened": "开始时间",
    "shifts.detail.closed": "结束时间",
    "shifts.detail.orders": "订单数",
    "shifts.detail.totalSales": "总销售额",
    "shifts.detail.openingFloat": "开班金额",
    "shifts.detail.expectedCash": "应有现金",
    "shifts.detail.actualCash": "实际现金",
    "shifts.detail.variance": "差异",
    "shifts.detail.notes": "备注",
    "shifts.searchPlaceholder": "按收银员或终端搜索...",

    // Locations
    "locations.title": "分店",
    "locations.subtitle": "管理你的实体店铺位置",
    "locations.add": "新增分店",
    "locations.addNew": "新增分店",
    "locations.allLocations": "所有分店",
    "locations.nameLabel": "名称",
    "locations.addressLabel": "地址",
    "locations.phoneLabel": "电话",
    "locations.emailLabel": "邮箱",

    // Payments
    "payments.pageTitle": "付款与发票",
    "payments.todaysRevenue": "今日收入",
    "payments.todaysTransactions": "今日交易",
    "payments.cashTotal": "现金合计",
    "payments.digitalTotal": "电子支付合计",
    "payments.methodBreakdown": "付款方式分布",
    "payments.filterAll": "全部",
    "payments.filterCash": "现金",
    "payments.filterCard": "卡",
    "payments.filterQR": "二维码",
    "payments.searchPlaceholder": "按订单编号搜索...",
    "payments.orderNumber": "订单编号",
    "payments.dateTime": "日期/时间",
    "payments.method": "方式",
    "payments.amount": "金额",
    "payments.cashDetails": "现金详情",
    "payments.received": "收到",
    "payments.change": "找续",
    "payments.emptyTitle": "暂无交易记录",
    "payments.emptyDesc": "交易记录将显示在这里。",

    // AI Insights (Full Page)
    "insights.pageTitle": "AI 洞察",
    "insights.totalRevenue": "总收入",
    "insights.totalOrders": "总订单",
    "insights.avgOrderValue": "平均消费",
    "insights.productsInCatalog": "商品目录",
    "insights.salesTrendTitle": "销售趋势（最近30天）",
    "insights.noSalesData": "暂无销售数据",
    "insights.topProductsTitle": "最畅销商品",
    "insights.noProductData": "暂无商品数据",
    "insights.paymentBreakdown": "付款方式分布",
    "insights.noPaymentData": "暂无付款数据",
    "insights.insightsTitle": "洞察",
    "insights.topSeller": "最畅销：{name}，MOP {amount}",
    "insights.cashPercent": "现金支付：占所有交易的{pct}%",
    "insights.avgValue": "平均消费：MOP {value}",
    "insights.totalProcessed": "已处理订单：{count}",
    "insights.catalogCount": "目录中有{count}件商品",

    // Online
    "online.pageTitle": "线上",
    "online.subtitle": "管理你的销售渠道",
    "online.salesChannels": "销售渠道",
    "online.posTerminal": "POS 终端",
    "online.posTerminalDesc": "店内销售终端",
    "online.statusActive": "启用中",
    "online.terminalsConnected": "{count} 台终端已连接",
    "online.onlineStore": "网上商店",
    "online.onlineStoreDesc": "让客人线上订购",
    "online.statusEnabled": "已启用",
    "online.enableToStart": "启用以开始线上销售",
    "online.wechatMiniProgram": "微信小程序",
    "online.wechatDesc": "通过微信销售",
    "online.comingSoon": "即将推出",
    "online.storeSettings": "网上商店设定",
    "online.storeUrl": "商店网址",
    "online.copied": "已复制！",
    "online.copy": "复制",
    "online.storeDescription": "商店描述",
    "online.storeDescPlaceholder": "描述你的商店...",
    "online.storeQRCode": "商店二维码",
    "online.successMessage": "设定已保存",

    // Common (additions)
    "common.saving": "保存中...",
    "common.to": "至",
    "common.notAvailable": "--",

    // Reports
    "reports.pageTitle": "报表",
    "reports.subtitle": "销售分析与业务报表",
    "reports.totalRevenue": "总营收",
    "reports.totalOrders": "总订单",
    "reports.avgOrderValue": "平均消费",
    "reports.topCategory": "最佳分类",
    "reports.salesTrend": "销售趋势",
    "reports.last14Days": "最近 14 天",
    "reports.last30Days": "最近 30 天",
    "reports.last90Days": "最近 90 天",
    "reports.last7Days": "最近 7 天",
    "reports.topProducts": "热销商品",
    "reports.productName": "商品",
    "reports.qtySold": "销量",
    "reports.revenue": "营收",
    "reports.salesByCategory": "分类销售",
    "reports.category": "分类",
    "reports.orders": "订单",
    "reports.paymentMethods": "付款方式",
    "reports.noData": "暂无报表数据",
    "reports.noDataDesc": "从收银台创建订单后，报表将在此显示",
    "reports.exportCsv": "导出 CSV",
    "reports.date": "日期",
    "reports.dailyRevenue": "每日营收",
    "reports.percentage": "占比",
  },

  // ═══════════════════════════════════════════════════════
  // PORTUGUESE (Português)
  // ═══════════════════════════════════════════════════════
  pt: {
    "common.cancel": "Cancelar",
    "common.close": "Fechar",
    "common.save": "Guardar",
    "common.saveChanges": "Guardar alterações",
    "common.delete": "Eliminar",
    "common.edit": "Editar",
    "common.duplicate": "Duplicar",
    "common.search": "Pesquisar...",
    "common.export": "Exportar",
    "common.import": "Importar",
    "common.add": "Adicionar",
    "common.view": "Ver",
    "common.back": "Voltar",
    "common.done": "Concluído",
    "common.loading": "A carregar...",
    "common.error": "Erro",
    "common.success": "Sucesso",
    "common.confirm": "Confirmar",
    "common.mop": "MOP",
    "common.showingRange": "A mostrar {start}–{end} de {total}",
    "common.previousPage": "Página anterior",
    "common.nextPage": "Página seguinte",
    "common.noResults": "Sem resultados",
    "common.tryAdjusting": "Tente ajustar a pesquisa ou filtro",
    "common.statusActive": "Ativo",
    "common.statusDraft": "Rascunho",
    "common.statusInactive": "Inativo",
    "common.statusSoldOut": "Esgotado",
    "common.vsPrevPeriod": "vs período anterior",
    "common.selected": "{count} selecionados",
    "common.clearSelection": "Limpar seleção",
    "common.status": "Estado",
    "common.unlimited": "Ilimitado",

    "meta.title": "CountingStars",
    "meta.description": "Plataforma moderna de POS e gestão de retalho",

    "sidebar.home": "Início",
    "sidebar.itemsServices": "Artigos e serviços",
    "sidebar.orders": "Encomendas",
    "sidebar.paymentsInvoices": "Pagamentos e faturas",
    "sidebar.online": "Online",
    "sidebar.customers": "Clientes",
    "sidebar.reports": "Relatórios",
    "sidebar.terminals": "Máquinas / Terminais",
    "sidebar.aiInsights": "Análises IA",
    "sidebar.staff": "Equipa",
    "sidebar.settings": "Definições",
    "sidebar.locations": "Localizações",
    "sidebar.takePayment": "Receber pagamento",
    "sidebar.notifications": "Notificações",
    "sidebar.inbox": "Caixa de entrada",
    "sidebar.help": "Ajuda",
    "sidebar.signOut": "Terminar sessão",
    "sidebar.expandSidebar": "Expandir barra lateral",
    "sidebar.collapseSidebar": "Recolher barra lateral",
    "sidebar.location": "Macau · Filial Principal",
    "sidebar.openMenu": "Abrir menu de navegação",

    "login.signIn": "Entrar",
    "login.signInSubtitle": "Aceda à sua conta",
    "login.emailOrPhone": "Email ou Telefone",
    "login.emailPlaceholder": "owner@countingstars.mo",
    "login.password": "Palavra-passe",
    "login.passwordPlaceholder": "Introduza a palavra-passe",
    "login.showPassword": "Mostrar palavra-passe",
    "login.hidePassword": "Ocultar palavra-passe",
    "login.signInButton": "Entrar",
    "login.demoHint": "Demo: owner@countingstars.mo / demo1234",
    "login.invalidCredentials": "Email/telefone ou palavra-passe incorretos",

    "home.title": "Início",
    "home.welcomeBack": "Bem-vindo ao seu painel de controlo",

    "setup.greeting": "Olá! Vamos configurar.",
    "setup.stepsCompleted": "{completed} de {total} passos concluídos",
    "setup.finishLater": "Terminar mais tarde",
    "setup.viewAllSteps": "Ver todos os passos",
    "setup.setupProgress": "Progresso da configuração",
    "setup.account": "Conta",
    "setup.accountDesc": "Configure o perfil do negócio e membros da equipa",
    "setup.pos": "RetailOS POS",
    "setup.posDesc": "Configure o ponto de venda para vendas na loja",
    "setup.payments": "Pagamentos",
    "setup.paymentsDesc": "Conecte métodos de pagamento para aceitar transações",
    "setup.devices": "Dispositivos",
    "setup.devicesDesc": "Configure terminais e conecte hardware",

    "quickActions.title": "Ações rápidas",
    "quickActions.addItem": "Adicionar artigo",
    "quickActions.takePayment": "Receber pagamento",
    "quickActions.createDiscount": "Criar desconto",
    "quickActions.addCustomer": "Adicionar cliente",
    "quickActions.connectTerminal": "Conectar terminal",

    "performance.title": "Desempenho",
    "performance.subtitle": "Resumo de vendas do período selecionado",
    "performance.allLocations": "Todas as localizações",
    "performance.comparePrevious": "Comparar: Período anterior",
    "performance.netSales": "Vendas líquidas",
    "performance.grossSales": "Vendas brutas",
    "performance.transactions": "Transações",
    "performance.avgBasket": "Cesto médio",
    "performance.thisPeriod": "Este período",
    "performance.previousPeriod": "Período anterior",

    "insights.title": "Análises IA",
    "insights.subtitle": "Potenciado por CountingStars IA",
    "insights.newCount": "{count} novas",
    "insights.viewAll": "Ver todas as análises",

    "terminalStatus.title": "Estado dos terminais",
    "terminalStatus.subtitle": "Visão geral em tempo real",
    "terminalStatus.synced": "Sincronizado {time}",
    "terminalStatus.online": "Online",
    "terminalStatus.offline": "Offline",
    "terminalStatus.warnings": "Avisos",
    "terminalStatus.needRefill": "{count} precisam reabastecimento",
    "terminalStatus.paymentIssue": "{count} problema de pagamento",
    "terminalStatus.total": "{count} no total",
    "terminalStatus.sales": "{count} vendas",
    "terminalStatus.viewAll": "Ver todos os terminais",
    "terminalStatus.statusRefill": "Reabastecimento necessário",

    "items.title": "Artigos e serviços",
    "items.itemCount": "{count} artigos no catálogo",
    "items.filteredCount": "{filtered} de {total} artigos",
    "items.addItem": "Adicionar artigo",
    "items.allItems": "Todos os artigos",
    "items.searchPlaceholder": "Pesquisar por nome, SKU...",
    "items.itemsCount": "{count} artigos",
    "items.colItem": "Artigo",
    "items.colCategory": "Categoria",
    "items.colPrice": "Preço",
    "items.colStock": "Stock",
    "items.colStatus": "Estado",
    "items.selectAll": "Selecionar todos",
    "items.selectItem": "Selecionar {name}",
    "items.sortBy": "Ordenar por {column}",
    "items.actionsFor": "Ações para {name}",
    "items.noItemsFound": "Nenhum artigo encontrado",
    "items.noItemsHint": "Tente ajustar a pesquisa ou filtro",
    "items.addProduct": "Adicionar produto",
    "items.editProduct": "Editar produto",
    "items.image": "Imagem",
    "items.uploadImage": "Clique para carregar imagem",
    "items.uploadHint": "JPEG, PNG, WebP · Máx. 2MB",
    "items.productName": "Nome do produto",
    "items.productNamePlaceholder": "Ex: Pocari Sweat 500ml",
    "items.chineseName": "Nome em chinês",
    "items.chineseNamePlaceholder": "Ex: 寶礦力水特",
    "items.moreTranslations": "Mais traduções (Japonês, Português)",
    "items.japaneseName": "Nome em japonês",
    "items.portugueseName": "Nome em português",
    "items.sku": "SKU",
    "items.skuPlaceholder": "Ex: BEV-001",
    "items.barcode": "Código de barras",
    "items.barcodePlaceholder": "Ex: 4901340101234",
    "items.sellingPrice": "Preço de venda (MOP)",
    "items.costPrice": "Preço de custo (MOP)",
    "items.inventory": "Inventário",
    "items.category": "Categoria",
    "items.noCategory": "Sem categoria",
    "items.markPopular": "Marcar como popular",
    "items.manageCategories": "Gerir categorias",
    "items.categoryManager": "Gestor de Categorias",
    "items.addCategory": "Adicionar categoria",
    "items.editCategory": "Editar categoria",
    "items.parentCategory": "Categoria principal",
    "items.parentCategoryNone": "Nenhuma (nível superior)",
    "items.categoryNameLabel": "Nome da categoria (Chinês)",
    "items.categoryNameEn": "Nome em inglês",
    "items.categoryNamePt": "Nome em português",
    "items.categoryNameJa": "Nome em japonês",
    "items.categoryIcon": "Ícone",
    "items.categoryProducts": "{count} produtos",
    "items.categoryNoProducts": "Sem produtos",
    "items.categoryActive": "Ativo",
    "items.categoryInactive": "Inativo",
    "items.deleteCategoryTitle": "Eliminar categoria?",
    "items.deleteCategoryDesc": "Os produtos desta categoria ficarão sem categoria. Esta ação não pode ser desfeita.",
    "items.categoryOrder": "Ordem de exibição",
    "items.chooseIcon": "Escolher ícone",
    "items.categoryNameRequired": "O nome da categoria é obrigatório",
    "items.createItem": "Criar item",
    "items.editItem": "Editar item",
    "items.description": "Descrição",
    "items.descriptionPlaceholder": "Adicionar descrição...",
    "items.availability": "Disponibilidade",
    "items.unsavedChanges": "Tem alterações não guardadas. Descartar?",
    "items.discard": "Descartar",
    "items.addLanguage": "Adicionar idioma",
    "items.removeTranslation": "Remover tradução",
    "items.hasVariants": "Este produto tem variantes",
    "items.addOptionGroup": "Adicionar grupo (ex: Tamanho, Cor)",
    "items.generateVariants": "Gerar variantes",
    "common.clearAll": "Limpar tudo",
    "items.translations": "Traduções",
    "items.deleteTitle": "Eliminar produto?",
    "items.deleteTitleBulk": "Eliminar {count} produtos?",
    "items.deleteDesc": "\"{name}\" será removido do catálogo. Esta ação não pode ser desfeita.",
    "items.deleteDescBulk": "Serão removidos {count} produtos do catálogo. Esta ação não pode ser desfeita.",

    "orders.title": "Encomendas",
    "orders.orderCount": "{count} encomendas",
    "orders.filteredCount": "{filtered} de {total} encomendas",
    "orders.searchPlaceholder": "Pesquisar por número de encomenda...",
    "orders.todaysOrders": "Encomendas de hoje",
    "orders.todaysRevenue": "Receita de hoje",
    "orders.weekOrders": "Encomendas da semana",
    "orders.weekRevenue": "Receita da semana",
    "orders.colOrderNumber": "Nº Encomenda",
    "orders.colDate": "Data",
    "orders.colItems": "Artigos",
    "orders.colTotal": "Total",
    "orders.colPayment": "Pagamento",
    "orders.colStatus": "Estado",
    "orders.noOrders": "Nenhuma encomenda encontrada",
    "orders.noOrdersHint": "As encomendas aparecerão aqui após criação",
    "orders.noOrdersHintFiltered": "Tente ajustar a pesquisa",
    "orders.statusCompleted": "Concluída",
    "orders.statusPending": "Pendente",
    "orders.statusCancelled": "Cancelada",
    "orders.statusRefunded": "Reembolsada",
    "orders.payCash": "Dinheiro",
    "orders.payMpay": "MPay",
    "orders.payAlipay": "Alipay",
    "orders.payWechat": "WeChat Pay",
    "orders.payVisa": "Visa",
    "orders.payMastercard": "Mastercard",
    "orders.payUnionpay": "UnionPay",
    "orders.detail.title": "Pedido {orderNumber}",
    "orders.detail.orderInfo": "Informações do Pedido",
    "orders.detail.lineItems": "Itens",
    "orders.detail.paymentInfo": "Informações de Pagamento",
    "orders.detail.date": "Data",
    "orders.detail.status": "Estado",
    "orders.detail.itemCount": "{count} itens",
    "orders.detail.subtotal": "Subtotal",
    "orders.detail.discount": "Desconto",
    "orders.detail.tax": "Imposto",
    "orders.detail.total": "Total",
    "orders.detail.product": "Produto",
    "orders.detail.variant": "Variante",
    "orders.detail.unitPrice": "Preço Unit.",
    "orders.detail.qty": "Qtd",
    "orders.detail.lineTotal": "Total",
    "orders.detail.paymentMethod": "Método de Pagamento",
    "orders.detail.amountPaid": "Valor Pago",
    "orders.detail.cashReceived": "Dinheiro Recebido",
    "orders.detail.changeGiven": "Troco",
    "orders.detail.paidAt": "Pago em",
    "orders.detail.notes": "Notas",
    "orders.detail.notFound": "Pedido não encontrado",
    "orders.detail.notFoundHint": "Este pedido pode ter sido eliminado ou não existe",
    "orders.allDates": "Todas as datas",
    "orders.allMethods": "Todos os métodos",
    "orders.allStatuses": "Todos os estados",
    "orders.filteredOrders": "Pedidos",
    "orders.filteredRevenue": "Receita",
    "orders.completedOrders": "Concluídos",
    "orders.avgOrderValue": "Média",
    "orders.statusVoided": "Anulada",

    "customers.title": "Clientes",
    "customers.memberCount": "{count} membros registados",
    "customers.addCustomer": "Adicionar cliente",
    "customers.totalCustomers": "Total de clientes",
    "customers.newThisMonth": "Novos este mês",
    "customers.activeThisWeek": "Ativos esta semana",
    "customers.avgSpend": "Gasto médio",
    "customers.searchPlaceholder": "Pesquisar por nome, telefone, email...",
    "customers.colCustomer": "Cliente",
    "customers.colTier": "Nível",
    "customers.colTotalSpent": "Total gasto",
    "customers.colVisits": "Visitas",
    "customers.colPoints": "Pontos",
    "customers.colLastVisit": "Última visita",
    "customers.tierRegular": "Regular",
    "customers.tierSilver": "Prata",
    "customers.tierGold": "Ouro",
    "customers.tierVip": "VIP",
    "customers.sendMessage": "Enviar mensagem",
    "customers.moreActions": "Mais ações",

    "terminals.title": "Máquinas / Terminais",
    "terminals.deviceCount": "{count} dispositivos registados",
    "terminals.addTerminal": "Adicionar terminal",
    "terminals.viewGrid": "Vista em grelha",
    "terminals.viewList": "Vista em lista",
    "terminals.statusOnline": "Online",
    "terminals.statusOffline": "Offline",
    "terminals.statusUnpaired": "Não Emparelhado",
    "terminals.statusWarning": "Aviso",
    "terminals.statusMaintenance": "Manutenção",
    "terminals.revenue": "Receita",
    "terminals.shiftRevenue": "Turno",
    "terminals.stock": "Stock",
    "terminals.synced": "Sincronizado",
    "terminals.colTerminal": "Terminal",
    "terminals.colStatus": "Estado",
    "terminals.colStock": "Stock",
    "terminals.colSales": "Vendas",
    "terminals.colRevenue": "Receita",
    "terminals.colLastSync": "Última sincronização",
    "terminals.colUptime": "Tempo ativo",
    "terminals.actionsFor": "Ações para {name}",
    "terminals.viewDetails": "Ver detalhes",
    "terminals.restart": "Reiniciar",
    "terminals.configure": "Configurar",
    "terminals.disable": "Desativar",
    "terminals.enable": "Ativar",
    "terminals.statusDisabled": "Desativado",
    "terminals.regenerateCode": "Regenerar Código",
    "terminals.unlink": "Desvincular Dispositivo",
    "terminals.unlinkConfirm": "Desvincular este dispositivo?",
    "terminals.unlinkMessage": "A sessão ativa em \"{name}\" será terminada e o dispositivo precisará ser reativado com um novo código.",
    "terminals.unlinking": "Desvinculando...",
    "terminals.remove": "Remover",
    "terminals.removeConfirm": "Remover terminal?",
    "terminals.removeMessage": "\"{name}\" será permanentemente eliminado. Esta ação não pode ser desfeita.",
    "terminals.removing": "Removendo...",
    "terminals.activationCodeFor": "Código de Ativação para {code}",
    "terminals.activationCode": "Código de Ativação",
    "terminals.activationCodeHint": "Introduza este código no terminal de caixa para o ativar.",
    "terminals.viewCode": "Ver Código de Ativação",
    "terminals.copyCode": "Copiar código",
    "terminals.terminalCreated": "Terminal Criado",
    "terminals.createTerminal": "Adicionar",
    "terminals.creating": "A adicionar...",
    "terminals.createdMessage": "Terminal {code} criado com sucesso.",
    "terminals.enterActivation": "Introduza este código de ativação no terminal de caixa:",
    "terminals.nameLabel": "Nome",
    "terminals.locationLabel": "Localização",
    "terminals.notesLabel": "Notas",
    "terminals.namePlaceholder": "ex.: Balcão Principal",
    "terminals.locationPlaceholder": "ex.: Rés-do-chão, Entrada",
    "terminals.notesPlaceholder": "Notas opcionais",
    "terminals.searchPlaceholder": "Pesquisar terminais...",
    "terminals.allStatuses": "Todos os estados",
    "terminals.noResults": "Nenhum terminal encontrado.",
    "terminals.cashier": "Caixa",
    "terminals.orders": "Pedidos",
    "terminals.shiftOrders": "Turno",
    "terminals.colOrders": "Pedidos",
    "terminals.colCashier": "Caixa",
    "terminals.total": "Total",

    "comingSoon.title": "Em breve",
    "comingSoon.description": "O módulo {module} está em desenvolvimento. Volte em breve.",

    "dateRange.today": "Hoje",
    "dateRange.yesterday": "Ontem",
    "dateRange.last7Days": "Últimos 7 dias",
    "dateRange.last14Days": "Últimos 14 dias",
    "dateRange.last30Days": "Últimos 30 dias",
    "dateRange.thisMonth": "Este mês",
    "dateRange.selectRange": "Selecionar intervalo de datas",

    // Settings
    "settings.pageTitle": "Definições",
    "settings.subtitle": "Gerir configuração da loja",
    "settings.tabBusinessInfo": "Info do Negócio",
    "settings.tabPaymentMethods": "Métodos de Pagamento",
    "settings.tabRegional": "Regional",
    "settings.tabBranding": "Marca",
    "settings.tabReceipt": "Recibo",
    "settings.shopDetails": "Detalhes da Loja",
    "settings.shopName": "Nome da Loja",
    "settings.shopNamePlaceholder": "Nome da sua loja",
    "settings.address": "Morada",
    "settings.addressPlaceholder": "Morada completa",
    "settings.phone": "Telefone",
    "settings.email": "Email",
    "settings.businessHours": "Horário",
    "settings.closed": "Fechado",
    "settings.acceptedPaymentMethods": "Métodos Aceites",
    "settings.paymentMethodsDesc": "Ativar ou desativar métodos.",
    "settings.paymentCash": "Dinheiro",
    "settings.paymentCashDesc": "Aceitar pagamentos em dinheiro",
    "settings.paymentCard": "Cartão (Visa/Master)",
    "settings.paymentCardDesc": "Aceitar cartões",
    "settings.paymentMpay": "MPAY",
    "settings.paymentMpayDesc": "Pagamento móvel de Macau",
    "settings.paymentAlipay": "Alipay",
    "settings.paymentAlipayDesc": "Alipay e Alipay HK",
    "settings.paymentWechat": "WeChat Pay",
    "settings.paymentWechatDesc": "Pagamentos WeChat Pay",
    "settings.currencyAndTax": "Moeda e Impostos",
    "settings.currency": "Moeda",
    "settings.taxRate": "Taxa de Imposto (%)",
    "settings.defaultLanguage": "Idioma Predefinido",
    "settings.defaultLanguageDesc": "Idioma predefinido do POS.",
    "settings.accentColor": "Cor de Destaque",
    "settings.accentColorDesc": "Cor principal da interface.",
    "settings.preview": "Pré-visualização",
    "settings.sampleButton": "Botão de Exemplo",
    "settings.receiptContent": "Conteúdo do Recibo",
    "settings.receiptHeaderLabel": "Texto do Cabeçalho",
    "settings.receiptFooterLabel": "Texto do Rodapé",
    "settings.displayOptions": "Opções de Exibição",
    "settings.showAddressOnReceipt": "Mostrar morada",
    "settings.showPhoneOnReceipt": "Mostrar telefone",
    "settings.showTaxOnReceipt": "Mostrar impostos",
    "settings.receiptPreview": "Pré-visualização do Recibo",
    "settings.successBusinessInfo": "Info do negócio guardada",
    "settings.successPaymentMethods": "Métodos guardados",
    "settings.successRegional": "Definições regionais guardadas",
    "settings.successBranding": "Marca guardada",
    "settings.successReceipt": "Recibo guardado",

    // Staff
    "staff.pageTitle": "Equipa",
    "staff.teamMembers": "{count} membros",
    "staff.addStaff": "Adicionar",
    "staff.editStaff": "Editar",
    "staff.nameLabel": "Nome",
    "staff.emailLabel": "Email",
    "staff.phoneLabel": "Telefone",
    "staff.roleLabel": "Função",
    "staff.roleOwner": "Proprietário",
    "staff.roleCashier": "Caixa",
    "staff.roleAccountant": "Contabilista",
    "staff.rolePromoter": "Promotor",
    "staff.posAccessLabel": "Acesso POS",
    "staff.posRoleNone": "Sem acesso POS",
    "staff.posRoleStoreManager": "Gerente de Loja",
    "staff.adminAccessLabel": "Painel Admin",
    "staff.adminRoleNone": "Sem acesso admin",
    "staff.pinLabel": "PIN (4-6 dígitos)",
    "staff.passwordLabel": "Palavra-passe",
    "staff.activeLabel": "Ativo",
    "staff.inactiveWarning": "Inativos não podem entrar",
    "staff.lastLogin": "Último acesso",
    "staff.deleteTitle": "Eliminar membro?",
    "staff.deleteDesc": "Não pode ser desfeito.",
    "staff.emptyTitle": "Sem membros",
    "staff.emptyDesc": "Adicione o primeiro membro.",
    "staff.never": "Nunca",
    "staff.searchPlaceholder": "Pesquisar por nome, email, telefone...",
    "staff.allRoles": "Todos os cargos",
    "staff.allStatuses": "Todos os estados",
    "staff.statusActive": "Ativo",
    "staff.statusInactive": "Inativo",
    "staff.locationsLabel": "Localizações",
    "staff.ownerAllLocations": "Proprietários têm acesso a todas as localizações",
    "staff.allLocations": "Todas as localizações",
    "staff.noLocations": "Sem localização",
    "staff.noLocationsAvailable": "Nenhuma localização disponível",

    // Shifts
    "shifts.title": "Turnos",
    "shifts.shiftCount": "{count} turnos",
    "sidebar.shifts": "Turnos",
    "shifts.statusOpen": "Aberto",
    "shifts.statusPending": "Pendente",
    "shifts.statusClosed": "Fechado",
    "shifts.statusFlagged": "Sinalizado",
    "shifts.colCashier": "Caixa",
    "shifts.colTerminal": "Terminal",
    "shifts.colOpened": "Abertura",
    "shifts.colDuration": "Duração",
    "shifts.colOrders": "Pedidos",
    "shifts.colSales": "Vendas",
    "shifts.colVariance": "Variação",
    "shifts.colStatus": "Estado",
    "shifts.noShifts": "Nenhum turno encontrado",
    "shifts.noShiftsHint": "Os turnos aparecem quando os caixas começam a trabalhar",
    "shifts.approve": "Aprovar",
    "shifts.flag": "Sinalizar",
    "shifts.cashLedger": "Livro de Caixa",
    "shifts.ledgerTime": "Hora",
    "shifts.ledgerEvent": "Evento",
    "shifts.ledgerIn": "Entrada",
    "shifts.ledgerOut": "Saída",
    "shifts.ledgerBalance": "Saldo",
    "shifts.detail.cashier": "Caixa",
    "shifts.detail.terminal": "Terminal",
    "shifts.detail.location": "Localização",
    "shifts.detail.status": "Estado",
    "shifts.detail.opened": "Abertura",
    "shifts.detail.closed": "Fecho",
    "shifts.detail.orders": "Pedidos",
    "shifts.detail.totalSales": "Vendas Totais",
    "shifts.detail.openingFloat": "Fundo de Caixa",
    "shifts.detail.expectedCash": "Dinheiro Esperado",
    "shifts.detail.actualCash": "Dinheiro Real",
    "shifts.detail.variance": "Variação",
    "shifts.detail.notes": "Notas",
    "shifts.searchPlaceholder": "Pesquisar por caixa ou terminal...",

    // Locations
    "locations.title": "Localizações",
    "locations.subtitle": "Gerir as localizações físicas das suas lojas",
    "locations.add": "Adicionar localização",
    "locations.addNew": "Nova localização",
    "locations.allLocations": "Todas as localizações",
    "locations.nameLabel": "Nome",
    "locations.addressLabel": "Morada",
    "locations.phoneLabel": "Telefone",
    "locations.emailLabel": "E-mail",

    // Payments
    "payments.pageTitle": "Pagamentos e Faturas",
    "payments.todaysRevenue": "Receita de Hoje",
    "payments.todaysTransactions": "Transações de Hoje",
    "payments.cashTotal": "Total em Dinheiro",
    "payments.digitalTotal": "Total Digital",
    "payments.methodBreakdown": "Análise de Métodos",
    "payments.filterAll": "Todos",
    "payments.filterCash": "Dinheiro",
    "payments.filterCard": "Cartão",
    "payments.filterQR": "QR",
    "payments.searchPlaceholder": "Pesquisar por nº de pedido...",
    "payments.orderNumber": "Nº Pedido",
    "payments.dateTime": "Data/Hora",
    "payments.method": "Método",
    "payments.amount": "Montante",
    "payments.cashDetails": "Detalhes",
    "payments.received": "Recebido",
    "payments.change": "Troco",
    "payments.emptyTitle": "Sem transações",
    "payments.emptyDesc": "As transações aparecerão aqui.",

    // AI Insights (Full Page)
    "insights.pageTitle": "AI Insights",
    "insights.totalRevenue": "Receita Total",
    "insights.totalOrders": "Total de Pedidos",
    "insights.avgOrderValue": "Valor Médio",
    "insights.productsInCatalog": "Produtos no Catálogo",
    "insights.salesTrendTitle": "Tendência (30 Dias)",
    "insights.noSalesData": "Sem dados de vendas",
    "insights.topProductsTitle": "Top 10 Produtos",
    "insights.noProductData": "Sem dados de produtos",
    "insights.paymentBreakdown": "Análise de Pagamentos",
    "insights.noPaymentData": "Sem dados de pagamento",
    "insights.insightsTitle": "Insights",
    "insights.topSeller": "Mais vendido: {name} MOP {amount}",
    "insights.cashPercent": "Dinheiro: {pct}% das transações",
    "insights.avgValue": "Valor médio: MOP {value}",
    "insights.totalProcessed": "Pedidos processados: {count}",
    "insights.catalogCount": "{count} produtos no catálogo",

    // Online
    "online.pageTitle": "Online",
    "online.subtitle": "Gerir canais de venda",
    "online.salesChannels": "Canais de Venda",
    "online.posTerminal": "Terminal POS",
    "online.posTerminalDesc": "Ponto de venda na loja",
    "online.statusActive": "Ativo",
    "online.terminalsConnected": "{count} terminais ligados",
    "online.onlineStore": "Loja Online",
    "online.onlineStoreDesc": "Encomendas online",
    "online.statusEnabled": "Ativado",
    "online.enableToStart": "Ativar para vender online",
    "online.wechatMiniProgram": "Mini-Programa WeChat",
    "online.wechatDesc": "Vender pelo WeChat",
    "online.comingSoon": "Em Breve",
    "online.storeSettings": "Definições da Loja Online",
    "online.storeUrl": "URL da Loja",
    "online.copied": "Copiado!",
    "online.copy": "Copiar",
    "online.storeDescription": "Descrição da Loja",
    "online.storeDescPlaceholder": "Descreva a sua loja...",
    "online.storeQRCode": "Código QR da Loja",
    "online.successMessage": "Definições guardadas",

    // Common (additions)
    "common.saving": "A guardar...",
    "common.to": "a",
    "common.notAvailable": "--",

    // Reports
    "reports.pageTitle": "Relatórios",
    "reports.subtitle": "Análises de vendas e relatórios",
    "reports.totalRevenue": "Receita Total",
    "reports.totalOrders": "Total de Pedidos",
    "reports.avgOrderValue": "Valor Médio",
    "reports.topCategory": "Melhor Categoria",
    "reports.salesTrend": "Tendência de Vendas",
    "reports.last14Days": "Últimos 14 Dias",
    "reports.last30Days": "Últimos 30 Dias",
    "reports.last90Days": "Últimos 90 Dias",
    "reports.last7Days": "Últimos 7 Dias",
    "reports.topProducts": "Produtos Mais Vendidos",
    "reports.productName": "Produto",
    "reports.qtySold": "Qtd Vendida",
    "reports.revenue": "Receita",
    "reports.salesByCategory": "Vendas por Categoria",
    "reports.category": "Categoria",
    "reports.orders": "Pedidos",
    "reports.paymentMethods": "Métodos de Pagamento",
    "reports.noData": "Sem dados ainda",
    "reports.noDataDesc": "Crie pedidos no caixa para ver relatórios aqui",
    "reports.exportCsv": "Exportar CSV",
    "reports.date": "Data",
    "reports.dailyRevenue": "Receita Diária",
    "reports.percentage": "Percentagem",
  },

  // ═══════════════════════════════════════════════════════
  // JAPANESE (日本語)
  // ═══════════════════════════════════════════════════════
  ja: {
    "common.cancel": "キャンセル",
    "common.close": "閉じる",
    "common.save": "保存",
    "common.saveChanges": "変更を保存",
    "common.delete": "削除",
    "common.edit": "編集",
    "common.duplicate": "複製",
    "common.search": "検索...",
    "common.export": "エクスポート",
    "common.import": "インポート",
    "common.add": "追加",
    "common.view": "表示",
    "common.back": "戻る",
    "common.done": "完了",
    "common.loading": "読み込み中...",
    "common.error": "エラー",
    "common.success": "成功",
    "common.confirm": "確認",
    "common.mop": "MOP",
    "common.showingRange": "{total}件中 {start}–{end}件を表示",
    "common.previousPage": "前のページ",
    "common.nextPage": "次のページ",
    "common.noResults": "結果が見つかりません",
    "common.tryAdjusting": "検索やフィルターを調整してみてください",
    "common.statusActive": "有効",
    "common.statusDraft": "下書き",
    "common.statusInactive": "無効",
    "common.statusSoldOut": "売り切れ",
    "common.vsPrevPeriod": "前期比",
    "common.selected": "{count}件選択中",
    "common.clearSelection": "選択を解除",
    "common.status": "ステータス",
    "common.unlimited": "無制限",

    "meta.title": "CountingStars",
    "meta.description": "最新のPOS・小売オペレーションプラットフォーム",

    "sidebar.home": "ホーム",
    "sidebar.itemsServices": "商品・サービス",
    "sidebar.orders": "注文",
    "sidebar.paymentsInvoices": "決済・請求書",
    "sidebar.online": "オンライン",
    "sidebar.customers": "顧客",
    "sidebar.reports": "レポート",
    "sidebar.terminals": "マシン / 端末",
    "sidebar.aiInsights": "AIインサイト",
    "sidebar.staff": "スタッフ",
    "sidebar.settings": "設定",
    "sidebar.locations": "店舗",
    "sidebar.takePayment": "決済する",
    "sidebar.notifications": "通知",
    "sidebar.inbox": "受信トレイ",
    "sidebar.help": "ヘルプ",
    "sidebar.signOut": "ログアウト",
    "sidebar.expandSidebar": "サイドバーを展開",
    "sidebar.collapseSidebar": "サイドバーを折りたたむ",
    "sidebar.location": "マカオ · 本店",
    "sidebar.openMenu": "ナビゲーションメニューを開く",

    "login.signIn": "ログイン",
    "login.signInSubtitle": "アカウントにログイン",
    "login.emailOrPhone": "メールまたは電話番号",
    "login.emailPlaceholder": "owner@countingstars.mo",
    "login.password": "パスワード",
    "login.passwordPlaceholder": "パスワードを入力",
    "login.showPassword": "パスワードを表示",
    "login.hidePassword": "パスワードを非表示",
    "login.signInButton": "ログイン",
    "login.demoHint": "デモ: owner@countingstars.mo / demo1234",
    "login.invalidCredentials": "メール/電話番号またはパスワードが正しくありません",

    "home.title": "ホーム",
    "home.welcomeBack": "ダッシュボードへようこそ",

    "setup.greeting": "こんにちは！設定を始めましょう。",
    "setup.stepsCompleted": "{total}ステップ中 {completed}完了",
    "setup.finishLater": "後で完了する",
    "setup.viewAllSteps": "すべてのステップを表示",
    "setup.setupProgress": "設定の進捗",
    "setup.account": "アカウント",
    "setup.accountDesc": "ビジネスプロフィールとチームメンバーを設定",
    "setup.pos": "RetailOS POS",
    "setup.posDesc": "店舗販売用のPOSを設定",
    "setup.payments": "決済",
    "setup.paymentsDesc": "取引を受け付ける決済方法を接続",
    "setup.devices": "デバイス",
    "setup.devicesDesc": "端末を設定してハードウェアを接続",

    "quickActions.title": "クイックアクション",
    "quickActions.addItem": "商品を追加",
    "quickActions.takePayment": "決済する",
    "quickActions.createDiscount": "割引を作成",
    "quickActions.addCustomer": "顧客を追加",
    "quickActions.connectTerminal": "端末を接続",

    "performance.title": "業績",
    "performance.subtitle": "選択期間の販売概要",
    "performance.allLocations": "全店舗",
    "performance.comparePrevious": "比較：前期",
    "performance.netSales": "純売上",
    "performance.grossSales": "総売上",
    "performance.transactions": "取引数",
    "performance.avgBasket": "平均客単価",
    "performance.thisPeriod": "今期",
    "performance.previousPeriod": "前期",

    "insights.title": "AIインサイト",
    "insights.subtitle": "CountingStars AI 提供",
    "insights.newCount": "{count}件の新着",
    "insights.viewAll": "すべてのインサイトを表示",

    "terminalStatus.title": "端末ステータス",
    "terminalStatus.subtitle": "リアルタイムマシン概要",
    "terminalStatus.synced": "{time}に同期済み",
    "terminalStatus.online": "オンライン",
    "terminalStatus.offline": "オフライン",
    "terminalStatus.warnings": "警告",
    "terminalStatus.needRefill": "{count}台補充必要",
    "terminalStatus.paymentIssue": "{count}台決済問題",
    "terminalStatus.total": "合計{count}台",
    "terminalStatus.sales": "{count}件販売",
    "terminalStatus.viewAll": "すべての端末を表示",
    "terminalStatus.statusRefill": "補充必要",

    "items.title": "商品・サービス",
    "items.itemCount": "カタログに{count}件の商品",
    "items.filteredCount": "{total}件中{filtered}件",
    "items.addItem": "商品を追加",
    "items.allItems": "すべての商品",
    "items.searchPlaceholder": "名前、SKUで検索...",
    "items.itemsCount": "{count}件の商品",
    "items.colItem": "商品",
    "items.colCategory": "カテゴリ",
    "items.colPrice": "価格",
    "items.colStock": "在庫",
    "items.colStatus": "ステータス",
    "items.selectAll": "すべて選択",
    "items.selectItem": "{name}を選択",
    "items.sortBy": "{column}で並べ替え",
    "items.actionsFor": "{name}の操作",
    "items.noItemsFound": "商品が見つかりません",
    "items.noItemsHint": "検索やフィルターを調整してみてください",
    "items.addProduct": "商品を追加",
    "items.editProduct": "商品を編集",
    "items.image": "画像",
    "items.uploadImage": "クリックして画像をアップロード",
    "items.uploadHint": "JPEG、PNG、WebP · 最大2MB",
    "items.productName": "商品名",
    "items.productNamePlaceholder": "例: ポカリスエット 500ml",
    "items.chineseName": "中国語名",
    "items.chineseNamePlaceholder": "例: 寶礦力水特",
    "items.moreTranslations": "他の翻訳（日本語、ポルトガル語）",
    "items.japaneseName": "日本語名",
    "items.portugueseName": "ポルトガル語名",
    "items.sku": "SKU",
    "items.skuPlaceholder": "例: BEV-001",
    "items.barcode": "バーコード",
    "items.barcodePlaceholder": "例: 4901340101234",
    "items.sellingPrice": "販売価格 (MOP)",
    "items.costPrice": "原価 (MOP)",
    "items.inventory": "在庫",
    "items.category": "カテゴリ",
    "items.noCategory": "カテゴリなし",
    "items.markPopular": "人気としてマーク",
    "items.manageCategories": "カテゴリ管理",
    "items.categoryManager": "カテゴリマネージャー",
    "items.addCategory": "カテゴリを追加",
    "items.editCategory": "カテゴリを編集",
    "items.parentCategory": "親カテゴリ",
    "items.parentCategoryNone": "なし（トップレベル）",
    "items.categoryNameLabel": "カテゴリ名（中国語）",
    "items.categoryNameEn": "英語名",
    "items.categoryNamePt": "ポルトガル語名",
    "items.categoryNameJa": "日本語名",
    "items.categoryIcon": "アイコン",
    "items.categoryProducts": "{count} 商品",
    "items.categoryNoProducts": "商品なし",
    "items.categoryActive": "有効",
    "items.categoryInactive": "無効",
    "items.deleteCategoryTitle": "カテゴリを削除しますか？",
    "items.deleteCategoryDesc": "このカテゴリの商品は未分類になります。この操作は取り消せません。",
    "items.categoryOrder": "表示順",
    "items.chooseIcon": "アイコンを選択",
    "items.categoryNameRequired": "カテゴリ名を入力してください",
    "items.createItem": "アイテムを作成",
    "items.editItem": "アイテムを編集",
    "items.description": "説明",
    "items.descriptionPlaceholder": "説明を追加...",
    "items.availability": "在庫状況",
    "items.unsavedChanges": "未保存の変更があります。破棄しますか？",
    "items.discard": "破棄",
    "items.addLanguage": "言語を追加",
    "items.removeTranslation": "翻訳を削除",
    "items.hasVariants": "この商品にはバリエーションがあります",
    "items.addOptionGroup": "オプショングループを追加（例：サイズ、色）",
    "items.generateVariants": "バリエーションを生成",
    "common.clearAll": "すべてクリア",
    "items.translations": "翻訳",
    "items.deleteTitle": "商品を削除しますか？",
    "items.deleteTitleBulk": "{count}件の商品を削除しますか？",
    "items.deleteDesc": "「{name}」はカタログから削除されます。この操作は元に戻せません。",
    "items.deleteDescBulk": "{count}件の商品がカタログから削除されます。この操作は元に戻せません。",

    "orders.title": "注文",
    "orders.orderCount": "{count}件の注文",
    "orders.filteredCount": "{total}件中{filtered}件",
    "orders.searchPlaceholder": "注文番号で検索...",
    "orders.todaysOrders": "本日の注文",
    "orders.todaysRevenue": "本日の売上",
    "orders.weekOrders": "今週の注文",
    "orders.weekRevenue": "今週の売上",
    "orders.colOrderNumber": "注文番号",
    "orders.colDate": "日付",
    "orders.colItems": "品目",
    "orders.colTotal": "合計",
    "orders.colPayment": "決済方法",
    "orders.colStatus": "ステータス",
    "orders.noOrders": "注文が見つかりません",
    "orders.noOrdersHint": "注文が作成されるとここに表示されます",
    "orders.noOrdersHintFiltered": "検索条件を調整してみてください",
    "orders.statusCompleted": "完了",
    "orders.statusPending": "保留中",
    "orders.statusCancelled": "キャンセル",
    "orders.statusRefunded": "返金済み",
    "orders.payCash": "現金",
    "orders.payMpay": "MPay",
    "orders.payAlipay": "Alipay",
    "orders.payWechat": "WeChat Pay",
    "orders.payVisa": "Visa",
    "orders.payMastercard": "Mastercard",
    "orders.payUnionpay": "UnionPay",
    "orders.detail.title": "注文 {orderNumber}",
    "orders.detail.orderInfo": "注文情報",
    "orders.detail.lineItems": "商品明細",
    "orders.detail.paymentInfo": "支払い情報",
    "orders.detail.date": "日付",
    "orders.detail.status": "ステータス",
    "orders.detail.itemCount": "{count} 点",
    "orders.detail.subtotal": "小計",
    "orders.detail.discount": "割引",
    "orders.detail.tax": "税額",
    "orders.detail.total": "合計",
    "orders.detail.product": "商品",
    "orders.detail.variant": "バリエーション",
    "orders.detail.unitPrice": "単価",
    "orders.detail.qty": "数量",
    "orders.detail.lineTotal": "小計",
    "orders.detail.paymentMethod": "支払い方法",
    "orders.detail.amountPaid": "支払い金額",
    "orders.detail.cashReceived": "お預かり",
    "orders.detail.changeGiven": "お釣り",
    "orders.detail.paidAt": "支払い日時",
    "orders.detail.notes": "メモ",
    "orders.detail.notFound": "注文が見つかりません",
    "orders.detail.notFoundHint": "この注文は削除されたか存在しない可能性があります",
    "orders.allDates": "全日付",
    "orders.allMethods": "全決済方法",
    "orders.allStatuses": "全ステータス",
    "orders.filteredOrders": "注文数",
    "orders.filteredRevenue": "売上",
    "orders.completedOrders": "完了",
    "orders.avgOrderValue": "平均注文額",
    "orders.statusVoided": "無効",

    "customers.title": "顧客",
    "customers.memberCount": "{count}名の登録会員",
    "customers.addCustomer": "顧客を追加",
    "customers.totalCustomers": "総顧客数",
    "customers.newThisMonth": "今月の新規",
    "customers.activeThisWeek": "今週のアクティブ",
    "customers.avgSpend": "平均支出",
    "customers.searchPlaceholder": "名前、電話、メールで検索...",
    "customers.colCustomer": "顧客",
    "customers.colTier": "ランク",
    "customers.colTotalSpent": "累計支出",
    "customers.colVisits": "来店回数",
    "customers.colPoints": "ポイント",
    "customers.colLastVisit": "最終来店",
    "customers.tierRegular": "一般",
    "customers.tierSilver": "シルバー",
    "customers.tierGold": "ゴールド",
    "customers.tierVip": "VIP",
    "customers.sendMessage": "メッセージを送信",
    "customers.moreActions": "その他の操作",

    "terminals.title": "マシン / 端末",
    "terminals.deviceCount": "{count}台のデバイスが登録済み",
    "terminals.addTerminal": "端末を追加",
    "terminals.viewGrid": "グリッド表示",
    "terminals.viewList": "リスト表示",
    "terminals.statusOnline": "オンライン",
    "terminals.statusOffline": "オフライン",
    "terminals.statusUnpaired": "未ペアリング",
    "terminals.statusWarning": "警告",
    "terminals.statusMaintenance": "メンテナンス中",
    "terminals.revenue": "売上",
    "terminals.shiftRevenue": "シフト",
    "terminals.stock": "在庫",
    "terminals.synced": "同期済み",
    "terminals.colTerminal": "端末",
    "terminals.colStatus": "ステータス",
    "terminals.colStock": "在庫",
    "terminals.colSales": "販売",
    "terminals.colRevenue": "売上",
    "terminals.colLastSync": "最終同期",
    "terminals.colUptime": "稼働時間",
    "terminals.actionsFor": "{name}の操作",
    "terminals.viewDetails": "詳細を表示",
    "terminals.restart": "再起動",
    "terminals.configure": "設定",
    "terminals.disable": "無効化",
    "terminals.enable": "有効化",
    "terminals.statusDisabled": "無効",
    "terminals.regenerateCode": "コード再生成",
    "terminals.unlink": "デバイス解除",
    "terminals.unlinkConfirm": "このデバイスの接続を解除しますか？",
    "terminals.unlinkMessage": "「{name}」のアクティブセッションが終了し、新しいコードで再アクティベーションが必要になります。",
    "terminals.unlinking": "解除中...",
    "terminals.remove": "削除",
    "terminals.removeConfirm": "端末を削除しますか？",
    "terminals.removeMessage": "「{name}」は完全に削除されます。この操作は元に戻せません。",
    "terminals.removing": "削除中...",
    "terminals.activationCodeFor": "{code} のアクティベーションコード",
    "terminals.activationCode": "アクティベーションコード",
    "terminals.activationCodeHint": "レジ端末でこのコードを入力してアクティベートしてください。",
    "terminals.viewCode": "アクティベーションコードを表示",
    "terminals.copyCode": "コードをコピー",
    "terminals.terminalCreated": "端末を作成しました",
    "terminals.createTerminal": "追加",
    "terminals.creating": "追加中...",
    "terminals.createdMessage": "端末 {code} が正常に作成されました。",
    "terminals.enterActivation": "レジ端末で以下のアクティベーションコードを入力してください：",
    "terminals.nameLabel": "名前",
    "terminals.locationLabel": "場所",
    "terminals.notesLabel": "メモ",
    "terminals.namePlaceholder": "例：フロントカウンター",
    "terminals.locationPlaceholder": "例：1階エントランス",
    "terminals.notesPlaceholder": "メモ（任意）",
    "terminals.searchPlaceholder": "端末を検索...",
    "terminals.allStatuses": "すべてのステータス",
    "terminals.noResults": "端末が見つかりません。",
    "terminals.cashier": "レジ担当",
    "terminals.orders": "注文",
    "terminals.shiftOrders": "シフト",
    "terminals.colOrders": "注文",
    "terminals.colCashier": "レジ担当",
    "terminals.total": "合計",

    "comingSoon.title": "近日公開",
    "comingSoon.description": "{module}モジュールは開発中です。もうしばらくお待ちください。",

    "dateRange.today": "今日",
    "dateRange.yesterday": "昨日",
    "dateRange.last7Days": "過去7日間",
    "dateRange.last14Days": "過去14日間",
    "dateRange.last30Days": "過去30日間",
    "dateRange.thisMonth": "今月",
    "dateRange.selectRange": "日付範囲を選択",

    // Settings
    "settings.pageTitle": "設定",
    "settings.subtitle": "ショップ設定を管理",
    "settings.tabBusinessInfo": "ビジネス情報",
    "settings.tabPaymentMethods": "決済方法",
    "settings.tabRegional": "地域設定",
    "settings.tabBranding": "ブランディング",
    "settings.tabReceipt": "レシート",
    "settings.shopDetails": "ショップ詳細",
    "settings.shopName": "ショップ名",
    "settings.shopNamePlaceholder": "ショップ名を入力",
    "settings.address": "住所",
    "settings.addressPlaceholder": "完全な住所",
    "settings.phone": "電話",
    "settings.email": "メール",
    "settings.businessHours": "営業時間",
    "settings.closed": "定休日",
    "settings.acceptedPaymentMethods": "対応決済方法",
    "settings.paymentMethodsDesc": "決済方法の有効・無効を切り替え。",
    "settings.paymentCash": "現金",
    "settings.paymentCashDesc": "現金支払いを受け付ける",
    "settings.paymentCard": "カード (Visa/Master)",
    "settings.paymentCardDesc": "カード決済を受け付ける",
    "settings.paymentMpay": "MPAY",
    "settings.paymentMpayDesc": "マカオモバイル決済",
    "settings.paymentAlipay": "Alipay",
    "settings.paymentAlipayDesc": "AlipayとAlipay HK",
    "settings.paymentWechat": "WeChat Pay",
    "settings.paymentWechatDesc": "WeChat Pay決済",
    "settings.currencyAndTax": "通貨・税金",
    "settings.currency": "通貨",
    "settings.taxRate": "税率 (%)",
    "settings.defaultLanguage": "デフォルト言語",
    "settings.defaultLanguageDesc": "POSのデフォルト表示言語。",
    "settings.accentColor": "アクセントカラー",
    "settings.accentColorDesc": "インターフェースのメインカラー。",
    "settings.preview": "プレビュー",
    "settings.sampleButton": "サンプルボタン",
    "settings.receiptContent": "レシート内容",
    "settings.receiptHeaderLabel": "ヘッダーテキスト",
    "settings.receiptFooterLabel": "フッターテキスト",
    "settings.displayOptions": "表示オプション",
    "settings.showAddressOnReceipt": "レシートに住所を表示",
    "settings.showPhoneOnReceipt": "レシートに電話を表示",
    "settings.showTaxOnReceipt": "レシートに税金を表示",
    "settings.receiptPreview": "レシートプレビュー",
    "settings.successBusinessInfo": "ビジネス情報を保存しました",
    "settings.successPaymentMethods": "決済方法を保存しました",
    "settings.successRegional": "地域設定を保存しました",
    "settings.successBranding": "ブランディングを保存しました",
    "settings.successReceipt": "レシート設定を保存しました",

    // Staff
    "staff.pageTitle": "スタッフ",
    "staff.teamMembers": "{count} 名のスタッフ",
    "staff.addStaff": "スタッフ追加",
    "staff.editStaff": "スタッフ編集",
    "staff.nameLabel": "氏名",
    "staff.emailLabel": "メール",
    "staff.phoneLabel": "電話",
    "staff.roleLabel": "役割",
    "staff.roleOwner": "オーナー",
    "staff.roleCashier": "レジ担当",
    "staff.roleAccountant": "経理",
    "staff.rolePromoter": "プロモーター",
    "staff.posAccessLabel": "POSアクセス",
    "staff.posRoleNone": "POSアクセスなし",
    "staff.posRoleStoreManager": "店長",
    "staff.adminAccessLabel": "管理パネル",
    "staff.adminRoleNone": "管理アクセスなし",
    "staff.pinLabel": "PIN (4-6桁)",
    "staff.passwordLabel": "パスワード",
    "staff.activeLabel": "有効",
    "staff.inactiveWarning": "無効なスタッフはログインできません",
    "staff.lastLogin": "最終ログイン",
    "staff.deleteTitle": "スタッフを削除しますか？",
    "staff.deleteDesc": "この操作は元に戻せません。",
    "staff.emptyTitle": "スタッフなし",
    "staff.emptyDesc": "最初のスタッフを追加してください。",
    "staff.never": "なし",
    "staff.searchPlaceholder": "名前、メール、電話で検索...",
    "staff.allRoles": "全役割",
    "staff.allStatuses": "全ステータス",
    "staff.statusActive": "有効",
    "staff.statusInactive": "無効",
    "staff.locationsLabel": "店舗",
    "staff.ownerAllLocations": "オーナーは全店舗にアクセスできます",
    "staff.allLocations": "全店舗",
    "staff.noLocations": "店舗未割当",
    "staff.noLocationsAvailable": "店舗がありません",

    // Shifts
    "shifts.title": "シフト管理",
    "shifts.shiftCount": "{count} シフト",
    "sidebar.shifts": "シフト",
    "shifts.statusOpen": "開始中",
    "shifts.statusPending": "承認待ち",
    "shifts.statusClosed": "終了",
    "shifts.statusFlagged": "フラグ付き",
    "shifts.colCashier": "レジ担当",
    "shifts.colTerminal": "端末",
    "shifts.colOpened": "開始",
    "shifts.colDuration": "時間",
    "shifts.colOrders": "注文",
    "shifts.colSales": "売上",
    "shifts.colVariance": "差異",
    "shifts.colStatus": "ステータス",
    "shifts.noShifts": "シフトが見つかりません",
    "shifts.noShiftsHint": "レジ担当が勤務開始すると表示されます",
    "shifts.approve": "承認",
    "shifts.flag": "フラグ",
    "shifts.cashLedger": "現金台帳",
    "shifts.ledgerTime": "時刻",
    "shifts.ledgerEvent": "イベント",
    "shifts.ledgerIn": "入金",
    "shifts.ledgerOut": "出金",
    "shifts.ledgerBalance": "残高",
    "shifts.detail.cashier": "レジ担当",
    "shifts.detail.terminal": "端末",
    "shifts.detail.location": "店舗",
    "shifts.detail.status": "ステータス",
    "shifts.detail.opened": "開始",
    "shifts.detail.closed": "終了",
    "shifts.detail.orders": "注文数",
    "shifts.detail.totalSales": "総売上",
    "shifts.detail.openingFloat": "開始時現金",
    "shifts.detail.expectedCash": "想定現金",
    "shifts.detail.actualCash": "実際現金",
    "shifts.detail.variance": "差異",
    "shifts.detail.notes": "メモ",
    "shifts.searchPlaceholder": "レジ担当または端末で検索...",

    // Locations
    "locations.title": "店舗",
    "locations.subtitle": "実店舗の場所を管理する",
    "locations.add": "店舗を追加",
    "locations.addNew": "新規店舗",
    "locations.allLocations": "すべての店舗",
    "locations.nameLabel": "名前",
    "locations.addressLabel": "住所",
    "locations.phoneLabel": "電話番号",
    "locations.emailLabel": "メール",

    // Payments
    "payments.pageTitle": "決済・請求",
    "payments.todaysRevenue": "今日の売上",
    "payments.todaysTransactions": "今日の取引",
    "payments.cashTotal": "現金合計",
    "payments.digitalTotal": "デジタル合計",
    "payments.methodBreakdown": "決済方法内訳",
    "payments.filterAll": "すべて",
    "payments.filterCash": "現金",
    "payments.filterCard": "カード",
    "payments.filterQR": "QR",
    "payments.searchPlaceholder": "注文番号で検索...",
    "payments.orderNumber": "注文番号",
    "payments.dateTime": "日時",
    "payments.method": "方法",
    "payments.amount": "金額",
    "payments.cashDetails": "現金詳細",
    "payments.received": "受取",
    "payments.change": "お釣り",
    "payments.emptyTitle": "取引なし",
    "payments.emptyDesc": "取引はここに表示されます。",

    // AI Insights (Full Page)
    "insights.pageTitle": "AI インサイト",
    "insights.totalRevenue": "総売上",
    "insights.totalOrders": "総注文数",
    "insights.avgOrderValue": "平均注文額",
    "insights.productsInCatalog": "カタログ商品数",
    "insights.salesTrendTitle": "売上トレンド（過去30日）",
    "insights.noSalesData": "売上データなし",
    "insights.topProductsTitle": "トップ10商品",
    "insights.noProductData": "商品データなし",
    "insights.paymentBreakdown": "決済方法内訳",
    "insights.noPaymentData": "決済データなし",
    "insights.insightsTitle": "インサイト",
    "insights.topSeller": "トップ商品: {name} MOP {amount}",
    "insights.cashPercent": "現金決済: 全取引の{pct}%",
    "insights.avgValue": "平均注文額: MOP {value}",
    "insights.totalProcessed": "処理済注文: {count}",
    "insights.catalogCount": "カタログに{count}商品",

    // Online
    "online.pageTitle": "オンライン",
    "online.subtitle": "販売チャネルを管理",
    "online.salesChannels": "販売チャネル",
    "online.posTerminal": "POSターミナル",
    "online.posTerminalDesc": "店舗内POS端末",
    "online.statusActive": "有効",
    "online.terminalsConnected": "{count} 台接続中",
    "online.onlineStore": "オンラインストア",
    "online.onlineStoreDesc": "オンライン注文を受け付ける",
    "online.statusEnabled": "有効",
    "online.enableToStart": "オンライン販売を開始",
    "online.wechatMiniProgram": "WeChatミニプログラム",
    "online.wechatDesc": "WeChatで販売",
    "online.comingSoon": "近日公開",
    "online.storeSettings": "オンラインストア設定",
    "online.storeUrl": "ストアURL",
    "online.copied": "コピーしました！",
    "online.copy": "コピー",
    "online.storeDescription": "ストア説明",
    "online.storeDescPlaceholder": "ストアの説明を入力...",
    "online.storeQRCode": "ストアQRコード",
    "online.successMessage": "設定を保存しました",

    // Common (additions)
    "common.saving": "保存中...",
    "common.to": "～",
    "common.notAvailable": "--",

    // Reports
    "reports.pageTitle": "レポート",
    "reports.subtitle": "売上分析とビジネスレポート",
    "reports.totalRevenue": "総収益",
    "reports.totalOrders": "総注文数",
    "reports.avgOrderValue": "平均注文額",
    "reports.topCategory": "トップカテゴリ",
    "reports.salesTrend": "売上推移",
    "reports.last14Days": "過去14日間",
    "reports.last30Days": "過去30日間",
    "reports.last90Days": "過去90日間",
    "reports.last7Days": "過去7日間",
    "reports.topProducts": "人気商品",
    "reports.productName": "商品",
    "reports.qtySold": "販売数",
    "reports.revenue": "収益",
    "reports.salesByCategory": "カテゴリ別売上",
    "reports.category": "カテゴリ",
    "reports.orders": "注文",
    "reports.paymentMethods": "決済方法",
    "reports.noData": "レポートデータなし",
    "reports.noDataDesc": "キャッシャーで注文を作成するとここにレポートが表示されます",
    "reports.exportCsv": "CSVエクスポート",
    "reports.date": "日付",
    "reports.dailyRevenue": "日次収益",
    "reports.percentage": "割合",
  },
};
