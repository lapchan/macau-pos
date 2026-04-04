// ─── Performance data ───────────────────────────────────────
export const performanceData = [
  { date: "Mar 1", current: 1240, previous: 980 },
  { date: "Mar 2", current: 1580, previous: 1120 },
  { date: "Mar 3", current: 890, previous: 1340 },
  { date: "Mar 4", current: 2100, previous: 1560 },
  { date: "Mar 5", current: 1750, previous: 1280 },
  { date: "Mar 6", current: 2340, previous: 1890 },
  { date: "Mar 7", current: 1920, previous: 1450 },
  { date: "Mar 8", current: 2680, previous: 2100 },
  { date: "Mar 9", current: 2150, previous: 1780 },
  { date: "Mar 10", current: 1890, previous: 1620 },
  { date: "Mar 11", current: 2450, previous: 1950 },
  { date: "Mar 12", current: 2780, previous: 2340 },
  { date: "Mar 13", current: 3120, previous: 2680 },
  { date: "Mar 14", current: 2950, previous: 2450 },
];

export const metrics = {
  netSales: { value: "MOP 34,580", change: "+12.4%", up: true },
  grossSales: { value: "MOP 36,240", change: "+10.8%", up: true },
  transactions: { value: "482", change: "+8.2%", up: true },
  avgBasket: { value: "MOP 75.20", change: "-2.1%", up: false },
};

// ─── Setup steps ────────────────────────────────────────────
export const setupSteps = [
  {
    id: "account",
    label: "Account",
    description: "Business profile & legal info",
    done: true,
  },
  {
    id: "pos",
    label: "CountingStars POS",
    description: "Configure your point of sale",
    done: true,
  },
  {
    id: "payments",
    label: "Payments",
    description: "Connect payment methods",
    done: false,
  },
  {
    id: "devices",
    label: "Devices",
    description: "Add terminals & printers",
    done: false,
  },
];

// ─── Quick actions ──────────────────────────────────────────
export const quickActions = [
  { id: "add-item", label: "Add item", icon: "PackagePlus" as const },
  { id: "take-payment", label: "Take payment", icon: "CreditCard" as const },
  { id: "create-discount", label: "Create discount", icon: "TicketPercent" as const },
  { id: "add-customer", label: "Add customer", icon: "UserPlus" as const },
  { id: "connect-terminal", label: "Connect terminal", icon: "Monitor" as const },
];

// ─── AI insights ────────────────────────────────────────────
export const aiInsights = [
  {
    id: "1",
    type: "restock" as const,
    title: "Restock recommendation for Terminal A-12",
    description: "5 items below threshold — estimated stockout in 4 hours",
    severity: "warning" as const,
    time: "12 min ago",
  },
  {
    id: "2",
    type: "anomaly" as const,
    title: "Sales anomaly detected at Taipa kiosk",
    description: "Revenue 34% below daily average — possible device issue",
    severity: "danger" as const,
    time: "28 min ago",
  },
  {
    id: "3",
    type: "forecast" as const,
    title: "Peak hour today likely 12pm – 2pm",
    description: "Based on historical patterns — consider adding staff",
    severity: "info" as const,
    time: "1 hr ago",
  },
  {
    id: "4",
    type: "inventory" as const,
    title: "Low stock risk on top 3 items",
    description: "Pocari Sweat 500ml, Vita Lemon Tea, Red Bull — reorder suggested",
    severity: "warning" as const,
    time: "2 hr ago",
  },
];

// ─── Products / Items ───────────────────────────────────────
export type Product = {
  id: string;
  name: string;
  nameCn: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  sku: string;
  status: "active" | "draft" | "archived";
  image?: string;
  updatedAt: string;
};

export const categories = [
  "All items",
  "Beverages",
  "Snacks",
  "Frozen",
  "Dairy",
  "Household",
  "Personal Care",
];

export const products: Product[] = [
  { id: "P001", name: "Pocari Sweat 500ml", nameCn: "寶礦力水特 500ml", category: "Beverages", price: 12.0, cost: 6.5, stock: 142, sku: "BEV-001", status: "active", updatedAt: "2026-03-22" },
  { id: "P002", name: "Vita Lemon Tea 250ml", nameCn: "維他檸檬茶 250ml", category: "Beverages", price: 6.5, cost: 3.2, stock: 238, sku: "BEV-002", status: "active", updatedAt: "2026-03-22" },
  { id: "P003", name: "Red Bull 250ml", nameCn: "紅牛 250ml", category: "Beverages", price: 18.0, cost: 11.0, stock: 67, sku: "BEV-003", status: "active", updatedAt: "2026-03-21" },
  { id: "P004", name: "Lay's Classic Chips 70g", nameCn: "樂事經典薯片 70g", category: "Snacks", price: 14.0, cost: 7.5, stock: 95, sku: "SNK-001", status: "active", updatedAt: "2026-03-21" },
  { id: "P005", name: "Oreo Cookies 137g", nameCn: "奧利奧餅乾 137g", category: "Snacks", price: 16.0, cost: 9.0, stock: 53, sku: "SNK-002", status: "active", updatedAt: "2026-03-20" },
  { id: "P006", name: "Häagen-Dazs Vanilla 100ml", nameCn: "哈根達斯雲呢拿 100ml", category: "Frozen", price: 42.0, cost: 28.0, stock: 24, sku: "FRZ-001", status: "active", updatedAt: "2026-03-20" },
  { id: "P007", name: "Meiji Fresh Milk 946ml", nameCn: "明治鮮牛奶 946ml", category: "Dairy", price: 28.0, cost: 18.0, stock: 31, sku: "DRY-001", status: "active", updatedAt: "2026-03-19" },
  { id: "P008", name: "Coca-Cola Zero 330ml", nameCn: "零度可口可樂 330ml", category: "Beverages", price: 8.0, cost: 4.0, stock: 186, sku: "BEV-004", status: "active", updatedAt: "2026-03-19" },
  { id: "P009", name: "KitKat Matcha 35g", nameCn: "抹茶KitKat 35g", category: "Snacks", price: 12.0, cost: 7.0, stock: 0, sku: "SNK-003", status: "draft", updatedAt: "2026-03-18" },
  { id: "P010", name: "Yakult 5-pack", nameCn: "益力多 5支裝", category: "Dairy", price: 18.0, cost: 10.0, stock: 44, sku: "DRY-002", status: "active", updatedAt: "2026-03-18" },
  { id: "P011", name: "Tempo Tissue 4-ply 18pk", nameCn: "得寶紙巾4層 18包裝", category: "Household", price: 38.0, cost: 22.0, stock: 78, sku: "HSH-001", status: "active", updatedAt: "2026-03-17" },
  { id: "P012", name: "Dove Soap Bar 100g", nameCn: "多芬香皂 100g", category: "Personal Care", price: 15.0, cost: 8.5, stock: 62, sku: "PRC-001", status: "archived", updatedAt: "2026-03-15" },
];

// ─── Customers ──────────────────────────────────────────────
export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  tier: "regular" | "silver" | "gold" | "vip";
  totalSpent: number;
  visits: number;
  points: number;
  lastVisit: string;
  joinedAt: string;
};

export const customers: Customer[] = [
  { id: "C001", name: "Chan Tai Man", phone: "+853 6281 ****", email: "chan.tm@email.com", tier: "gold", totalSpent: 12450, visits: 87, points: 2480, lastVisit: "2026-03-22", joinedAt: "2025-06-15" },
  { id: "C002", name: "Wong Siu Ming", phone: "+853 6392 ****", email: "wong.sm@email.com", tier: "vip", totalSpent: 28900, visits: 156, points: 5620, lastVisit: "2026-03-22", joinedAt: "2025-01-10" },
  { id: "C003", name: "Lei Ka Wai", phone: "+853 6543 ****", email: "lei.kw@email.com", tier: "silver", totalSpent: 4280, visits: 34, points: 850, lastVisit: "2026-03-21", joinedAt: "2025-09-22" },
  { id: "C004", name: "Ho Mei Ling", phone: "+853 6678 ****", email: "ho.ml@email.com", tier: "gold", totalSpent: 9870, visits: 62, points: 1940, lastVisit: "2026-03-20", joinedAt: "2025-04-08" },
  { id: "C005", name: "Choi Wing Han", phone: "+853 6712 ****", email: "choi.wh@email.com", tier: "regular", totalSpent: 680, visits: 8, points: 130, lastVisit: "2026-03-18", joinedAt: "2026-02-14" },
  { id: "C006", name: "Lam Chi Keung", phone: "+853 6834 ****", email: "lam.ck@email.com", tier: "silver", totalSpent: 3520, visits: 28, points: 700, lastVisit: "2026-03-17", joinedAt: "2025-08-03" },
  { id: "C007", name: "Ng Pui Shan", phone: "+853 6945 ****", email: "ng.ps@email.com", tier: "regular", totalSpent: 1240, visits: 15, points: 240, lastVisit: "2026-03-15", joinedAt: "2025-11-20" },
  { id: "C008", name: "Fong Wai Man", phone: "+853 6056 ****", email: "fong.wm@email.com", tier: "gold", totalSpent: 15680, visits: 98, points: 3120, lastVisit: "2026-03-22", joinedAt: "2024-12-01" },
];

export const customerStats = {
  total: 1248,
  newThisMonth: 42,
  activeThisWeek: 328,
  avgSpend: "MOP 72.40",
};

// Terminal mock data removed — now using real database via terminal-queries.ts
