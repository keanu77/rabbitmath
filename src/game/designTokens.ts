// 設計 Token 系統 - 統一的設計規範

// === 間距系統 (4px 為基準) ===
export const SPACING = {
  xs: 4,      // 超小間距
  sm: 8,      // 小間距
  md: 16,     // 中等間距
  lg: 24,     // 大間距
  xl: 32,     // 超大間距
  xxl: 48,    // 特大間距
} as const;

// === 圓角系統 ===
export const RADIUS = {
  sm: 8,      // 小型元素（標籤、徽章）
  md: 12,     // 中型元素（卡片、輸入框）
  lg: 16,     // 大型元素（面板）
  xl: 20,     // 特大元素（彈窗）
  full: 25,   // 完全圓角（按鈕）
} as const;

// === 動畫時長 ===
export const DURATION = {
  instant: 100,     // 即時回饋
  fast: 200,        // 快速動畫
  normal: 300,      // 標準動畫
  slow: 500,        // 慢速動畫
  decorative: 1500, // 裝飾性動畫
} as const;

// === 背景裝飾配置 ===
export const DECORATION_CONFIG = {
  count: 20,                    // 統一背景表情數量
  sizeRange: [14, 20] as const, // 字體大小範圍
  alphaRange: [0.3, 0.5] as const, // 透明度範圍
  animationDuration: [1500, 2500] as const, // 閃爍動畫時長範圍
} as const;

// === 按鈕尺寸 ===
export const BUTTON_SIZES = {
  large: { width: 280, height: 50 },   // 主菜單大按鈕
  medium: { width: 180, height: 44 },  // 中型按鈕
  small: { width: 120, height: 80 },   // 選項按鈕
  tiny: { width: 150, height: 40 },    // 標籤按鈕
} as const;

// === 卡片尺寸 ===
export const CARD_SIZES = {
  item: { width: 100, height: 120 },   // 物品卡片
  preview: { width: 160, height: 200 }, // 預覽區域
} as const;
