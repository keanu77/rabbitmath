// UI 元件工廠 - 統一的 UI 元件建立工具

import Phaser from 'phaser';
import { BUNNY_COLORS } from './config';
import { SPACING, RADIUS, DURATION, DECORATION_CONFIG, BUTTON_SIZES, CARD_SIZES } from './designTokens';

// 按鈕配置類型
interface ButtonConfig {
  x: number;
  y: number;
  width?: number;
  height?: number;
  text: string;
  fontSize?: string;
  bgColor?: number;
  textColor?: string;
  onClick?: () => void;
  size?: 'large' | 'medium' | 'small' | 'tiny';
}

// 面板配置類型
interface PanelConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  bgColor?: number;
  alpha?: number;
  cornerRadius?: number;
}

// 物品卡片配置類型
interface ItemCardConfig {
  x: number;
  y: number;
  emoji: string;
  name: string;
  isLocked: boolean;
  isEquipped: boolean;
  onClick?: () => void;
}

// 背景裝飾表情列表
const DECORATION_EMOJIS = ['🐰', '🥕', '💗', '⭐', '🌸', '🎀', '🌈', '🍀', '✨', '💫'];

export class UIFactory {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 建立帶陰影和按壓效果的按鈕
   */
  createButton(config: ButtonConfig): Phaser.GameObjects.Container {
    const {
      x,
      y,
      text,
      onClick,
      size = 'medium',
      bgColor = BUNNY_COLORS.pink,
      textColor = '#ffffff',
      fontSize = '28px',
    } = config;

    // 根據 size 取得尺寸
    const dimensions = config.width && config.height
      ? { width: config.width, height: config.height }
      : BUTTON_SIZES[size];

    const { width, height } = dimensions;

    const container = this.scene.add.container(x, y);

    // 陰影
    const shadow = this.scene.add.graphics();
    shadow.fillStyle(BUNNY_COLORS.shadowPink, 0.4);
    shadow.fillRoundedRect(-width / 2 + 4, -height / 2 + 4, width, height, RADIUS.full);
    container.add(shadow);

    // 按鈕背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(bgColor, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, RADIUS.full);
    container.add(bg);

    // 按鈕文字
    const buttonText = this.scene.add.text(0, 0, text, {
      fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
      fontSize: fontSize,
      color: textColor,
      stroke: '#ff69b4',
      strokeThickness: 2,
    }).setOrigin(0.5);
    container.add(buttonText);

    // 互動區域
    const hitArea = this.scene.add.rectangle(0, 0, width, height, 0xffffff, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    // 按壓效果
    hitArea.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        y: y + 2,
        duration: DURATION.instant,
        ease: 'Power2',
      });
    });

    hitArea.on('pointerup', () => {
      this.scene.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        y: y,
        duration: DURATION.instant,
        ease: 'Power2',
        onComplete: () => {
          if (onClick) onClick();
        },
      });
    });

    hitArea.on('pointerout', () => {
      this.scene.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        y: y,
        duration: DURATION.instant,
        ease: 'Power2',
      });
    });

    return container;
  }

  /**
   * 建立帶陰影的面板
   */
  createPanel(config: PanelConfig): Phaser.GameObjects.Container {
    const {
      x,
      y,
      width,
      height,
      bgColor = BUNNY_COLORS.bgPanel,
      alpha = 0.95,
      cornerRadius = RADIUS.lg,
    } = config;

    const container = this.scene.add.container(x, y);

    // 陰影
    const shadow = this.scene.add.graphics();
    shadow.fillStyle(BUNNY_COLORS.shadowDark, 0.15);
    shadow.fillRoundedRect(-width / 2 + 6, -height / 2 + 6, width, height, cornerRadius);
    container.add(shadow);

    // 面板背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(bgColor, alpha);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, cornerRadius);
    container.add(bg);

    // 邊框
    const border = this.scene.add.graphics();
    border.lineStyle(2, BUNNY_COLORS.softPink, 1);
    border.strokeRoundedRect(-width / 2, -height / 2, width, height, cornerRadius);
    container.add(border);

    return container;
  }

  /**
   * 建立物品卡片（用於收藏頁面）
   */
  createItemCard(config: ItemCardConfig): Phaser.GameObjects.Container {
    const {
      x,
      y,
      emoji,
      name,
      isLocked,
      isEquipped,
      onClick,
    } = config;

    const { width, height } = CARD_SIZES.item;
    const container = this.scene.add.container(x, y);

    // 卡片背景
    const bg = this.scene.add.graphics();
    if (isLocked) {
      bg.fillStyle(0xcccccc, 0.5);
    } else if (isEquipped) {
      bg.fillStyle(BUNNY_COLORS.gold, 0.3);
    } else {
      bg.fillStyle(BUNNY_COLORS.white, 1);
    }
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);
    container.add(bg);

    // 邊框
    const border = this.scene.add.graphics();
    if (isEquipped) {
      border.lineStyle(3, BUNNY_COLORS.gold, 1);
    } else {
      border.lineStyle(2, BUNNY_COLORS.softPink, 1);
    }
    border.strokeRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);
    container.add(border);

    // 表情圖標
    const emojiText = this.scene.add.text(0, -15, isLocked ? '🔒' : emoji, {
      fontSize: '36px',
    }).setOrigin(0.5);
    container.add(emojiText);

    // 名稱
    const nameText = this.scene.add.text(0, 30, isLocked ? '???' : name, {
      fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
      fontSize: '14px',
      color: isLocked ? '#999999' : '#ff69b4',
    }).setOrigin(0.5);
    container.add(nameText);

    // 互動
    if (!isLocked && onClick) {
      const hitArea = this.scene.add.rectangle(0, 0, width, height, 0xffffff, 0);
      hitArea.setInteractive({ useHandCursor: true });
      container.add(hitArea);

      hitArea.on('pointerdown', () => {
        this.scene.tweens.add({
          targets: container,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: DURATION.instant,
        });
      });

      hitArea.on('pointerup', () => {
        this.scene.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: DURATION.instant,
          onComplete: onClick,
        });
      });

      hitArea.on('pointerout', () => {
        this.scene.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: DURATION.instant,
        });
      });
    }

    return container;
  }

  /**
   * 建立統一的背景裝飾
   */
  createBackgroundDecorations(): Phaser.GameObjects.Text[] {
    const decorations: Phaser.GameObjects.Text[] = [];
    const { width, height } = this.scene.scale;

    for (let i = 0; i < DECORATION_CONFIG.count; i++) {
      const emoji = DECORATION_EMOJIS[i % DECORATION_EMOJIS.length];
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Phaser.Math.Between(DECORATION_CONFIG.sizeRange[0], DECORATION_CONFIG.sizeRange[1]);
      const alpha = Phaser.Math.FloatBetween(DECORATION_CONFIG.alphaRange[0], DECORATION_CONFIG.alphaRange[1]);

      const decoration = this.scene.add.text(x, y, emoji, {
        fontSize: `${size}px`,
      }).setAlpha(alpha);

      // 閃爍動畫
      const duration = Phaser.Math.Between(
        DECORATION_CONFIG.animationDuration[0],
        DECORATION_CONFIG.animationDuration[1]
      );
      this.scene.tweens.add({
        targets: decoration,
        alpha: alpha * 0.5,
        duration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      decorations.push(decoration);
    }

    return decorations;
  }

  /**
   * 建立選項按鈕（用於遊戲場景）
   */
  createOptionButton(
    x: number,
    y: number,
    text: string,
    onClick?: () => void
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    const { width, height } = BUTTON_SIZES.small;

    // 陰影
    const shadow = this.scene.add.graphics();
    shadow.fillStyle(BUNNY_COLORS.shadowPink, 0.3);
    shadow.fillRoundedRect(-width / 2 + 3, -height / 2 + 3, width, height, RADIUS.md);
    container.add(shadow);

    // 背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(BUNNY_COLORS.white, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);
    container.add(bg);

    // 邊框
    const border = this.scene.add.graphics();
    border.lineStyle(3, BUNNY_COLORS.pink, 1);
    border.strokeRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);
    container.add(border);

    // 文字
    const buttonText = this.scene.add.text(0, 0, text, {
      fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
      fontSize: '40px',
      color: '#ff69b4',
      stroke: '#ffffff',
      strokeThickness: 2,
    }).setOrigin(0.5);
    container.add(buttonText);

    // 互動區域
    const hitArea = this.scene.add.rectangle(0, 0, width, height, 0xffffff, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    // 按壓效果
    hitArea.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: DURATION.instant,
      });
    });

    hitArea.on('pointerup', () => {
      this.scene.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: DURATION.instant,
        onComplete: () => {
          if (onClick) onClick();
        },
      });
    });

    hitArea.on('pointerout', () => {
      this.scene.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: DURATION.instant,
      });
    });

    // 儲存參考以便更新
    container.setData('bg', bg);
    container.setData('border', border);
    container.setData('text', buttonText);
    container.setData('hitArea', hitArea);

    return container;
  }

  /**
   * 更新選項按鈕狀態（正確/錯誤）
   */
  updateOptionButtonState(
    container: Phaser.GameObjects.Container,
    state: 'correct' | 'incorrect' | 'default'
  ): void {
    const bg = container.getData('bg') as Phaser.GameObjects.Graphics;
    const border = container.getData('border') as Phaser.GameObjects.Graphics;
    const { width, height } = BUTTON_SIZES.small;

    bg.clear();
    border.clear();

    let bgColor = BUNNY_COLORS.white;
    let borderColor = BUNNY_COLORS.pink;

    if (state === 'correct') {
      bgColor = BUNNY_COLORS.mint;
      borderColor = 0x22c55e; // 綠色
    } else if (state === 'incorrect') {
      bgColor = 0xfecaca; // 淡紅
      borderColor = 0xef4444; // 紅色
    }

    bg.fillStyle(bgColor, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);

    border.lineStyle(3, borderColor, 1);
    border.strokeRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);
  }
}
