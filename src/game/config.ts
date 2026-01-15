// Phaser 遊戲配置

import Phaser from 'phaser';
import { NameInputScene } from './scenes/NameInput';
import { MainMenuScene } from './scenes/MainMenu';
import { GameScene } from './scenes/GameScene';
import { DailyChallengeScene } from './scenes/DailyChallenge';
import { CollectionScene } from './scenes/Collection';
import { LeaderboardScene } from './scenes/Leaderboard';

export const createGameConfig = (parent: string): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent,
  backgroundColor: '#fff5f8', // 淡粉色背景
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
  },
  scene: [NameInputScene, MainMenuScene, GameScene, DailyChallengeScene, CollectionScene, LeaderboardScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
});

// 兔子風格顏色配置
export const BUNNY_COLORS = {
  softPink: 0xffb6c1,      // 淺粉紅
  pink: 0xff69b4,          // 粉紅
  hotPink: 0xff1493,       // 亮粉紅
  primaryPressed: 0xe91e84, // 按壓狀態色
  peach: 0xffcba4,         // 蜜桃色
  cream: 0xfffaf0,         // 奶油白
  white: 0xffffff,         // 白色
  bgPanel: 0xfff0f5,       // 面板背景
  lightBlue: 0x87ceeb,     // 淺藍
  mint: 0x98fb98,          // 薄荷綠
  lavender: 0xe6e6fa,      // 薰衣草紫
  gold: 0xffd700,          // 金色
  goldDark: 0xe6a800,      // 深金色（提高對比度）
  coral: 0xff7f50,         // 珊瑚色
  brown: 0x8b4513,         // 棕色（胡蘿蔔莖）
  shadowPink: 0xffa0b4,    // 粉色陰影
  shadowDark: 0x333333,    // 深色陰影
};

// 字體配置
export const FONT_CONFIG = {
  title: {
    fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
    fontSize: '48px',
    color: '#ff69b4',
    stroke: '#ffffff',
    strokeThickness: 4,
  },
  subtitle: {
    fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
    fontSize: '32px',
    color: '#ff69b4',
    stroke: '#ffffff',
    strokeThickness: 3,
  },
  button: {
    fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
    fontSize: '28px',
    color: '#ffffff',
    stroke: '#ff69b4',
    strokeThickness: 2,
  },
  question: {
    fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
    fontSize: '64px',
    color: '#ff69b4',
    stroke: '#ffffff',
    strokeThickness: 4,
  },
  hint: {
    fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
    fontSize: '18px',
    color: '#ff69b4',
    stroke: '#ffffff',
    strokeThickness: 2,
  },
  score: {
    fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
    fontSize: '28px',
    color: '#e6a800',
    stroke: '#ffffff',
    strokeThickness: 3,
    shadow: {
      offsetX: 2,
      offsetY: 2,
      color: '#333333',
      blur: 4,
      fill: true,
    },
  },
};
