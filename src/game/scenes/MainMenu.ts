// 主選單場景 - 兔子風格

import Phaser from 'phaser';
import { BUNNY_COLORS, FONT_CONFIG } from '../config';
import { UIFactory } from '../UIFactory';
import { DECORATION_CONFIG } from '../designTokens';
import { loadGame, getTodayChallenge, getPlayerInfo, getMusicPreference, saveMusicPreference } from '@/lib/storage';
import { bgMusic, MUSIC_TYPES, MusicType } from '@/lib/audio';
import { MAX_DAILY_ATTEMPTS } from '@/types/game';

export class MainMenuScene extends Phaser.Scene {
  private floatingElements: Phaser.GameObjects.Text[] = [];
  private musicButton!: Phaser.GameObjects.Text;
  private musicTypeButton!: Phaser.GameObjects.Text;
  private musicInitialized: boolean = false;

  constructor() {
    super({ key: 'MainMenu' });
  }

  create(): void {
    const { width, height } = this.scale;

    // 檢查是否有玩家資訊
    const playerInfo = getPlayerInfo();
    if (!playerInfo) {
      this.scene.start('NameInputScene');
      return;
    }

    // 初始化音樂系統
    if (!this.musicInitialized) {
      bgMusic.initialize();
      // 載入音樂偏好
      const savedMusicType = getMusicPreference();
      bgMusic.setMusicType(savedMusicType);
      this.musicInitialized = true;
    }

    // 背景漸層效果
    this.createBackground(width, height);

    // 裝飾元素
    this.createDecorations(width, height);

    // 標題
    this.createTitle(width);

    // 顯示玩家名字
    this.displayPlayerName(width, playerInfo.name);

    // 兔子角色
    this.createBunnyCharacter(width, height);

    // 按鈕
    this.createButtons(width, height);

    // 顯示分數
    this.displayScore(width);

    // 音樂控制按鈕
    this.createMusicControls(width, height);

    // 點擊畫面任意處來啟動音樂（需要用戶互動）
    this.input.once('pointerdown', () => {
      if (!bgMusic.getIsPlaying()) {
        bgMusic.start();
        this.updateMusicButtonText();
      }
    });
  }

  private displayPlayerName(width: number, name: string): void {
    const playerText = this.add.text(
      width / 2,
      145,
      `👋 ${name}`,
      {
        ...FONT_CONFIG.hint,
        fontSize: '20px',
        color: '#ff69b4',
      }
    );
    playerText.setOrigin(0.5);
    playerText.setInteractive({ useHandCursor: true });
    playerText.on('pointerdown', () => {
      bgMusic.playClickSound();
      this.scene.start('NameInputScene');
    });
  }

  private createBackground(width: number, height: number): void {
    // 創建柔和的粉色漸層背景
    const graphics = this.add.graphics();

    // 淺粉色到白色漸層
    for (let i = 0; i < height; i++) {
      const ratio = i / height;
      const r = Math.floor(255 * (1 - ratio * 0.1));
      const g = Math.floor(245 - ratio * 20);
      const b = Math.floor(248 - ratio * 10);
      graphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      graphics.fillRect(0, i, width, 1);
    }

    // 愛心和花朵裝飾（使用統一配置）
    const decorEmojis = ['💗', '🌸', '✨', '💫', '🐰', '🥕', '⭐', '🌈', '🍀', '🦋'];
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

    // 底部草地裝飾
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(0, width);
      const grass = this.add.text(x, height - 30, '🌱', {
        fontSize: '24px',
      });
      grass.setAlpha(0.7);
    }
  }

  private createDecorations(width: number, height: number): void {
    // 漂浮的胡蘿蔔、花朵和星星
    const decorations = ['🥕', '🌸', '🌷', '⭐', '🦋', '🍓'];

    decorations.forEach((emoji) => {
      const x = Phaser.Math.Between(50, width - 50);
      const y = Phaser.Math.Between(80, height - 120);
      const decoration = this.add.text(x, y, emoji, { fontSize: '28px' });
      decoration.setAlpha(0.7);
      this.floatingElements.push(decoration);

      // 漂浮動畫
      this.tweens.add({
        targets: decoration,
        y: y + Phaser.Math.Between(-15, 15),
        x: x + Phaser.Math.Between(-8, 8),
        duration: Phaser.Math.Between(2000, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  private createTitle(width: number): void {
    // 遊戲標題（無注音）
    const title = this.add.text(
      width / 2,
      80,
      '小兔兔數學樂園',
      {
        ...FONT_CONFIG.title,
        align: 'center',
        lineSpacing: 10,
      }
    );
    title.setOrigin(0.5);

    // 標題彈跳動畫
    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.05 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createBunnyCharacter(width: number, height: number): void {
    // 可愛的兔子角色
    const bunny = this.add.text(width / 2, height / 2 - 30, '🐰', {
      fontSize: '100px',
    });
    bunny.setOrigin(0.5);

    // 彈跳動畫
    this.tweens.add({
      targets: bunny,
      y: height / 2 - 45,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 旁邊加一個胡蘿蔔
    const carrot = this.add.text(width / 2 + 70, height / 2, '🥕', {
      fontSize: '40px',
    });
    carrot.setOrigin(0.5);

    this.tweens.add({
      targets: carrot,
      angle: { from: -10, to: 10 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createButtons(width: number, height: number): void {
    const buttonY = height / 2 + 80;
    const buttonSpacing = 55;

    // 開始遊戲按鈕
    this.createButton(
      width / 2,
      buttonY,
      '🎮 開始遊戲',
      () => {
        bgMusic.playClickSound();
        this.scene.start('GameScene');
      }
    );

    // 每日挑戰按鈕
    const save = loadGame();
    const todayChallenge = getTodayChallenge(save);
    const attemptCount = todayChallenge?.attempts?.length || 0;
    const remaining = MAX_DAILY_ATTEMPTS - attemptCount;

    let dailyLabel: string;
    if (remaining <= 0) {
      dailyLabel = '✅ 每日挑戰 (已完成)';
    } else {
      dailyLabel = `🌟 每日挑戰 (${remaining}次)`;
    }

    this.createButton(
      width / 2,
      buttonY + buttonSpacing,
      dailyLabel,
      () => {
        bgMusic.playClickSound();
        this.scene.start('DailyChallengeScene');
      }
    );

    // 排行榜按鈕
    this.createButton(
      width / 2,
      buttonY + buttonSpacing * 2,
      '🏆 排行榜',
      () => {
        bgMusic.playClickSound();
        this.scene.start('LeaderboardScene');
      }
    );

    // 收藏/裝扮按鈕
    this.createButton(
      width / 2,
      buttonY + buttonSpacing * 3,
      '👗 裝扮',
      () => {
        bgMusic.playClickSound();
        this.scene.start('CollectionScene');
      }
    );
  }

  private createButton(x: number, y: number, text: string, callback: () => void): void {
    const buttonWidth = 360;
    const buttonHeight = 50;
    const cornerRadius = 25;

    // 按鈕容器
    const container = this.add.container(x, y);

    // 陰影效果
    const shadow = this.add.graphics();
    shadow.fillStyle(BUNNY_COLORS.shadowPink, 0.4);
    shadow.fillRoundedRect(-buttonWidth / 2 + 4, -buttonHeight / 2 + 4, buttonWidth, buttonHeight, cornerRadius);
    container.add(shadow);

    // 按鈕背景 - 粉色圓角矩形
    const bg = this.add.graphics();
    bg.fillStyle(BUNNY_COLORS.pink, 0.9);
    bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
    bg.lineStyle(3, BUNNY_COLORS.white);
    bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
    container.add(bg);

    // 按鈕文字
    const buttonText = this.add.text(0, 0, text, FONT_CONFIG.button);
    buttonText.setOrigin(0.5);
    container.add(buttonText);

    // 設為可互動
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
        y: y + 2,
        duration: 100,
        ease: 'Power2',
      });
    });

    hitArea.on('pointerup', () => {
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        y: y,
        duration: 100,
        ease: 'Power2',
        onComplete: callback,
      });
    });
  }

  private createMusicControls(width: number, height: number): void {
    // 音樂開關按鈕
    const isPlaying = bgMusic.getIsPlaying();
    const musicEmoji = isPlaying ? '🔊' : '🔇';

    this.musicButton = this.add.text(
      20,
      height - 80,
      `${musicEmoji} 音樂`,
      {
        ...FONT_CONFIG.hint,
        fontSize: '18px',
        color: '#ff69b4',
        backgroundColor: 'rgba(255, 182, 193, 0.8)',
        padding: { x: 10, y: 6 },
      }
    );

    this.musicButton.setInteractive({ useHandCursor: true });

    this.musicButton.on('pointerover', () => {
      this.musicButton.setColor('#ff1493');
    });

    this.musicButton.on('pointerout', () => {
      this.musicButton.setColor('#ff69b4');
    });

    this.musicButton.on('pointerdown', () => {
      bgMusic.toggle();
      this.updateMusicButtonText();
    });

    // 音樂類型選擇按鈕
    const currentType = MUSIC_TYPES.find(t => t.id === bgMusic.getMusicType());
    this.musicTypeButton = this.add.text(
      20,
      height - 45,
      `${currentType?.emoji} ${currentType?.name}`,
      {
        ...FONT_CONFIG.hint,
        fontSize: '18px',
        color: '#ff69b4',
        backgroundColor: 'rgba(255, 182, 193, 0.8)',
        padding: { x: 10, y: 6 },
      }
    );

    this.musicTypeButton.setInteractive({ useHandCursor: true });

    this.musicTypeButton.on('pointerover', () => {
      this.musicTypeButton.setColor('#ff1493');
    });

    this.musicTypeButton.on('pointerout', () => {
      this.musicTypeButton.setColor('#ff69b4');
    });

    this.musicTypeButton.on('pointerdown', () => {
      bgMusic.playClickSound();
      this.cycleMusicType();
    });
  }

  private cycleMusicType(): void {
    const currentType = bgMusic.getMusicType();
    const currentIndex = MUSIC_TYPES.findIndex(t => t.id === currentType);
    const nextIndex = (currentIndex + 1) % MUSIC_TYPES.length;
    const nextType = MUSIC_TYPES[nextIndex];

    bgMusic.setMusicType(nextType.id as MusicType);
    saveMusicPreference(nextType.id as MusicType);
    this.updateMusicTypeButtonText();
  }

  private updateMusicButtonText(): void {
    const isPlaying = bgMusic.getIsPlaying();
    const musicEmoji = isPlaying ? '🔊' : '🔇';
    this.musicButton.setText(`${musicEmoji} 音樂`);
  }

  private updateMusicTypeButtonText(): void {
    const currentType = MUSIC_TYPES.find(t => t.id === bgMusic.getMusicType());
    this.musicTypeButton.setText(`${currentType?.emoji} ${currentType?.name}`);
  }

  private displayScore(width: number): void {
    const save = loadGame();

    // 顯示分數
    const score = save.progress.totalCorrect * 10;
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

  update(): void {
    // 更新漂浮元素
  }
}
