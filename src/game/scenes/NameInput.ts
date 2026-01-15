// 輸入名字場景 - 支援手機虛擬鍵盤

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
  private htmlInput: HTMLInputElement | null = null;

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

    // 創建隱藏的 HTML input（支援手機虛擬鍵盤）
    this.createHtmlInput();

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
      '點擊上方輸入框輸入名字',
      {
        ...FONT_CONFIG.hint,
        fontSize: '18px',
        color: '#999999',
      }
    );
    hint.setOrigin(0.5);

    // 輸入框點擊區域 - 點擊後聚焦到 HTML input
    const inputHitArea = this.add.rectangle(width / 2, height / 2, 300, 60, 0x000000, 0);
    inputHitArea.setInteractive({ useHandCursor: true });
    inputHitArea.on('pointerdown', () => {
      this.focusInput();
    });

    // 確認按鈕
    this.createButton(
      width / 2,
      height * 0.75,
      '✅ 確認開始',
      () => {
        this.submitName();
      }
    );

    // 桌面鍵盤輸入（保留相容性）
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      // 如果 HTML input 已聚焦，讓它處理
      if (document.activeElement === this.htmlInput) {
        return;
      }

      if (event.key === 'Backspace') {
        this.currentName = this.currentName.slice(0, -1);
      } else if (event.key === 'Enter') {
        this.submitName();
      } else if (event.key.length === 1 && this.currentName.length < 10) {
        this.currentName += event.key;
      }
      this.updateNameDisplay();
      this.syncToHtmlInput();
    });

    // 點擊畫面任意處來啟動音樂
    this.input.once('pointerdown', () => {
      if (!bgMusic.getIsPlaying()) {
        bgMusic.start();
      }
    });
  }

  private createHtmlInput(): void {
    // 移除舊的 input（如果存在）
    this.removeHtmlInput();

    // 創建隱藏的 HTML input
    this.htmlInput = document.createElement('input');
    this.htmlInput.type = 'text';
    this.htmlInput.maxLength = 10;
    this.htmlInput.value = this.currentName;
    this.htmlInput.autocomplete = 'off';
    this.htmlInput.autocapitalize = 'off';

    // 樣式 - 放在遊戲畫面上方但透明
    this.htmlInput.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 280px;
      height: 50px;
      font-size: 24px;
      text-align: center;
      border: none;
      background: transparent;
      color: transparent;
      caret-color: transparent;
      outline: none;
      z-index: 1000;
      -webkit-appearance: none;
    `;

    document.body.appendChild(this.htmlInput);

    // 監聽輸入事件
    this.htmlInput.addEventListener('input', () => {
      if (this.htmlInput) {
        this.currentName = this.htmlInput.value.slice(0, 10);
        this.updateNameDisplay();
      }
    });

    // 監聯 Enter 鍵
    this.htmlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.submitName();
      }
    });
  }

  private focusInput(): void {
    if (this.htmlInput) {
      this.htmlInput.focus();
      // iOS Safari 需要額外處理
      this.htmlInput.click();
    }
  }

  private syncToHtmlInput(): void {
    if (this.htmlInput) {
      this.htmlInput.value = this.currentName;
    }
  }

  private removeHtmlInput(): void {
    if (this.htmlInput && this.htmlInput.parentNode) {
      this.htmlInput.parentNode.removeChild(this.htmlInput);
      this.htmlInput = null;
    }
  }

  private submitName(): void {
    if (this.currentName.trim().length > 0) {
      savePlayerInfo({ name: this.currentName.trim() });
      bgMusic.playClickSound();
      this.removeHtmlInput();
      this.scene.start('MainMenu');
    }
  }

  shutdown(): void {
    this.removeHtmlInput();
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
