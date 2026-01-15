// 遊戲類型定義

export interface Sticker {
  id: string;
  name: string;
  nameWithZhuyin: string;
  emoji: string;
  unlocked: boolean;
}

export interface Hat {
  id: string;
  name: string;
  nameWithZhuyin: string;
  emoji: string;
  unlocked: boolean;
}

export interface GameProgress {
  currentLevel: number;
  totalCorrect: number;
  totalPlayed: number;
  stickers: string[]; // unlocked sticker ids
  hats: string[]; // unlocked hat ids
  equippedHat: string | null;
  equippedSticker: string | null;
}

export interface DailyChallengeAttempt {
  score: number;
  totalTime: number;
}

export interface DailyChallenge {
  date: string; // YYYY-MM-DD
  attempts: DailyChallengeAttempt[]; // 每次挑戰的紀錄
  rewardClaimed: boolean;
}

export const MAX_DAILY_ATTEMPTS = 3;

export interface GameSave {
  progress: GameProgress;
  dailyChallenges: DailyChallenge[];
  lastPlayedDate: string;
}

export interface Question {
  num1: number;
  num2: number;
  answer: number;
  options: number[];
  isAddition?: boolean; // true 為加法，false 為減法
}

// 排行榜記錄
export interface LeaderboardEntry {
  name: string;
  correctCount: number;
  totalTime: number;
  score: number; // 綜合分數
  date: string;
}

// 玩家資訊
export interface PlayerInfo {
  name: string;
}
