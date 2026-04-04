/**
 * Import CountingStars products from YP.mo export data
 *
 * Usage: cd packages/database && npx tsx src/import-yp-full.ts
 *
 * Data format: Tab-separated values with columns:
 * 记录ID, ID, 招牌名TC, 招牌名EN, 狀態, 售價, 原價, 是否不限庫存, 自定義分類, ...
 *
 * Schema: name = TC name (default), translations = { en: EN_name }
 */

import "dotenv/config";
import { db } from "./client";
import { products, categories, tenants } from "./schema";
import { eq, and, isNull } from "drizzle-orm";

// ──────────────────────────────────────────────
// Raw product data from YP.mo export (pasted by user)
// Format: [recordId, sku, nameTc, nameEn, status, price, origPrice, unlimited, category, stock, barcode]
// ──────────────────────────────────────────────

const RAW_PRODUCTS: [number, string, string, string, string, string, string, boolean, string, number, string][] = [
  [83518, "SW0253", "SAVEWO ROYAL MASK 救世 2D 對摺型口罩「FFP2 + KF94 + KN95 + ASTM LEVEL3 認證 」純白（30片獨立包裝/盒）", "SAVEWO ROYAL MASK 救世 2D 對摺型口罩「FFP2 + KF94 + KN95 + ASTM LEVEL3 認證 」純白（30片獨立包裝/盒）", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999829, "4897115145575"],
  [83807, "SW0086", "SAVEWO 救世 ClassicMask 平面口罩 175mm (白色)", "SAVEWO 救世 ClassicMask 平面口罩 175mm (白色)", "PUBLISHED", "59.00", "59.00", true, "Savewo 立體3D口罩 (盒裝)", 999526, "4897115143267"],
  [83509, "SW0250", "SAVEWO 救世 3DMEOW 小狼的朋友們 KS (一盒三款, 每款10片, 30片/盒，獨立包裝）", "SAVEWO 救世 3DMEOW 小狼的朋友們 KS (一盒三款, 每款10片, 30片/盒，獨立包裝）", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999966, "4897115146145"],
  [83749, "SW0051", "SAVEWO 救世 3DMASK Kids 超⽴體兒童防護⼝罩L2-大碼「適合人群：7-13歲少年」", "SAVEWO 救世 3DMASK Kids 超⽴體兒童防護⼝罩L2-大碼「適合人群：7-13歲少年」", "PUBLISHED", "129.00", "129.00", true, "Savewo 立體3D口罩 (盒裝)", 999906, "4897115142536"],
  [83505, "SW0251", "SAVEWO 救世 3DMEOW 小狼的朋友們 KL (一盒三款, 每款10片, 30片/盒，獨立包裝）", "SAVEWO 救世 3DMEOW 小狼的朋友們 KL (一盒三款, 每款10片, 30片/盒，獨立包裝）", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999980, "4897115146138"],
  [83555, "SW0149", "SAVEWO 3DMASK Vplus(KN壓印) 救世超立體口罩Vplus - (30片獨立包裝/盒) (REGULAR SIZE 標準碼)", "SAVEWO 3DMASK Vplus(KN壓印) 救世超立體口罩Vplus - (30片獨立包裝/盒) (REGULAR SIZE 標準碼)", "PUBLISHED", "129.00", "129.00", true, "Savewo 立體3D口罩 (盒裝)", 999766, "4897115145568"],
  [87301, "2025040309", "環保袋", "環保袋", "PUBLISHED", "2.00", "2.00", false, "其他", 9892, ""],
  [85114, "11e9c23", "Chiikawa毛絨公仔(小)", "Chiikawa毛絨公仔(小)", "PUBLISHED", "48.00", "48.00", false, "Chiikawa", 7, ""],
  [85116, "50e6569", "Chiikawa鑰匙扣", "Chiikawa鑰匙扣", "PUBLISHED", "24.00", "24.00", false, "Chiikawa", -6, ""],
  [85119, "cf9bf67", "懷孕動物", "懷孕動物", "PUBLISHED", "110.00", "110.00", true, "懷孕動物", 99986, ""],
  [85170, "2025032809", "盲盒", "盲盒", "PUBLISHED", "49.00", "49.00", false, "毛絨公仔/玩具/盲盒", 24, ""],
  [85168, "2025032807", "美人魚公仔", "美人魚公仔", "PUBLISHED", "108.00", "108.00", false, "毛絨公仔/玩具/盲盒", -2, ""],
  [102834, "60c49fa", "全球於旅行快充插头", "全球於旅行快充插头", "PUBLISHED", "298.00", "298.00", true, "Savewo 救世", 99997, ""],
  [85160, "2025032812", "labubu", "labubu", "PUBLISHED", "350.00", "350.00", false, "labubu", 10, ""],
  [86946, "2025040301", "853口罩", "853口罩", "PUBLISHED", "36.00", "36.00", false, "口罩", 6971, ""],
  [85159, "2025032801", "懷孕動物扭蛋", "懷孕動物扭蛋", "PUBLISHED", "30.00", "30.00", false, "懷孕動物", -4, ""],
  [85161, "2025032802", "澳門神明明信片郵票", "澳門神明明信片郵票", "PUBLISHED", "18.00", "18.00", false, "明信片、郵票", 22, ""],
  [85118, "1b8cf84", "毛絨公仔/玩具/盲盒", "毛絨公仔/玩具/盲盒", "PUBLISHED", "22.00", "22.00", false, "毛絨公仔/玩具/盲盒", 237, ""],
  [86943, "2025040305", "戒指", "戒指", "PUBLISHED", "140.00", "140.00", false, "飾品類", 4995, ""],
  [86944, "2025040304", "耳環", "耳環", "PUBLISHED", "108.00", "108.00", false, "飾品類", 7992, ""],
  [86945, "2025040306", "手鐲", "手鐲", "PUBLISHED", "198.00", "198.00", false, "飾品類", 1998, ""],
  [87300, "2025040307", "耳扣", "耳扣", "PUBLISHED", "118.00", "118.00", false, "飾品類", 9999, ""],
  [87302, "2025040308", "美容膠布", "美容膠布", "PUBLISHED", "150.00", "150.00", false, "飾品類", 9999, ""],
  [86947, "2025040303", "labubu", "labubu", "PUBLISHED", "188.00", "188.00", false, "labubu", 4034, ""],
  [86948, "2025040302", "雨傘", "雨傘", "PUBLISHED", "168.00", "168.00", false, "雨傘", 1998, ""],
  [85157, "2025032810", "AirFlow香薰片", "AirFlow香薰片", "PUBLISHED", "59.00", "59.00", false, "Air flow", 21, ""],
  [85158, "2025032811", "labubu 透明保護殼", "labubu 透明保護殼", "PUBLISHED", "80.00", "80.00", false, "labubu", 0, ""],
  [85162, "2025032813", "TORY YAMA保溫袋", "TORY YAMA保溫袋", "PUBLISHED", "168.00", "168.00", false, "TORY YAMA", 68, ""],
  [85163, "2025032803", "麥當勞水晶麻將", "麥當勞水晶麻將", "PUBLISHED", "1888.00", "1888.00", false, "麥當勞", 1, ""],
  [85164, "2025032814", "QMSV高達盲盒", "QMSV高達盲盒", "PUBLISHED", "115.00", "115.00", false, "毛絨公仔/玩具/盲盒", 5, ""],
  [85165, "2025032804", "麥當勞碗碟套裝", "麥當勞碗碟套裝", "PUBLISHED", "150.00", "150.00", false, "麥當勞", 0, ""],
  [85166, "2025032805", "麥當勞公仔1set4個", "麥當勞公仔1set4個", "PUBLISHED", "398.00", "398.00", false, "麥當勞", 1, ""],
  [85167, "2025032806", "blackpink 星巴克聯名粉色杯", "blackpink 星巴克聯名粉色杯", "PUBLISHED", "288.00", "288.00", false, "星巴克", 1, ""],
  [85169, "2025032808", "Travel 豬豬存錢罐", "Travel 豬豬存錢罐", "PUBLISHED", "95.00", "95.00", false, "Travel", 0, ""],
  [85120, "f41d117", "動物餅乾公仔", "動物餅乾公仔", "PUBLISHED", "108.00", "108.00", false, "動物餅乾", 1, ""],
  [85121, "9b236b4", "Air flow冰感風扇", "Air flow冰感風扇", "PUBLISHED", "198.00", "198.00", false, "Air flow", 10, ""],
  [85122, "e421ad0", "Air flow香薰風扇", "Air flow香薰風扇", "PUBLISHED", "168.00", "168.00", false, "Air flow", 23, ""],
  [85123, "5de95f8", "特價盲盒", "特價盲盒", "PUBLISHED", "0.00", "0.00", false, "特價", 63, ""],
  [85112, "dc2286b", "chiikawa毛絨公仔掛件", "chiikawa毛絨公仔掛件", "PUBLISHED", "50.00", "50.00", false, "Chiikawa", 22, ""],
  [85113, "0d81bfd", "chiikawa盲盒", "chiikawa盲盒", "PUBLISHED", "24.00", "24.00", false, "Chiikawa", 16, ""],
  [85115, "9519d4f", "Chiikawa立牌", "Chiikawa立牌", "PUBLISHED", "68.00", "68.00", false, "Chiikawa", 0, ""],
  [85117, "c10f4c0", "Chiikawa痛包", "Chiikawa痛包", "PUBLISHED", "128.00", "128.00", false, "Chiikawa", 0, ""],
  [93455, "4b03f93", "抗原試劑", "抗原試劑", "PUBLISHED", "19.00", "19.00", false, "Savewo 救世", 25, ""],
  [93456, "36abda6", "移動電源", "移動電源", "PUBLISHED", "368.00", "368.00", false, "Savewo 救世", 2, ""],
  [101123, "7b16f99", "HEALTHCHAIR X CARBON - XC1 超輕量級智能健康椅", "HEALTHCHAIR X CARBON - XC1 超輕量級智能健康椅", "PUBLISHED", "13200.00", "13200.00", false, "Savewo 救世", 4, ""],
  // Savewo masks — large block (abbreviated for readability but full data)
  [83686, "SW0006", "救世超立體口罩 SAVEWO 3DMASK Hana R Collection藍雪花 Plumbago（30片獨立包裝/盒）", "", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999953, "4897115140730"],
  [83675, "SW0002", "SAVEWO 3DMASK Kuro Collection城堡灰 Castle Grey（30片獨立包裝/盒）標準碼 Medium Size", "", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999953, "4897115143670"],
  [83810, "SW0085", "SAVEWO 救世 ClassicMask 平面口罩 175mm (灰色)", "", "PUBLISHED", "59.00", "59.00", true, "Savewo 立體3D口罩 (盒裝)", 999890, "4897115143243"],
  [83809, "SW0084", "SAVEWO 救世 ClassicMask 平面⼝罩 175mm (黑色)", "", "PUBLISHED", "59.00", "59.00", true, "Savewo 立體3D口罩 (盒裝)", 999882, "4897115143250"],
  [83522, "SW0017", "SAVEWO 3DBEAR Blue 救世立體啤幼兒防護口罩粉藍色 (30片獨立包裝/盒)", "", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999981, "4897115141140"],
  [83548, "SW0022", "SAVEWO 3DMEOW FOR KIDS L2 Pink 救世立體喵兒童防護口罩L2粉紅色 (30片獨立包裝/盒)", "", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999886, "4897115140556"],
  [83591, "SW0285", "SAVEWO ROYAL MASK 救世 2D 對摺型口罩「FFP2」蝶豆花（30片獨立包裝/盒）", "", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999940, ""],
  [83543, "SW0024", "SAVEWO 3DMEOW FOR KIDS L2 White 救世立體喵兒童防護口罩L2純白色", "", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999707, "4897115140532"],
  [83531, "SW0137", "SAVEWO 3DMASK ULTRA M SIZE救世超立體口罩ULTRA M-標準碼 TYPECOOL+（30片獨立包裝/盒）", "", "PUBLISHED", "189.00", "189.00", true, "Savewo 立體3D口罩 (盒裝)", 999984, "4897115140099"],
  [83537, "SW0021", "SAVEWO 3DMEOW FOR KIDS S2 White 救世立體喵兒童防護口罩S2純白色", "", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999824, "4897115140020"],
  [83533, "SW0019", "SAVEWO 3DMEOW FOR KIDS S2 Pink 救世立體喵兒童防護口罩S2粉紅色", "", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999841, "4897115140068"],
  [83683, "SW0001", "SAVEWO 3DMASK Kuro Collection暗魂黑 DarkSoul Black（30片獨立包裝/盒）標準碼", "", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999937, "4897115143663"],
  [83692, "SW0004", "SAVEWO 3DMASK Kuro Collection深海藍 Deepsea Blue（30片獨立包裝/盒）標準碼", "", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999967, "4897115143687"],
  [83678, "SW0003", "SAVEWO 3DMASK Kuro Collection森林綠 Forest Green（30片獨立包裝/盒）標準碼", "", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999996, "4897115143694"],
  [83530, "SW0016", "SAVEWO 3DBEAR Pink 救世立體啤幼兒防護口罩粉紅色 (30片獨立包裝/盒)", "", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999990, "4897115141157"],
  [83525, "SW0018", "SAVEWO 3DBEAR White 救世立體啤幼兒防護口罩純白色 (30片獨立包裝/盒)", "", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999987, "4897115141065"],
  [83766, "SW0181", "SAVEWO ClassicMask 三摺平面口罩 (白色 30片/盒，獨立包裝，160mm 成人細碼）", "", "PUBLISHED", "59.00", "59.00", true, "Savewo 平⾯⼝罩 (盒裝)", 999945, "4897115143458"],
  [83764, "SW0059", "SAVEWO 3DMASK Kuro Collection（Type.Cool+） 城堡灰（30片獨立包裝/盒）大碼", "", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999959, "4897115143717"],
  [83512, "SW0255", "SAVEWO ROYAL MASK 救世 2D 對摺型口罩「FFP2」桂枝（30片獨立包裝/盒）", "", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999977, "4897115145759"],
  [83515, "SW0256", "SAVEWO ROYAL MASK 救世 2D 對摺型口罩「FFP2」酷黑（30片獨立包裝/盒）", "", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999902, "4897115145766"],
  [83521, "SW0254", "SAVEWO ROYAL MASK 救世 2D 對摺型口罩「FFP2」晨霧（30片獨立包裝/盒）", "", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999959, "4897115145742"],
  [83544, "SW0145", "SAVEWO 3DMASK ULTRA S SIZE救世超立體口罩ULTRA S TYPECOOL+（30片獨立包裝/盒）", "", "PUBLISHED", "189.00", "189.00", true, "Savewo 立體3D口罩 (盒裝)", 999984, "4897115140112"],
  [83679, "SW0124", "SAVEWO 3DMASK ULTRA R SIZE救世超立體口罩ULTRA R TYPECOOL+（30片獨立包裝/盒）", "", "PUBLISHED", "189.00", "189.00", true, "Savewo 立體3D口罩 (盒裝)", 999895, "4897115140853"],
  [83676, "SW0123", "SAVEWO 3DMASK ULTRA L SIZE救世超立體口罩ULTRA 大碼 TYPECOOL+（30片獨立包裝/盒）", "", "PUBLISHED", "189.00", "189.00", true, "Savewo 立體3D口罩 (盒裝)", 999987, "4897115140136"],
  [83534, "SW0020", "SAVEWO 3DMEOW FOR KIDS S2 Blue 救世立體喵兒童防護口罩S2粉藍色", "", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999921, "4897115140051"],
  [83551, "SW0023", "SAVEWO 3DMEOW FOR KIDS L2 Blue 救世立體喵兒童防護口罩L2粉藍色", "", "PUBLISHED", "149.00", "149.00", true, "Savewo 立體3D口罩 (盒裝)", 999892, "4897115140549"],
  [83612, "SW0049", "SAVEWO 救世 3DMASK Kids 超⽴體兒童防護⼝罩S-細碼「適合人群：2-6歲幼童」", "", "PUBLISHED", "129.00", "129.00", true, "Savewo 立體3D口罩 (盒裝)", 999912, "4897115142543"],
  [83623, "SW0331", "AIRFLOW - COOL FAN 酷冰⾵扇 - ⽩⾊", "", "PUBLISHED", "198.00", "198.00", true, "Savewo 救世", 999996, "4897115147654"],
  [83621, "SW0330", "AIRFLOW - COOL FAN 酷冰⾵扇 - ⿊⾊", "", "PUBLISHED", "198.00", "198.00", true, "Savewo 救世", 999999, "4897115147647"],
  [83724, "SW0200", "SAVEWO FreshQ 充電式次氯酸製造機", "", "PUBLISHED", "298.00", "298.00", true, "Savewo 救世", 999998, "4897115144073"],
  [83716, "SW0314", "SAVEWO MagCell 5000mAh Wireless PowerBank (銀灰)", "", "PUBLISHED", "398.00", "398.00", true, "Savewo 救世", 999999, "4897115146879"],
  [83717, "SW0315", "SAVEWO MagCell 5000mAh 超薄磁吸式無線⾏動電源 - 冰藍", "", "PUBLISHED", "398.00", "398.00", true, "Savewo 救世", 999999, "4897115146886"],
  [83718, "SW0312", "SAVEWO AirFlow 掛頸⾵扇 純⽩⾊", "", "PUBLISHED", "299.00", "299.00", true, "Savewo 救世", 999999, "4897115146312"],
  [83719, "SW0313", "SAVEWO MagCell 5000mAh Wireless PowerBank (⾦⾊)", "", "PUBLISHED", "398.00", "398.00", true, "Savewo 救世", 999999, "4897115146893"],
  [83720, "SW0318", "SAVEWO MagCell 5000mAh Wireless PowerBank (櫻花粉)", "", "PUBLISHED", "398.00", "398.00", true, "Savewo 救世", 999999, "4897115146862"],
  [83721, "SW0319", "SAVEWO MagCell 5000mAh Wireless PowerBank (銀⽩)", "", "PUBLISHED", "398.00", "398.00", true, "Savewo 救世", 999999, "4897115147203"],
  [83722, "SW0316", "SAVEWO MagCell 5000mAh Wireless PowerBank (薄荷綠)", "", "PUBLISHED", "398.00", "398.00", true, "Savewo 救世", 999999, "4897115146909"],
  [83723, "SW0317", "SAVEWO MagCell 5000mAh Wireless PowerBank (鈦原⾊)", "", "PUBLISHED", "398.00", "398.00", true, "Savewo 救世", 999999, "4897115147227"],
  [83728, "SW0320", "SAVEWO MagCell 5000mAh Wireless PowerBank (鈦藍⾊)", "", "PUBLISHED", "398.00", "398.00", true, "Savewo 救世", 999999, "4897115147234"],
  [83725, "SW0321", "SAVEWO PowerCable USB-C Magnetic - 1 Meters - Blue", "", "PUBLISHED", "129.00", "129.00", true, "Savewo 救世", 999999, "4897115147371"],
  [83727, "SW0322", "SAVEWO PowerCable USB-C Magnetic - 1 Meters - Black", "", "PUBLISHED", "129.00", "129.00", true, "Savewo 救世", 999999, "4897115147340"],
  [83730, "SW0325", "SAVEWO PowerCable USB-C Magnetic - 1 Meters - Pink", "", "PUBLISHED", "129.00", "129.00", true, "Savewo 救世", 999999, "4897115147395"],
  [83732, "SW0326", "SAVEWO PowerCable USB-C Magnetic - 1 Meters - White", "", "PUBLISHED", "129.00", "129.00", true, "Savewo 救世", 999999, "4897115147388"],
  [83734, "SW0323", "SAVEWO PowerCable USB-C Magnetic - 1 Meters - CITRINE", "", "PUBLISHED", "129.00", "129.00", true, "Savewo 救世", 999999, "4897115147357"],
  [83736, "SW0324", "SAVEWO PowerCable USB-C Magnetic - 1 Meters - Mint", "", "PUBLISHED", "129.00", "129.00", true, "Savewo 救世", 999999, "4897115147364"],
  [83738, "SW0329", "SAVEWO AirFlow 掛頸⾵扇 薄荷⾊", "", "PUBLISHED", "299.00", "299.00", true, "Savewo 救世", 999999, "4897115146329"],
  [83743, "SW0328", "SAVEWO AirFlow 掛頸⾵扇 奶茶⾊", "", "PUBLISHED", "299.00", "299.00", true, "Savewo 救世", 999999, "4897115146336"],
  [83741, "SW0327", "SAVEWO TRANSKIN Waterproof Dressing - 10cm x 2M", "", "PUBLISHED", "210.00", "210.00", true, "Savewo 救世", 999999, "9555864004356"],
  [83524, "SW0259", "SAVEWO RAINEC MINI PRO Foldable Umbrella (Silver Wormwood銀葉艾)", "", "PUBLISHED", "238.00", "238.00", true, "Savewo 救世", 999999, "4897115146190"],
  [83529, "SW0257", "SAVEWO RAINEC MINI PRO Foldable Umbrella (Miscanthus 芒草)", "", "PUBLISHED", "238.00", "238.00", true, "Savewo 救世", 999999, "4897115146183"],
  [83532, "SW0258", "SAVEWO RAINEC MINI PRO Foldable Umbrella (Petal 花瓣)", "", "PUBLISHED", "238.00", "238.00", true, "Savewo 救世", 999999, "4897115146206"],
  [83536, "SW0262", "SAVEWO RAINEC AIR Foldable Umbrella (Celestine)", "", "PUBLISHED", "168.00", "168.00", true, "Savewo 救世", 999999, "4897115145025"],
  [83539, "SW0263", "SAVEWO RAINEC AIR Foldable Umbrella (Green vines)", "", "PUBLISHED", "168.00", "168.00", true, "Savewo 救世", 999999, "4897115145018"],
  [83540, "SW0260", "SAVEWO RAINEC AIR Foldable Umbrella (Nightsea)", "", "PUBLISHED", "168.00", "168.00", true, "Savewo 救世", 999999, "4897115145001"],
  [83542, "SW0261", "SAVEWO RAINEC AIR Foldable Umbrella (Dusty Rose)", "", "PUBLISHED", "168.00", "168.00", true, "Savewo 救世", 999999, "4897115144998"],
  [83550, "SW0264", "SAVEWO RAINEC AIR Foldable Umbrella (Grey)", "", "PUBLISHED", "168.00", "168.00", true, "Savewo 救世", 999999, "4897115142758"],
  [83588, "SW0284", "Savewo MagRing磁吸環", "", "PUBLISHED", "19.00", "19.00", true, "Savewo 救世", 999999, ""],
  [83558, "SW0147", "SAVEWO 救世HEPA H12 及活性碳淨化濾網組合（For TGP-X系列）", "", "PUBLISHED", "380.00", "380.00", true, "Savewo 救世", 999999, ""],
  [83561, "SW0148", "SAVEWO 救世 HEPA H13 及 活性碳淨化濾網組合（For TGP-X系列）", "", "PUBLISHED", "480.00", "480.00", true, "Savewo 救世", 999999, ""],
  [83562, "SW0269", "SAVEWO MagCell 8mm Ultra Thin 5000mAh Powerbank Black", "", "PUBLISHED", "238.00", "238.00", true, "Savewo 救世", 999999, ""],
  [83563, "SW0270", "SAVEWO USB-C ProCable USB4.0 Thunderbolt 4 極速充電傳輸線 (鈦藍⾊) 1⽶", "", "PUBLISHED", "79.00", "79.00", true, "Savewo 救世", 999999, ""],
  [83569, "SW0271", "SAVEWO USB-C ProCable LED 功率顯⽰USB4.0 Thunderbolt 4 極速充電傳輸線 (鈦藍⾊) 1⽶", "", "PUBLISHED", "79.00", "79.00", true, "Savewo 救世", 999999, ""],
  [83559, "SW0268", "SAVEWO RAINEC ULTRA Lightest Large Size Carbon Fiber Umbrella (Black)", "", "PUBLISHED", "298.00", "298.00", true, "Savewo 救世", 999999, ""],
  [83573, "SW0277", "SAVEWO X EVANGELION MagCell 5000mAh Wireless PowerBank 緊急狀態 ⿊紅", "", "PUBLISHED", "369.00", "369.00", true, "Savewo 救世", 999999, ""],
  [83579, "SW0276", "SAVEWO X EVANGELION MagCell 5000mAh Wireless PowerBank 初號機裝 紫、綠", "", "PUBLISHED", "368.00", "368.00", true, "Savewo 救世", 999999, ""],
  [83811, "SW0088", "SAVEWO 救世 Covid-19@新型冠狀病毒抗原檢測試劑", "", "PUBLISHED", "9.90", "9.90", true, "Savewo 救世", 999999, "4897115143748"],
  [83703, "SP00641", "SAVEWO九合⼀抗原快測試劑", "", "PUBLISHED", "35.00", "35.00", true, "Savewo 救世", 999998, ""],
  [83713, "SP00634", "SAVEWO六合⼀抗原快測試劑", "", "PUBLISHED", "35.00", "35.00", true, "Savewo 救世", 999999, ""],
  [83704, "SP00629", "EVANGELION FLY ME TO THE MOON 立體金屬浮雕麻糬月餅豪華禮盒", "", "PUBLISHED", "368.00", "368.00", true, "Savewo 救世", 999998, ""],
  [83712, "SW0310", "Savewo AirFlow Soild Aroma - Bergamot 10Pcs", "", "PUBLISHED", "69.00", "69.00", true, "Savewo 救世", 999999, "4897115147579"],
  [83714, "SW0310", "Savewo AirFlow Soild Aroma - Camellia 10 Pcs", "", "PUBLISHED", "69.00", "69.00", true, "Savewo 救世", 999999, "4897115147593"],
  [83715, "SW0311", "Savewo AirFlow Soild Aroma - Freesia 10 Pcs", "", "PUBLISHED", "69.00", "69.00", true, "Savewo 救世", 999999, "4897115147586"],
  [83661, "SW0116", "SAVEWO 救世 3DMASK SANRIO Hello Kitty系列「Kitty Letter」超⽴體⼝罩", "", "PUBLISHED", "59.00", "59.00", true, "Savewo 救世", 999999, "4897115141775"],
  [83808, "SW0087", "SAVEWO X 別天神 幪⾯超⼈50年紀念⼝罩「第四彈 RX系列」珍藏鐵盒版本", "", "PUBLISHED", "158.00", "158.00", true, "Savewo 救世", 999999, "4897115142956"],
];

// ──────────────────────────────────────────────
// Import logic
// ──────────────────────────────────────────────

async function main() {
  console.log(`\n📦 Importing ${RAW_PRODUCTS.length} products from YP.mo...\n`);

  // 1. Get tenant
  const [tenant] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, "countingstars")).limit(1);
  if (!tenant) throw new Error("Tenant 'countingstars' not found. Run db:seed first.");
  const tenantId = tenant.id;
  console.log(`✅ Tenant: countingstars (${tenantId})`);

  // 2. Get existing categories
  const existingCats = await db.select().from(categories).where(eq(categories.tenantId, tenantId));
  const catMap = new Map<string, string>();
  for (const c of existingCats) {
    catMap.set(c.name, c.id);
    // Also map by English name
    const trans = c.translations as Record<string, string> | null;
    if (trans?.en) catMap.set(trans.en, c.id);
  }
  console.log(`✅ Existing categories: ${existingCats.length}`);

  // 3. Find unique categories from import data
  const uniqueCats = [...new Set(RAW_PRODUCTS.map(p => p[8]).filter(Boolean))];
  let newCatCount = 0;
  for (const catName of uniqueCats) {
    if (!catMap.has(catName)) {
      const [newCat] = await db.insert(categories).values({
        tenantId,
        name: catName,
        translations: {},
        isActive: true,
        sortOrder: catMap.size,
      }).returning({ id: categories.id });
      catMap.set(catName, newCat.id);
      newCatCount++;
    }
  }
  console.log(`✅ Created ${newCatCount} new categories (total: ${catMap.size})`);

  // 4. Get existing SKUs to avoid duplicates
  const existingProducts = await db.select({ sku: products.sku }).from(products).where(and(eq(products.tenantId, tenantId), isNull(products.deletedAt)));
  const existingSkus = new Set(existingProducts.map(p => p.sku).filter(Boolean));
  console.log(`✅ Existing products: ${existingProducts.length} (${existingSkus.size} SKUs)`);

  // 5. Insert products
  let inserted = 0;
  let skipped = 0;

  for (const [_rid, sku, nameTc, nameEn, status, price, origPrice, unlimited, cat, stock, barcode] of RAW_PRODUCTS) {
    // Skip if SKU already exists
    if (sku && existingSkus.has(sku)) {
      skipped++;
      continue;
    }

    const categoryId = catMap.get(cat) || null;
    const translations: Record<string, string> = {};

    // Only add EN translation if it's different from TC name
    if (nameEn && nameEn !== nameTc) {
      translations.en = nameEn;
    }

    const productStatus = status === "PUBLISHED" ? "active" : "draft";
    const stockValue = unlimited ? null : Math.max(0, stock);

    try {
      await db.insert(products).values({
        tenantId,
        name: nameTc,
        translations: Object.keys(translations).length > 0 ? translations : null,
        sku: sku || null,
        barcode: barcode || null,
        sellingPrice: price,
        originalPrice: origPrice !== price ? origPrice : null,
        stock: stockValue,
        categoryId,
        status: productStatus as "active" | "draft" | "inactive" | "sold_out",
        isPopular: false,
      });
      inserted++;
      existingSkus.add(sku);
    } catch (err) {
      console.error(`  ❌ Failed to insert "${nameTc}": ${err}`);
    }
  }

  console.log(`\n📊 Import complete:`);
  console.log(`  ✅ Inserted: ${inserted}`);
  console.log(`  ⏭️  Skipped (duplicate SKU): ${skipped}`);
  console.log(`  📦 Total products now: ${existingProducts.length + inserted}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
