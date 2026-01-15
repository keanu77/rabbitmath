// localStorage 存檔系統

import { GameSave, GameProgress, DailyChallenge, LeaderboardEntry, PlayerInfo } from '@/types/game';
import { MusicType, MUSIC_TYPES } from './audio';

const STORAGE_KEY = 'kuromi_math_save';
const LEADERBOARD_KEY = 'kuromi_math_leaderboard';
const PLAYER_KEY = 'kuromi_math_player';
const MUSIC_KEY = 'kuromi_math_music';

const defaultProgress: GameProgress = {
  currentLevel: 1,
  totalCorrect: 0,
  totalPlayed: 0,
  stickers: [],
  hats: [],
  equippedHat: null,
  equippedSticker: null,
};

const defaultSave: GameSave = {
  progress: defaultProgress,
  dailyChallenges: [],
  lastPlayedDate: '',
};

// 資料驗證函數
function isValidGameProgress(data: unknown): data is GameProgress {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.currentLevel === 'number' &&
    typeof obj.totalCorrect === 'number' &&
    typeof obj.totalPlayed === 'number' &&
    Array.isArray(obj.stickers) &&
    Array.isArray(obj.hats) &&
    (obj.equippedHat === null || typeof obj.equippedHat === 'string') &&
    (obj.equippedSticker === null || typeof obj.equippedSticker === 'string')
  );
}

function isValidDailyChallenge(data: unknown): data is DailyChallenge {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.date === 'string' &&
    Array.isArray(obj.attempts) &&
    typeof obj.rewardClaimed === 'boolean'
  );
}

function isValidGameSave(data: unknown): data is GameSave {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    isValidGameProgress(obj.progress) &&
    Array.isArray(obj.dailyChallenges) &&
    obj.dailyChallenges.every(isValidDailyChallenge) &&
    typeof obj.lastPlayedDate === 'string'
  );
}

function isValidLeaderboardEntry(data: unknown): data is LeaderboardEntry {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.name === 'string' &&
    typeof obj.correctCount === 'number' &&
    typeof obj.totalTime === 'number' &&
    typeof obj.score === 'number' &&
    typeof obj.date === 'string'
  );
}

function isValidPlayerInfo(data: unknown): data is PlayerInfo {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.name === 'string';
}

function isValidMusicType(data: unknown): data is MusicType {
  if (typeof data !== 'string') return false;
  return MUSIC_TYPES.some(t => t.id === data);
}

export function loadGame(): GameSave {
  if (typeof window === 'undefined') {
    return defaultSave;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (isValidGameSave(parsed)) {
        return parsed;
      }
      console.warn('Invalid game save data, using default');
    }
  } catch (error) {
    console.error('Failed to load game save:', error);
  }

  return defaultSave;
}

export function saveGame(save: GameSave): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch (error) {
    console.error('Failed to save game:', error);
  }
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getTodayChallenge(save: GameSave): DailyChallenge | undefined {
  const today = getTodayDate();
  return save.dailyChallenges.find(c => c.date === today);
}

export function updateDailyChallenge(
  save: GameSave,
  challenge: DailyChallenge
): GameSave {
  const existingIndex = save.dailyChallenges.findIndex(c => c.date === challenge.date);

  if (existingIndex >= 0) {
    save.dailyChallenges[existingIndex] = challenge;
  } else {
    save.dailyChallenges.push(challenge);
  }

  return save;
}

export function calculateTotalScore(save: GameSave): number {
  return save.progress.totalCorrect * 10 +
    save.dailyChallenges.filter(c => c.rewardClaimed).length * 50;
}

export function getUnlockedStickers(save: GameSave): string[] {
  return save.progress.stickers;
}

export function getUnlockedHats(save: GameSave): string[] {
  return save.progress.hats;
}

export function unlockSticker(save: GameSave, stickerId: string): GameSave {
  if (!save.progress.stickers.includes(stickerId)) {
    save.progress.stickers.push(stickerId);
  }
  return save;
}

export function unlockHat(save: GameSave, hatId: string): GameSave {
  if (!save.progress.hats.includes(hatId)) {
    save.progress.hats.push(hatId);
  }
  return save;
}

export function equipSticker(save: GameSave, stickerId: string | null): GameSave {
  save.progress.equippedSticker = stickerId;
  return save;
}

export function equipHat(save: GameSave, hatId: string | null): GameSave {
  save.progress.equippedHat = hatId;
  return save;
}

export function resetGame(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
}

// 玩家資訊
export function getPlayerInfo(): PlayerInfo | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const saved = localStorage.getItem(PLAYER_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (isValidPlayerInfo(parsed)) {
        return parsed;
      }
      console.warn('Invalid player info data');
    }
  } catch (error) {
    console.error('Failed to load player info:', error);
  }

  return null;
}

export function savePlayerInfo(info: PlayerInfo): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(PLAYER_KEY, JSON.stringify(info));
  } catch (error) {
    console.error('Failed to save player info:', error);
  }
}

// 排行榜
export function getLeaderboard(): LeaderboardEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const saved = localStorage.getItem(LEADERBOARD_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.every(isValidLeaderboardEntry)) {
        return parsed;
      }
      console.warn('Invalid leaderboard data');
    }
  } catch (error) {
    console.error('Failed to load leaderboard:', error);
  }

  return [];
}

export function saveLeaderboard(entries: LeaderboardEntry[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Failed to save leaderboard:', error);
  }
}

// 計算綜合分數：正確題數 * 100 - 總秒數 * 2
export function calculateGameScore(correctCount: number, totalTime: number): number {
  return Math.max(0, correctCount * 100 - totalTime * 2);
}

// 新增排行榜記錄
export function addLeaderboardEntry(
  name: string,
  correctCount: number,
  totalTime: number
): LeaderboardEntry[] {
  const entries = getLeaderboard();
  const score = calculateGameScore(correctCount, totalTime);
  const today = getTodayDate();

  const newEntry: LeaderboardEntry = {
    name,
    correctCount,
    totalTime,
    score,
    date: today,
  };

  entries.push(newEntry);

  // 按分數排序，取前 10 名
  entries.sort((a, b) => b.score - a.score);
  const top10 = entries.slice(0, 10);

  saveLeaderboard(top10);
  return top10;
}

// 音樂偏好
export function getMusicPreference(): MusicType {
  if (typeof window === 'undefined') {
    return 'cute';
  }

  try {
    const saved = localStorage.getItem(MUSIC_KEY);
    if (saved && isValidMusicType(saved)) {
      return saved;
    }
  } catch (error) {
    console.error('Failed to load music preference:', error);
  }

  return 'cute';
}

export function saveMusicPreference(type: MusicType): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(MUSIC_KEY, type);
  } catch (error) {
    console.error('Failed to save music preference:', error);
  }
}
