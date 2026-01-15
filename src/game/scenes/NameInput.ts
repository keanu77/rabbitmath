// 輸入名字場景

import Phaser from 'phaser';
import { BUNNY_COLORS, FONT_CONFIG } from '../config';
import { DECORATION_CONFIG, RADIUS } from '../designTokens';
import { getPlayerInfo, savePlayerInfo } from '@/lib/storage';
import { bgMusic } from '@/lib/audio';

export class NameInputScene extends Phaser.Scene {
  private nameText!: Phaser.GameObjects.Text;
  private currentName: string = '';
  private cursorVisible: boolean = true;
  private cursorTimer!: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'NameInputScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // 背景
    this.createBackground(width, height);

    // 標題
    const title = this.add.text(
      width / 2,
      height / 4,
      '🐰 請輸入你的名字 🐰',
      {
        ...FONT_CONFIG.title,
        fontSize: '32px',
      }
    );
    title.setOrigin(0.5);

    // 輸入框背景
    const inputBg = this.add.graphics();
    inputBg.fillStyle(BUNNY_COLORS.white, 0.9);
    inputBg.fillRoundedRect(width / 2 - 150, height / 2 - 30, 300, 60, 15);
    inputBg.lineStyle(3, BUNNY_COLORS.pink);
    inputBg.strokeRoundedRect(width / 2 - 150, height / 2 - 30, 300, 60, 15);

    // 名字顯示
    this.nameText = this.add.text(
      width / 2,
      height / 2,
      '',
      {
        fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
        fontSize: '28px',
        color: '#ff69b4',
      }
    );
    this.nameText.setOrigin(0.5);

    // 載入已存的名字
    const savedPlayer = getPlayerInfo();
    if (savedPlayer) {
      this.currentName = savedPlayer.name;
    }

    // 游標閃爍
    this.cursorTimer = this.time.addEvent({
      delay: 500,
      callback: () => {
        this.cursorVisible = !this.cursorVisible;
        this.updateNameDisplay();
      },
      loop: true,
    });

    this.updateNameDisplay();

    // 提示文字
    const hint = this.add.text(
      width / 2,
      height / 2 + 60,
      '請用鍵盤輸入（支援中英文）',
      {
        ...FONT_CONFIG.hint,
        fontSize: '18px',
        color: '#999999',
      }
    );
    hint.setOrigin(0.5);

    // 確認按鈕
    this.createButton(
      width / 2,
      height * 0.75,
      '✅ 確認開始',
      () => {
        if (this.currentName.trim().length > 0) {
          savePlayerInfo({ name: this.currentName.trim() });
          bgMusic.playClickSound();
          this.scene.start('MainMenu');
        }
      }
    );

    // 鍵盤輸入
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Backspace') {
        this.currentName = this.currentName.slice(0, -1);
      } else if (event.key === 'Enter') {
        if (this.currentName.trim().length > 0) {
          savePlayerInfo({ name: this.currentName.trim() });
          bgMusic.playClickSound();
          this.scene.start('MainMenu');
        }
      } else if (event.key.length === 1 && this.currentName.length < 10) {
        this.currentName += event.key;
      }
      this.updateNameDisplay();
    });

    // 點擊畫面任意處來啟動音樂
    this.input.once('pointerdown', () => {
      if (!bgMusic.getIsPlaying()) {
        bgMusic.start();
      }
    });
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
    const decorEmojis = ['💗', '🌸', '✨', '🥕', '🦋', '🐰', '⭐', '🌈', '💫', '🍀'];
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

  private updateNameDisplay(): void {
    const cursor = this.cursorVisible ? '|' : '';
    this.nameText.setText(this.currentName + cursor);
  }

  private createButton(x: number, y: number, text: string, callback: () => void): void {
    const buttonWidth = 240;
    const buttonHeight = 50;
    const cornerRadius = RADIUS.full;

    // 容器
    const container = this.add.container(x, y);

    // 陰影效果
    const shadow = this.add.graphics();
    shadow.fillStyle(BUNNY_COLORS.shadowPink, 0.4);
    shadow.fillRoundedRect(-buttonWidth / 2 + 4, -buttonHeight / 2 + 4, buttonWidth, buttonHeight, cornerRadius);
    container.add(shadow);

    const bg = this.add.graphics();
    bg.fillStyle(BUNNY_COLORS.pink, 0.9);
    bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
    bg.lineStyle(3, BUNNY_COLORS.white);
    bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
    container.add(bg);

    const buttonText = this.add.text(0, 0, text, {
      ...FONT_CONFIG.button,
      fontSize: '24px',
    });
    buttonText.setOrigin(0.5);
    container.add(buttonText);

    const hitArea = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(BUNNY_COLORS.hotPink, 0.95);
      bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
      bg.lineStyle(3, BUNNY_COLORS.white);
      bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
      container.setScale(1.02);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(BUNNY_COLORS.pink, 0.9);
      bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
      bg.lineStyle(3, BUNNY_COLORS.white);
      bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
      container.setScale(1);
    });

    hitArea.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        ease: 'Power2',
        onComplete: () => {
          this.tweens.add({
            targets: container,
            scaleX: 1,
            scaleY: 1,
            duration: 100,
            ease: 'Power2',
          });
          callback();
        },
      });
    });
  }
}
