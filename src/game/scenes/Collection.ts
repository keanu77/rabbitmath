// 收藏與裝扮場景 - 兔子風格

import Phaser from 'phaser';
import { BUNNY_COLORS, FONT_CONFIG } from '../config';
import { DECORATION_CONFIG, RADIUS } from '../designTokens';
import { PLAIN_TEXT, STICKERS, HATS } from '@/lib/gameData';
import { bgMusic } from '@/lib/audio';
import { loadGame, saveGame, equipSticker, equipHat, calculateTotalScore } from '@/lib/storage';
import { GameSave } from '@/types/game';

export class CollectionScene extends Phaser.Scene {
  private gameSave!: GameSave;
  private currentTab: 'stickers' | 'hats' = 'stickers';
  private itemContainer!: Phaser.GameObjects.Container;
  private previewCharacter!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'CollectionScene' });
  }

  init(): void {
    this.gameSave = loadGame();
  }

  create(): void {
    const { width, height } = this.scale;

    // 背景
    this.createBackground(width, height);

    // 返回按鈕
    this.createBackButton();

    // 標題
    this.createTitle(width);

    // 分數顯示
    this.createScoreDisplay(width);

    // 角色預覽
    this.createCharacterPreview(width, height);

    // 標籤切換
    this.createTabs(width, height);

    // 物品容器
    this.itemContainer = this.add.container(0, 0);
    this.showItems();
  }

  private createBackground(width: number, height: number): void {
    const graphics = this.add.graphics();

    // 柔和的粉色漸層背景
    for (let i = 0; i < height; i++) {
      const ratio = i / height;
      const r = Math.floor(255 * (1 - ratio * 0.1));
      const g = Math.floor(245 - ratio * 20);
      const b = Math.floor(248 - ratio * 10);
      graphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      graphics.fillRect(0, i, width, 1);
    }

    // 兔子風格裝飾（使用統一配置）
    const decorEmojis = ['💗', '🌸', '✨', '💫', '🥕', '🦋', '🐰', '⭐', '🌈', '🍀'];
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
    const backBtn = this.add.text(20, 20, `← ${PLAIN_TEXT.back}`, {
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

  private createTitle(width: number): void {
    const title = this.add.text(
      width / 2,
      40,
      `👗 ${PLAIN_TEXT.dressUp} 👗`,
      {
        ...FONT_CONFIG.title,
        fontSize: '32px',
      }
    );
    title.setOrigin(0.5);
  }

  private createScoreDisplay(width: number): void {
    const score = calculateTotalScore(this.gameSave);
    const scoreText = this.add.text(
      width - 20,
      20,
      `🥕 ${score}`,
      {
        ...FONT_CONFIG.hint,
        color: '#ff69b4',
      }
    );
    scoreText.setOrigin(1, 0);
  }

  private createCharacterPreview(width: number, height: number): void {
    this.previewCharacter = this.add.container(width / 6, height / 2 - 30);

    // 預覽背景 - 柔和粉色
    const previewBg = this.add.graphics();
    previewBg.fillStyle(BUNNY_COLORS.softPink, 0.7);
    previewBg.fillRoundedRect(-80, -100, 160, 200, 15);
    previewBg.lineStyle(3, BUNNY_COLORS.white);
    previewBg.strokeRoundedRect(-80, -100, 160, 200, 15);
    this.previewCharacter.add(previewBg);

    // 角色
    this.updateCharacterPreview();
  }

  private updateCharacterPreview(): void {
    // 清除舊的角色元素（保留背景）
    while (this.previewCharacter.length > 1) {
      const child = this.previewCharacter.getAt(this.previewCharacter.length - 1);
      if (child) {
        child.destroy();
        this.previewCharacter.remove(child);
      }
    }

    // 帽子
    if (this.gameSave.progress.equippedHat) {
      const hat = HATS.find(h => h.id === this.gameSave.progress.equippedHat);
      if (hat) {
        const hatText = this.add.text(0, -60, hat.emoji, { fontSize: '48px' });
        hatText.setOrigin(0.5);
        this.previewCharacter.add(hatText);
      }
    }

    // 角色主體 - 改為兔子
    const character = this.add.text(0, 0, '🐰', { fontSize: '64px' });
    character.setOrigin(0.5);
    this.previewCharacter.add(character);

    // 貼紙
    if (this.gameSave.progress.equippedSticker) {
      const sticker = STICKERS.find(s => s.id === this.gameSave.progress.equippedSticker);
      if (sticker) {
        const stickerText = this.add.text(30, 30, sticker.emoji, { fontSize: '32px' });
        stickerText.setOrigin(0.5);
        this.previewCharacter.add(stickerText);
      }
    }

    // 標籤
    const label = this.add.text(0, 80, '預覽', {
      ...FONT_CONFIG.hint,
      fontSize: '18px',
    });
    label.setOrigin(0.5);
    this.previewCharacter.add(label);
  }

  private createTabs(width: number, height: number): void {
    const tabY = 100;
    const tabWidth = 150;
    const tabSpacing = 20;
    const startX = width / 2 + 80;

    // 貼紙標籤
    this.createTab(
      startX,
      tabY,
      `🎀 ${PLAIN_TEXT.stickers}`,
      tabWidth,
      () => {
        this.currentTab = 'stickers';
        this.showItems();
      },
      this.currentTab === 'stickers'
    );

    // 帽子標籤
    this.createTab(
      startX + tabWidth + tabSpacing,
      tabY,
      `🐰 ${PLAIN_TEXT.hats}`,
      tabWidth,
      () => {
        this.currentTab = 'hats';
        this.showItems();
      },
      this.currentTab === 'hats'
    );
  }

  private createTab(
    x: number,
    y: number,
    text: string,
    width: number,
    callback: () => void,
    isActive: boolean
  ): void {
    const bg = this.add.graphics();
    if (isActive) {
      bg.fillStyle(BUNNY_COLORS.hotPink, 0.9);
    } else {
      bg.fillStyle(BUNNY_COLORS.pink, 0.6);
    }
    bg.fillRoundedRect(x - width / 2, y - 20, width, 40, 10);
    bg.lineStyle(2, BUNNY_COLORS.white);
    bg.strokeRoundedRect(x - width / 2, y - 20, width, 40, 10);

    const tabText = this.add.text(x, y, text, {
      ...FONT_CONFIG.button,
      fontSize: '20px',
    });
    tabText.setOrigin(0.5);

    const hitArea = this.add.rectangle(x, y, width, 40, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      bgMusic.playClickSound();
      callback();
      this.scene.restart();
    });
  }

  private showItems(): void {
    this.itemContainer.removeAll(true);

    const { width, height } = this.scale;
    const items = this.currentTab === 'stickers' ? STICKERS : HATS;
    const unlockedIds = this.currentTab === 'stickers'
      ? this.gameSave.progress.stickers
      : this.gameSave.progress.hats;
    const equippedId = this.currentTab === 'stickers'
      ? this.gameSave.progress.equippedSticker
      : this.gameSave.progress.equippedHat;

    const startX = width / 2 + 80;
    const startY = 160;
    const itemWidth = 100;
    const itemHeight = 120;
    const cols = 4;
    const spacing = 15;

    items.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (itemWidth + spacing);
      const y = startY + row * (itemHeight + spacing);

      this.createItemCard(
        x,
        y,
        item,
        unlockedIds.includes(item.id),
        equippedId === item.id,
        itemWidth,
        itemHeight
      );
    });
  }

  private createItemCard(
    x: number,
    y: number,
    item: { id: string; emoji: string; nameWithZhuyin: string },
    isUnlocked: boolean,
    isEquipped: boolean,
    width: number,
    height: number
  ): void {
    const container = this.add.container(x, y);
    this.itemContainer.add(container);

    // 背景
    const bg = this.add.graphics();
    if (isEquipped) {
      bg.fillStyle(BUNNY_COLORS.hotPink, 0.9);
      bg.lineStyle(3, BUNNY_COLORS.gold);
    } else if (isUnlocked) {
      bg.fillStyle(BUNNY_COLORS.pink, 0.7);
      bg.lineStyle(2, BUNNY_COLORS.white);
    } else {
      bg.fillStyle(BUNNY_COLORS.lavender, 0.4);
      bg.lineStyle(2, BUNNY_COLORS.softPink);
    }
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    container.add(bg);

    // Emoji
    const emoji = this.add.text(0, -20, item.emoji, {
      fontSize: '36px',
    });
    emoji.setOrigin(0.5);
    if (!isUnlocked) {
      emoji.setAlpha(0.3);
    }
    container.add(emoji);

    // 狀態文字
    let statusText: string;
    let statusColor: string;
    if (isEquipped) {
      statusText = PLAIN_TEXT.equipped;
      statusColor = '#ffd700';
    } else if (isUnlocked) {
      statusText = PLAIN_TEXT.equip;
      statusColor = '#ffffff';
    } else {
      statusText = PLAIN_TEXT.locked;
      statusColor = '#999999';
    }

    const status = this.add.text(0, 30, statusText, {
      ...FONT_CONFIG.hint,
      fontSize: '14px',
      color: statusColor,
    });
    status.setOrigin(0.5);
    container.add(status);

    // 互動
    if (isUnlocked && !isEquipped) {
      const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      container.add(hitArea);

      hitArea.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(BUNNY_COLORS.hotPink, 0.8);
        bg.lineStyle(2, BUNNY_COLORS.white);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
      });

      hitArea.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(BUNNY_COLORS.pink, 0.7);
        bg.lineStyle(2, BUNNY_COLORS.white);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
      });

      hitArea.on('pointerdown', () => {
        this.equipItem(item.id);
      });
    }

    // 已裝備的點擊取消裝備
    if (isEquipped) {
      const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      container.add(hitArea);

      hitArea.on('pointerdown', () => {
        this.unequipItem();
      });
    }
  }

  private equipItem(itemId: string): void {
    if (this.currentTab === 'stickers') {
      this.gameSave = equipSticker(this.gameSave, itemId);
    } else {
      this.gameSave = equipHat(this.gameSave, itemId);
    }
    saveGame(this.gameSave);

    this.showItems();
    this.updateCharacterPreview();

    // 裝備音效
    this.playEquipSound();
  }

  private unequipItem(): void {
    if (this.currentTab === 'stickers') {
      this.gameSave = equipSticker(this.gameSave, null);
    } else {
      this.gameSave = equipHat(this.gameSave, null);
    }
    saveGame(this.gameSave);

    this.showItems();
    this.updateCharacterPreview();
  }

  private playEquipSound(): void {
    bgMusic.playEquipSound();
  }
}
