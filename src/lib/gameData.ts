// 遊戲數據 - 貼紙和帽子（兔子風格）

import { Sticker, Hat } from '@/types/game';

export const STICKERS: Sticker[] = [
  { id: 'carrot', name: '胡蘿蔔', nameWithZhuyin: '胡（ㄏㄨˊ）蘿（ㄌㄨㄛˊ）蔔（ㄅㄛ˙）', emoji: '🥕', unlocked: false },
  { id: 'heart', name: '愛心', nameWithZhuyin: '愛（ㄞˋ）心（ㄒㄧㄣ）', emoji: '💗', unlocked: false },
  { id: 'star', name: '星星', nameWithZhuyin: '星（ㄒㄧㄥ）星（ㄒㄧㄥ）', emoji: '⭐', unlocked: false },
  { id: 'flower', name: '花朵', nameWithZhuyin: '花（ㄏㄨㄚ）朵（ㄉㄨㄛˇ）', emoji: '🌸', unlocked: false },
  { id: 'bow', name: '蝴蝶結', nameWithZhuyin: '蝴（ㄏㄨˊ）蝶（ㄉㄧㄝˊ）結（ㄐㄧㄝˊ）', emoji: '🎀', unlocked: false },
  { id: 'rainbow', name: '彩虹', nameWithZhuyin: '彩（ㄘㄞˇ）虹（ㄏㄨㄥˊ）', emoji: '🌈', unlocked: false },
  { id: 'clover', name: '幸運草', nameWithZhuyin: '幸（ㄒㄧㄥˋ）運（ㄩㄣˋ）草（ㄘㄠˇ）', emoji: '🍀', unlocked: false },
  { id: 'butterfly', name: '蝴蝶', nameWithZhuyin: '蝴（ㄏㄨˊ）蝶（ㄉㄧㄝˊ）', emoji: '🦋', unlocked: false },
  { id: 'candy', name: '糖果', nameWithZhuyin: '糖（ㄊㄤˊ）果（ㄍㄨㄛˇ）', emoji: '🍬', unlocked: false },
  { id: 'sparkle', name: '閃亮', nameWithZhuyin: '閃（ㄕㄢˇ）亮（ㄌㄧㄤˋ）', emoji: '✨', unlocked: false },
];

export const HATS: Hat[] = [
  { id: 'bunny', name: '兔耳朵', nameWithZhuyin: '兔（ㄊㄨˋ）耳（ㄦˇ）朵（ㄉㄨㄛˇ）', emoji: '🐰', unlocked: false },
  { id: 'crown', name: '皇冠', nameWithZhuyin: '皇（ㄏㄨㄤˊ）冠（ㄍㄨㄢ）', emoji: '👑', unlocked: false },
  { id: 'ribbon', name: '緞帶', nameWithZhuyin: '緞（ㄉㄨㄢˋ）帶（ㄉㄞˋ）', emoji: '🎀', unlocked: false },
  { id: 'flower', name: '花環', nameWithZhuyin: '花（ㄏㄨㄚ）環（ㄏㄨㄢˊ）', emoji: '💐', unlocked: false },
  { id: 'strawberry', name: '草莓帽', nameWithZhuyin: '草（ㄘㄠˇ）莓（ㄇㄟˊ）帽（ㄇㄠˋ）', emoji: '🍓', unlocked: false },
];

// 遊戲常數
export const GAME_CONFIG = {
  totalQuestions: 10, // 每關題目數量
  maxNumber: 10, // 最大數字範圍
  minNumber: 1, // 最小數字範圍
  optionCount: 4, // 選項數量
};

// 獎勵配置
export const REWARD_CONFIG = {
  correctAnswerPoints: 10,
  dailyChallengeBonus: 50,
  perfectScoreBonus: 100,
  stickerUnlockThreshold: 100, // 每 100 分解鎖一張貼紙
  hatUnlockThreshold: 300, // 每 300 分解鎖一頂帽子
};

// 純文字對照（不帶注音，用於關卡內）
export const PLAIN_TEXT = {
  tryAgain: '再試一次',
  great: '太棒了',
  countTogether: '一起數數看',
  question: '第 {n} 題',
  score: '分數',
  back: '返回',
  completed: '完成',
  claimReward: '領取獎勵',
  rewardClaimed: '已領取',
  newUnlock: '解鎖新獎勵',
  dailyChallenge: '每日挑戰',
  dressUp: '裝扮',
  stickers: '貼紙',
  hats: '帽子',
  equip: '裝備',
  equipped: '已裝備',
  locked: '未解鎖',
};

// 注音文字對照（用於主選單等）
export const ZHUYIN_TEXT = {
  start: '開（ㄎㄞ）始（ㄕˇ）',
  dailyChallenge: '每（ㄇㄟˇ）日（ㄖˋ）挑（ㄊㄧㄠˇ）戰（ㄓㄢˋ）',
  collection: '收（ㄕㄡ）藏（ㄘㄤˊ）',
  dressUp: '裝（ㄓㄨㄤ）扮（ㄅㄢˋ）',
  correct: '正（ㄓㄥˋ）確（ㄑㄩㄝˋ）',
  tryAgain: '再（ㄗㄞˋ）試（ㄕˋ）一（ㄧ）次（ㄘˋ）',
  great: '太（ㄊㄞˋ）棒（ㄅㄤˋ）了（ㄌㄜ˙）',
  countTogether: '一（ㄧ）起（ㄑㄧˇ）數（ㄕㄨˇ）數（ㄕㄨˇ）看（ㄎㄢˋ）',
  question: '第（ㄉㄧˋ）{n}題（ㄊㄧˊ）',
  score: '分（ㄈㄣ）數（ㄕㄨˋ）',
  back: '返（ㄈㄢˇ）回（ㄏㄨㄟˊ）',
  claimReward: '領（ㄌㄧㄥˇ）取（ㄑㄩˇ）獎（ㄐㄧㄤˇ）勵（ㄌㄧˋ）',
  rewardClaimed: '已（ㄧˇ）領（ㄌㄧㄥˇ）取（ㄑㄩˇ）',
  notCompleted: '尚（ㄕㄤˋ）未（ㄨㄟˋ）完（ㄨㄢˊ）成（ㄔㄥˊ）',
  completed: '完（ㄨㄢˊ）成（ㄔㄥˊ）',
  stickers: '貼（ㄊㄧㄝ）紙（ㄓˇ）',
  hats: '帽（ㄇㄠˋ）子（ㄗˇ）',
  equip: '裝（ㄓㄨㄤ）備（ㄅㄟˋ）',
  equipped: '已（ㄧˇ）裝（ㄓㄨㄤ）備（ㄅㄟˋ）',
  locked: '未（ㄨㄟˋ）解（ㄐㄧㄝˇ）鎖（ㄙㄨㄛˇ）',
  newUnlock: '解（ㄐㄧㄝˇ）鎖（ㄙㄨㄛˇ）新（ㄒㄧㄣ）獎（ㄐㄧㄤˇ）勵（ㄌㄧˋ）',
  play: '玩（ㄨㄢˊ）',
  equals: '等（ㄉㄥˇ）於（ㄩˊ）',
  plus: '+',
};
