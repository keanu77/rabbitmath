// 遊戲場景 - 加法遊戲邏輯（兔子風格）

import Phaser from 'phaser';
import { BUNNY_COLORS, FONT_CONFIG } from '../config';
import { DECORATION_CONFIG, RADIUS } from '../designTokens';
import { PLAIN_TEXT, STICKERS, HATS, REWARD_CONFIG, GAME_CONFIG } from '@/lib/gameData';
import { bgMusic } from '@/lib/audio';
import { loadGame, saveGame, unlockSticker, unlockHat, calculateTotalScore, getPlayerInfo, addLeaderboardEntry, calculateGameScore } from '@/lib/storage';
import { Question, GameSave } from '@/types/game';

export class GameScene extends Phaser.Scene {
  private currentQuestion!: Question;
  private questionIndex: number = 0;
  private correctCount: number = 0;
  private totalQuestions: number = GAME_CONFIG.totalQuestions;
  private questionText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private countHintContainer!: Phaser.GameObjects.Container;
  private hintTweens: Phaser.Tweens.Tween[] = [];
  private optionButtons: Phaser.GameObjects.Container[] = [];
  private progressText!: Phaser.GameObjects.Text;
  private attempts: number = 0;
  private gameSave!: GameSave;
  private isDaily: boolean = false;
  private timerText!: Phaser.GameObjects.Text;
  private timerEvent!: Phaser.Time.TimerEvent;
  private questionStartTime: number = 0;
  private totalTime: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { isDaily?: boolean }): void {
    this.isDaily = data?.isDaily || false;
    this.questionIndex = 0;
    this.correctCount = 0;
    this.attempts = 0;
    this.totalTime = 0;
    this.gameSave = loadGame();
  }

  create(): void {
    const { width, height } = this.scale;

    // 背景
    this.createBackground(width, height);

    // 返回按鈕
    this.createBackButton();

    // 進度顯示
    this.createProgressDisplay(width);

    // 問題區域
    this.createQuestionArea(width, height);

    // 提示區域
    this.createHintArea(width, height);

    // 選項按鈕
    this.createOptionButtons(width, height);

    // 反饋文字
    this.createFeedbackText(width, height);

    // 開始第一題
    this.nextQuestion();
  }

  private createBackground(width: number, height: number): void {
    // 柔和的粉色漸層背景
    const graphics = this.add.graphics();
    for (let i = 0; i < height; i++) {
      const ratio = i / height;
      const r = Math.floor(255 - ratio * 10);
      const g = Math.floor(250 - ratio * 25);
      const b = Math.floor(252 - ratio * 15);
      graphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      graphics.fillRect(0, i, width, 1);
    }

    // 裝飾元素（使用統一配置）
    const decorEmojis = ['💗', '🌸', '✨', '🦋', '🐰', '🥕', '⭐', '🌈', '🍀', '💫'];
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
    backBtn.on('pointerdown', () => this.scene.start('MainMenu'));
  }

  private createProgressDisplay(width: number): void {
    this.progressText = this.add.text(
      width / 2,
      30,
      this.getProgressText(),
      {
        ...FONT_CONFIG.subtitle,
        fontSize: '24px',
      }
    );
    this.progressText.setOrigin(0.5);

    // 計時器顯示
    this.timerText = this.add.text(
      width - 20,
      20,
      '⏱️ 0 秒',
      {
        ...FONT_CONFIG.hint,
        fontSize: '20px',
        color: '#ff69b4',
      }
    );
    this.timerText.setOrigin(1, 0);
  }

  private getProgressText(): string {
    return `${PLAIN_TEXT.question.replace('{n}', String(this.questionIndex + 1))} / ${this.totalQuestions}`;
  }

  private createQuestionArea(width: number, height: number): void {
    this.questionText = this.add.text(
      width / 2,
      height / 3,
      '',
      {
        ...FONT_CONFIG.question,
        align: 'center',
      }
    );
    this.questionText.setOrigin(0.5);
  }

  private createHintArea(width: number, height: number): void {
    this.countHintContainer = this.add.container(width / 2, height / 2 - 20);
    this.countHintContainer.setVisible(false);
  }

  private createOptionButtons(width: number, height: number): void {
    const buttonY = height * 0.7;
    const buttonWidth = 120;
    const buttonHeight = 80;
    const spacing = 20;
    const totalWidth = 4 * buttonWidth + 3 * spacing;
    const startX = (width - totalWidth) / 2 + buttonWidth / 2;

    for (let i = 0; i < 4; i++) {
      const x = startX + i * (buttonWidth + spacing);
      const container = this.createOptionButton(x, buttonY, buttonWidth, buttonHeight, i);
      this.optionButtons.push(container);
    }
  }

  private createOptionButton(
    x: number,
    y: number,
    width: number,
    height: number,
    index: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // 陰影效果
    const shadow = this.add.graphics();
    shadow.fillStyle(BUNNY_COLORS.shadowPink, 0.4);
    shadow.fillRoundedRect(-width / 2 + 3, -height / 2 + 3, width, height, RADIUS.md);

    // 按鈕背景 - 粉色
    const bg = this.add.graphics();
    bg.fillStyle(BUNNY_COLORS.pink, 0.9);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);
    bg.lineStyle(3, BUNNY_COLORS.white);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);

    // 按鈕文字
    const text = this.add.text(0, 0, '', {
      ...FONT_CONFIG.button,
      fontSize: '36px',
    });
    text.setOrigin(0.5);

    container.add([shadow, bg, text]);
    container.setData('bg', bg);
    container.setData('text', text);
    container.setData('index', index);
    container.setData('width', width);
    container.setData('height', height);
    container.setData('originalY', y);

    // 互動區域
    const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on('pointerover', () => this.onButtonHover(container, true));
    hitArea.on('pointerout', () => this.onButtonHover(container, false));
    hitArea.on('pointerdown', () => {
      // 按壓效果
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
          this.onAnswerSelected(container);
        },
      });
    });

    return container;
  }

  private onButtonHover(container: Phaser.GameObjects.Container, isHover: boolean): void {
    const bg = container.getData('bg') as Phaser.GameObjects.Graphics;
    const width = container.getData('width') as number;
    const height = container.getData('height') as number;

    bg.clear();
    if (isHover) {
      bg.fillStyle(BUNNY_COLORS.hotPink, 0.95);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);
      bg.lineStyle(3, BUNNY_COLORS.white);
      container.setScale(1.02);
    } else {
      bg.fillStyle(BUNNY_COLORS.pink, 0.9);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);
      bg.lineStyle(3, BUNNY_COLORS.white);
      container.setScale(1);
    }
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);
  }

  private createFeedbackText(width: number, height: number): void {
    this.feedbackText = this.add.text(
      width / 2,
      height / 2 + 20,
      '',
      {
        ...FONT_CONFIG.subtitle,
        align: 'center',
      }
    );
    this.feedbackText.setOrigin(0.5);
    this.feedbackText.setVisible(false);
  }

  private generateQuestion(): Question {
    // 隨機選擇加法或減法
    const isAddition = Phaser.Math.Between(0, 1) === 0;

    let num1: number, num2: number, answer: number;

    if (isAddition) {
      // 加法：10 以內，避免出現 0
      num1 = Phaser.Math.Between(1, 9);
      const maxNum2 = 10 - num1;
      num2 = Phaser.Math.Between(1, maxNum2);
      answer = num1 + num2;
    } else {
      // 減法：結果不為負數，避免出現 0
      num1 = Phaser.Math.Between(2, 10); // 被減數 2-10
      num2 = Phaser.Math.Between(1, num1 - 1); // 減數 1 到 (num1-1)，確保答案至少為 1
      answer = num1 - num2;
    }

    // 生成選項（包含正確答案），避免負數
    const options = new Set<number>([answer]);
    while (options.size < 4) {
      const wrongAnswer = Phaser.Math.Between(1, 10);
      options.add(wrongAnswer);
    }

    // 打亂選項順序
    const shuffledOptions = Phaser.Utils.Array.Shuffle(Array.from(options));

    return { num1, num2, answer, options: shuffledOptions, isAddition };
  }

  private nextQuestion(): void {
    if (this.questionIndex >= this.totalQuestions) {
      this.stopTimer();
      this.showResults();
      return;
    }

    this.currentQuestion = this.generateQuestion();
    this.attempts = 0;

    // 更新進度
    this.progressText.setText(this.getProgressText());

    // 開始計時
    this.startTimer();

    // 更新問題文字
    const operator = this.currentQuestion.isAddition ? '+' : '-';
    this.questionText.setText(
      `${this.currentQuestion.num1} ${operator} ${this.currentQuestion.num2} = ?`
    );

    // 動畫顯示問題
    this.questionText.setScale(0);
    this.tweens.add({
      targets: this.questionText,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });

    // 更新選項按鈕
    this.updateOptionButtons();

    // 隱藏提示
    this.countHintContainer.setVisible(false);
    this.feedbackText.setVisible(false);
  }

  private startTimer(): void {
    this.questionStartTime = Date.now();

    // 清除之前的計時器
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }

    // 每 100ms 更新計時器顯示
    this.timerEvent = this.time.addEvent({
      delay: 100,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });
  }

  private updateTimer(): void {
    const elapsed = Math.floor((Date.now() - this.questionStartTime) / 1000);
    this.timerText.setText(`⏱️ ${elapsed} 秒`);
  }

  private stopTimer(): void {
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }
    // 累加時間
    this.totalTime += Math.floor((Date.now() - this.questionStartTime) / 1000);
  }

  private updateOptionButtons(): void {
    this.optionButtons.forEach((container, i) => {
      const text = container.getData('text') as Phaser.GameObjects.Text;
      text.setText(String(this.currentQuestion.options[i]));

      container.setScale(0);
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: 300,
        delay: i * 50,
        ease: 'Back.easeOut',
      });
    });
  }

  private onAnswerSelected(container: Phaser.GameObjects.Container): void {
    const text = container.getData('text') as Phaser.GameObjects.Text;
    const selectedAnswer = parseInt(text.text, 10);

    if (selectedAnswer === this.currentQuestion.answer) {
      this.handleCorrectAnswer();
    } else {
      this.handleWrongAnswer();
    }
  }

  private handleCorrectAnswer(): void {
    this.stopTimer();
    this.correctCount++;
    this.gameSave.progress.totalCorrect++;
    this.gameSave.progress.totalPlayed++;
    saveGame(this.gameSave);

    // 正確反饋
    this.feedbackText.setText(`🥕 ${PLAIN_TEXT.great} 🥕`);
    this.feedbackText.setColor('#ff69b4');
    this.feedbackText.setVisible(true);
    this.feedbackText.setScale(0);

    // 動畫
    this.tweens.add({
      targets: this.feedbackText,
      scale: 1.2,
      duration: 300,
      yoyo: true,
      onComplete: () => {
        this.feedbackText.setScale(1);
      },
    });

    // 慶祝動畫 - 胡蘿蔔和花朵噴發
    this.createCelebrationEffect();

    // 播放成功音效
    this.playSuccessSound();

    // 延遲後進入下一題
    this.time.delayedCall(1500, () => {
      this.questionIndex++;
      this.nextQuestion();
    });
  }

  private handleWrongAnswer(): void {
    this.attempts++;

    // 播放提示音效
    this.playTryAgainSound();

    // 再試一次反饋
    this.feedbackText.setText(`💗 ${PLAIN_TEXT.tryAgain} 💗`);
    this.feedbackText.setColor('#ff69b4');
    this.feedbackText.setVisible(true);

    // 搖晃動畫
    this.tweens.add({
      targets: this.feedbackText,
      x: { from: this.scale.width / 2 - 10, to: this.scale.width / 2 + 10 },
      duration: 50,
      repeat: 4,
      yoyo: true,
    });

    // 第一次錯誤後顯示數數提示
    if (this.attempts >= 1) {
      this.showCountingHint();
    }
  }

  private showCountingHint(): void {
    // 停止之前的 tweens
    this.hintTweens.forEach(tween => {
      if (tween && tween.isPlaying()) {
        tween.stop();
      }
    });
    this.hintTweens = [];

    // 清除之前的提示
    this.countHintContainer.removeAll(true);

    const { num1, num2, isAddition } = this.currentQuestion;

    // 提示文字
    const hintLabel = this.add.text(
      0,
      -60,
      PLAIN_TEXT.countTogether,
      {
        ...FONT_CONFIG.hint,
        color: '#ff69b4',
      }
    );
    hintLabel.setOrigin(0.5);
    this.countHintContainer.add(hintLabel);

    let delay = 0;

    if (isAddition) {
      // 加法提示：顯示 num1 個胡蘿蔔 + num2 個花朵
      const startX = -((num1 + num2 + 1) * 25) / 2;

      // 第一組（胡蘿蔔）
      for (let i = 0; i < num1; i++) {
        const carrot = this.add.text(startX + i * 25, 0, '🥕', { fontSize: '24px' });
        carrot.setOrigin(0.5);
        carrot.setAlpha(0);
        this.countHintContainer.add(carrot);

        this.hintTweens.push(this.tweens.add({
          targets: carrot,
          alpha: 1,
          scale: { from: 0, to: 1 },
          duration: 200,
          delay: delay,
        }));

        const numLabel = this.add.text(startX + i * 25, 25, String(i + 1), {
          fontSize: '16px',
          color: '#ff69b4',
        });
        numLabel.setOrigin(0.5);
        numLabel.setAlpha(0);
        this.countHintContainer.add(numLabel);

        this.hintTweens.push(this.tweens.add({
          targets: numLabel,
          alpha: 1,
          duration: 200,
          delay: delay + 100,
        }));

        delay += 300;
      }

      // 加號
      const plusSign = this.add.text(startX + num1 * 25, 0, '+', {
        fontSize: '24px',
        color: '#ff69b4',
      });
      plusSign.setOrigin(0.5);
      plusSign.setAlpha(0);
      this.countHintContainer.add(plusSign);

      this.hintTweens.push(this.tweens.add({
        targets: plusSign,
        alpha: 1,
        duration: 200,
        delay: delay,
      }));
      delay += 200;

      // 第二組（花朵）
      for (let i = 0; i < num2; i++) {
        const flower = this.add.text(startX + (num1 + i + 1) * 25, 0, '🌸', { fontSize: '24px' });
        flower.setOrigin(0.5);
        flower.setAlpha(0);
        this.countHintContainer.add(flower);

        this.hintTweens.push(this.tweens.add({
          targets: flower,
          alpha: 1,
          scale: { from: 0, to: 1 },
          duration: 200,
          delay: delay,
        }));

        const numLabel = this.add.text(startX + (num1 + i + 1) * 25, 25, String(num1 + i + 1), {
          fontSize: '16px',
          color: '#ff69b4',
        });
        numLabel.setOrigin(0.5);
        numLabel.setAlpha(0);
        this.countHintContainer.add(numLabel);

        this.hintTweens.push(this.tweens.add({
          targets: numLabel,
          alpha: 1,
          duration: 200,
          delay: delay + 100,
        }));

        delay += 300;
      }
    } else {
      // 減法提示：顯示 num1 個胡蘿蔔，然後劃掉 num2 個
      const startX = -(num1 * 25) / 2;
      const answer = num1 - num2;

      // 顯示所有胡蘿蔔
      for (let i = 0; i < num1; i++) {
        const carrot = this.add.text(startX + i * 25, 0, '🥕', { fontSize: '24px' });
        carrot.setOrigin(0.5);
        carrot.setAlpha(0);
        this.countHintContainer.add(carrot);

        this.hintTweens.push(this.tweens.add({
          targets: carrot,
          alpha: 1,
          scale: { from: 0, to: 1 },
          duration: 200,
          delay: delay,
        }));

        const numLabel = this.add.text(startX + i * 25, 25, String(i + 1), {
          fontSize: '16px',
          color: '#ff69b4',
        });
        numLabel.setOrigin(0.5);
        numLabel.setAlpha(0);
        this.countHintContainer.add(numLabel);

        this.hintTweens.push(this.tweens.add({
          targets: numLabel,
          alpha: 1,
          duration: 200,
          delay: delay + 100,
        }));

        delay += 200;
      }

      delay += 300;

      // 顯示要拿走的數量（從後面開始劃掉）
      for (let i = 0; i < num2; i++) {
        const crossIdx = num1 - 1 - i;
        const cross = this.add.text(startX + crossIdx * 25, 0, '❌', { fontSize: '20px' });
        cross.setOrigin(0.5);
        cross.setAlpha(0);
        this.countHintContainer.add(cross);

        this.hintTweens.push(this.tweens.add({
          targets: cross,
          alpha: 0.8,
          scale: { from: 0, to: 1 },
          duration: 200,
          delay: delay,
        }));

        delay += 300;
      }

      // 顯示剩餘數量提示
      delay += 200;
      const remainLabel = this.add.text(0, 50, `剩下 ${answer} 個`, {
        fontSize: '20px',
        color: '#ff69b4',
      });
      remainLabel.setOrigin(0.5);
      remainLabel.setAlpha(0);
      this.countHintContainer.add(remainLabel);

      this.hintTweens.push(this.tweens.add({
        targets: remainLabel,
        alpha: 1,
        duration: 300,
        delay: delay,
      }));
    }

    this.countHintContainer.setVisible(true);
  }

  private createCelebrationEffect(): void {
    const { width, height } = this.scale;
    const emojis = ['🥕', '🌸', '💗', '⭐', '✨', '🦋'];

    for (let i = 0; i < 15; i++) {
      const emoji = Phaser.Utils.Array.GetRandom(emojis);
      const particle = this.add.text(
        width / 2,
        height / 2,
        emoji,
        { fontSize: '32px' }
      );

      const angle = Phaser.Math.Between(0, 360);
      const distance = Phaser.Math.Between(100, 200);
      const targetX = width / 2 + Math.cos(angle * Math.PI / 180) * distance;
      const targetY = height / 2 + Math.sin(angle * Math.PI / 180) * distance;

      this.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: { from: 0.5, to: 1.5 },
        duration: 800,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private playSuccessSound(): void {
    bgMusic.playSuccessSound();
  }

  private playTryAgainSound(): void {
    bgMusic.playTryAgainSound();
  }

  private showResults(): void {
    const { width, height } = this.scale;

    // 記錄成績到排行榜
    const playerInfo = getPlayerInfo();
    const gameScore = calculateGameScore(this.correctCount, this.totalTime);
    if (playerInfo) {
      addLeaderboardEntry(playerInfo.name, this.correctCount, this.totalTime);
    }

    // 清除遊戲元素
    this.questionText.setVisible(false);
    this.countHintContainer.setVisible(false);
    this.feedbackText.setVisible(false);
    this.optionButtons.forEach(btn => btn.setVisible(false));
    this.timerText.setVisible(false);

    // 結果畫面
    const resultBg = this.add.graphics();
    resultBg.fillStyle(BUNNY_COLORS.softPink, 0.95);
    resultBg.fillRoundedRect(width / 4, height / 5, width / 2, height * 0.65, 20);
    resultBg.lineStyle(4, BUNNY_COLORS.pink);
    resultBg.strokeRoundedRect(width / 4, height / 5, width / 2, height * 0.65, 20);

    // 完成文字
    const completeText = this.add.text(
      width / 2,
      height / 4 + 20,
      `🐰 ${PLAIN_TEXT.completed} 🐰`,
      {
        ...FONT_CONFIG.title,
        fontSize: '32px',
      }
    );
    completeText.setOrigin(0.5);

    // 分數
    const scoreText = this.add.text(
      width / 2,
      height / 2 - 40,
      `正確：${this.correctCount} / ${this.totalQuestions}`,
      {
        ...FONT_CONFIG.subtitle,
        fontSize: '24px',
      }
    );
    scoreText.setOrigin(0.5);

    // 總時間
    const timeText = this.add.text(
      width / 2,
      height / 2 - 5,
      `⏱️ 時間：${this.totalTime} 秒`,
      {
        ...FONT_CONFIG.hint,
        fontSize: '20px',
      }
    );
    timeText.setOrigin(0.5);

    // 綜合分數
    const finalScoreText = this.add.text(
      width / 2,
      height / 2 + 35,
      `🏆 綜合分數：${gameScore}`,
      {
        ...FONT_CONFIG.subtitle,
        fontSize: '26px',
        color: '#ffd700',
      }
    );
    finalScoreText.setOrigin(0.5);

    // 檢查是否解鎖新獎勵
    this.checkUnlocks();

    // 返回按鈕
    const backBtn = this.add.text(
      width / 2,
      height * 0.65,
      `🏠 ${PLAIN_TEXT.back}`,
      {
        ...FONT_CONFIG.button,
        backgroundColor: '#ff69b4',
        padding: { x: 20, y: 10 },
      }
    );
    backBtn.setOrigin(0.5);
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setColor('#ff1493'));
    backBtn.on('pointerout', () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerdown', () => this.scene.start('MainMenu'));
  }

  private checkUnlocks(): void {
    const totalScore = calculateTotalScore(this.gameSave);
    const { stickerUnlockThreshold, hatUnlockThreshold } = REWARD_CONFIG;

    // 檢查貼紙解鎖
    const stickerUnlockCount = Math.floor(totalScore / stickerUnlockThreshold);
    const currentStickers = this.gameSave.progress.stickers.length;

    if (stickerUnlockCount > currentStickers) {
      const availableStickers = STICKERS.filter(
        s => !this.gameSave.progress.stickers.includes(s.id)
      );
      if (availableStickers.length > 0) {
        const newSticker = availableStickers[0];
        this.gameSave = unlockSticker(this.gameSave, newSticker.id);
        saveGame(this.gameSave);
        this.showUnlockNotification(`${PLAIN_TEXT.newUnlock}\n${newSticker.emoji} ${newSticker.nameWithZhuyin}`);
      }
    }

    // 檢查帽子解鎖
    const hatUnlockCount = Math.floor(totalScore / hatUnlockThreshold);
    const currentHats = this.gameSave.progress.hats.length;

    if (hatUnlockCount > currentHats) {
      const availableHats = HATS.filter(
        h => !this.gameSave.progress.hats.includes(h.id)
      );
      if (availableHats.length > 0) {
        const newHat = availableHats[0];
        this.gameSave = unlockHat(this.gameSave, newHat.id);
        saveGame(this.gameSave);
        this.showUnlockNotification(`${PLAIN_TEXT.newUnlock}\n${newHat.emoji} ${newHat.nameWithZhuyin}`);
      }
    }
  }

  private showUnlockNotification(message: string): void {
    const { width, height } = this.scale;

    const notification = this.add.text(
      width / 2,
      height * 0.8,
      message,
      {
        ...FONT_CONFIG.hint,
        align: 'center',
        backgroundColor: '#fff5f8',
        padding: { x: 15, y: 10 },
      }
    );
    notification.setOrigin(0.5);
    notification.setAlpha(0);

    this.tweens.add({
      targets: notification,
      alpha: 1,
      y: height * 0.75,
      duration: 500,
      yoyo: true,
      hold: 2000,
    });
  }
}
