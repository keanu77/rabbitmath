// 排行榜場景

import Phaser from 'phaser';
import { BUNNY_COLORS, FONT_CONFIG } from '../config';
import { DECORATION_CONFIG, RADIUS } from '../designTokens';
import { getLeaderboard } from '@/lib/storage';
import { bgMusic } from '@/lib/audio';
import { LeaderboardEntry } from '@/types/game';

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LeaderboardScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // 背景
    this.createBackground(width, height);

    // 返回按鈕
    this.createBackButton();

    // 標題
    const title = this.add.text(
      width / 2,
      50,
      '🏆 排行榜 🏆',
      {
        ...FONT_CONFIG.title,
        fontSize: '36px',
      }
    );
    title.setOrigin(0.5);

    // 排行榜內容
    this.createLeaderboardContent(width, height);
  }

  private createBackground(width: number, height: number): void {
    const graphics = this.add.graphics();

    for (let i = 0; i < height; i++) {
      const ratio = i / height;
      const r = Math.floor(255 * (1 - ratio * 0.1));
      const g = Math.floor(245 - ratio * 20);
      const b = Math.floor(248 - ratio * 10);
      graphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      graphics.fillRect(0, i, width, 1);
    }

    // 裝飾（使用統一配置）
    const decorEmojis = ['🏆', '⭐', '✨', '🎖️', '🥇', '💫', '🌟', '🐰', '💗', '🌸'];
    for (let i = 0; i < DECORATION_CONFIG.count; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const emoji = decorEmojis[i % decorEmojis.length];
      const size = Phaser.Math.Between(DECORATION_CONFIG.sizeRange[0], DECORATION_CONFIG.sizeRange[1]);
      const alpha = Phaser.Math.FloatBetween(DECORATION_CONFIG.alphaRange[0], DECORATION_CONFIG.alphaRange[1]);

      const star = this.add.text(x, y, emoji, {
        fontSize: `${size}px`,
      });
      star.setAlpha(alpha);

      // 閃爍動畫
      const duration = Phaser.Math.Between(
        DECORATION_CONFIG.animationDuration[0],
        DECORATION_CONFIG.animationDuration[1]
      );
      this.tweens.add({
        targets: star,
        alpha: alpha * 0.5,
        duration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private createBackButton(): void {
    const backBtn = this.add.text(20, 20, '← 返回', {
      ...FONT_CONFIG.hint,
      color: '#ff69b4',
    });
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setColor('#ff1493'));
    backBtn.on('pointerout', () => backBtn.setColor('#ff69b4'));
    backBtn.on('pointerdown', () => {
      bgMusic.playClickSound();
      this.scene.start('MainMenu');
    });
  }

  private createLeaderboardContent(width: number, height: number): void {
    const entries = getLeaderboard();

    // 表頭背景
    const headerBg = this.add.graphics();
    headerBg.fillStyle(BUNNY_COLORS.pink, 0.8);
    headerBg.fillRoundedRect(width / 2 - 350, 95, 700, 40, 10);

    // 表頭
    const headers = ['名次', '名字', '正確', '時間', '分數'];
    const headerX = [width / 2 - 280, width / 2 - 150, width / 2, width / 2 + 120, width / 2 + 250];

    headers.forEach((header, i) => {
      const text = this.add.text(headerX[i], 115, header, {
        ...FONT_CONFIG.button,
        fontSize: '20px',
      });
      text.setOrigin(0.5);
    });

    if (entries.length === 0) {
      // 無記錄
      const noData = this.add.text(
        width / 2,
        height / 2,
        '🐰 還沒有記錄喔！\n快去挑戰吧！',
        {
          ...FONT_CONFIG.subtitle,
          align: 'center',
          lineSpacing: 10,
        }
      );
      noData.setOrigin(0.5);
    } else {
      // 顯示排行榜
      entries.forEach((entry, index) => {
        this.createLeaderboardRow(
          width,
          150 + index * 45,
          index + 1,
          entry,
          headerX
        );
      });
    }
  }

  private createLeaderboardRow(
    width: number,
    y: number,
    rank: number,
    entry: LeaderboardEntry,
    headerX: number[]
  ): void {
    // 行背景
    const rowBg = this.add.graphics();
    const bgColor = rank <= 3 ? BUNNY_COLORS.softPink : BUNNY_COLORS.cream;
    rowBg.fillStyle(bgColor, 0.7);
    rowBg.fillRoundedRect(width / 2 - 350, y - 15, 700, 40, 8);

    // 獎牌
    let rankDisplay: string;
    if (rank === 1) {
      rankDisplay = '🥇';
    } else if (rank === 2) {
      rankDisplay = '🥈';
    } else if (rank === 3) {
      rankDisplay = '🥉';
    } else {
      rankDisplay = String(rank);
    }

    const textStyle = {
      fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
      fontSize: '20px',
      color: '#ff69b4',
    };

    // 名次
    const rankText = this.add.text(headerX[0], y, rankDisplay, {
      ...textStyle,
      fontSize: rank <= 3 ? '24px' : '20px',
    });
    rankText.setOrigin(0.5);

    // 名字
    const nameText = this.add.text(headerX[1], y, entry.name, textStyle);
    nameText.setOrigin(0.5);

    // 正確數
    const correctText = this.add.text(headerX[2], y, `${entry.correctCount}/10`, textStyle);
    correctText.setOrigin(0.5);

    // 時間
    const timeText = this.add.text(headerX[3], y, `${entry.totalTime}秒`, textStyle);
    timeText.setOrigin(0.5);

    // 分數（使用深金色提高對比度）
    const scoreText = this.add.text(headerX[4], y, String(entry.score), {
      ...textStyle,
      color: '#e6a800',
      fontSize: '22px',
      stroke: '#ffffff',
      strokeThickness: 2,
    });
    scoreText.setOrigin(0.5);
  }
}
