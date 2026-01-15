// 每日挑戰場景（兔子風格）

import Phaser from 'phaser';
import { BUNNY_COLORS, FONT_CONFIG } from '../config';
import { DECORATION_CONFIG, RADIUS } from '../designTokens';
import { PLAIN_TEXT, STICKERS, GAME_CONFIG } from '@/lib/gameData';
import { bgMusic } from '@/lib/audio';
import { loadGame, saveGame, getTodayDate, getTodayChallenge, updateDailyChallenge, unlockSticker } from '@/lib/storage';
import { Question, GameSave, DailyChallenge, MAX_DAILY_ATTEMPTS } from '@/types/game';

export class DailyChallengeScene extends Phaser.Scene {
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
  private todayChallenge!: DailyChallenge;
  private dailyQuestions: Question[] = [];
  private timerText!: Phaser.GameObjects.Text;
  private timerEvent!: Phaser.Time.TimerEvent;
  private questionStartTime: number = 0;
  private totalTime: number = 0;
  private attemptCountText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'DailyChallengeScene' });
  }

  init(): void {
    this.questionIndex = 0;
    this.correctCount = 0;
    this.attempts = 0;
    this.totalTime = 0;
    this.gameSave = loadGame();

    const existingChallenge = getTodayChallenge(this.gameSave);
    if (existingChallenge) {
      this.todayChallenge = existingChallenge;
    } else {
      this.todayChallenge = {
        date: getTodayDate(),
        attempts: [],
        rewardClaimed: false,
      };
    }

    this.generateDailyQuestions();
  }

  private generateDailyQuestions(): void {
    const today = getTodayDate();
    // 加入挑戰次數作為種子的一部分，讓每次題目不同
    const attemptNum = this.todayChallenge.attempts.length + 1;
    const seed = today.split('-').join('') + String(attemptNum);
    const rng = this.createSeededRandom(parseInt(seed, 10));

    this.dailyQuestions = [];
    for (let i = 0; i < this.totalQuestions; i++) {
      // 隨機選擇加法或減法
      const isAddition = rng() < 0.5;

      let num1: number, num2: number, answer: number;

      if (isAddition) {
        // 加法：避免出現 0
        num1 = 1 + Math.floor(rng() * 9);
        const maxNum2 = 10 - num1;
        num2 = 1 + Math.floor(rng() * maxNum2);
        answer = num1 + num2;
      } else {
        // 減法：結果不為負數，避免出現 0
        num1 = 2 + Math.floor(rng() * 9); // 被減數 2-10
        num2 = 1 + Math.floor(rng() * (num1 - 1)); // 減數 1 到 (num1-1)
        answer = num1 - num2;
      }

      // 生成選項，避免負數
      const options = new Set<number>([answer]);
      while (options.size < 4) {
        const wrongAnswer = 1 + Math.floor(rng() * 10); // 1 到 10
        options.add(wrongAnswer);
      }

      const shuffledOptions = this.shuffleWithRng(Array.from(options), rng);
      this.dailyQuestions.push({ num1, num2, answer, options: shuffledOptions, isAddition });
    }
  }

  private createSeededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  private shuffleWithRng<T>(array: T[], rng: () => number): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private getRemainingAttempts(): number {
    return MAX_DAILY_ATTEMPTS - this.todayChallenge.attempts.length;
  }

  private hasAttemptsLeft(): boolean {
    return this.getRemainingAttempts() > 0;
  }

  create(): void {
    const { width, height } = this.scale;

    this.createBackground(width, height);

    // 如果已經用完挑戰次數，顯示完成畫面
    if (!this.hasAttemptsLeft()) {
      this.showCompletedScreen();
      return;
    }

    this.createBackButton();
    this.createDailyHeader(width);
    this.createProgressDisplay(width);
    this.createQuestionArea(width, height);
    this.createHintArea(width, height);
    this.createOptionButtons(width, height);
    this.createFeedbackText(width, height);
    this.nextQuestion();
  }

  private createBackground(width: number, height: number): void {
    const graphics = this.add.graphics();

    // 特殊的每日挑戰背景 - 薰衣草紫色調
    for (let i = 0; i < height; i++) {
      const ratio = i / height;
      const r = Math.floor(255 - ratio * 20);
      const g = Math.floor(240 - ratio * 30);
      const b = Math.floor(255 - ratio * 10);
      graphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      graphics.fillRect(0, i, width, 1);
    }

    // 閃亮的星星和花朵（使用統一配置）
    const decorEmojis = ['⭐', '🌟', '✨', '🌸', '💫', '🐰', '🥕', '💗', '🌈', '🦋'];
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

      const duration = Phaser.Math.Between(
        DECORATION_CONFIG.animationDuration[0],
        DECORATION_CONFIG.animationDuration[1]
      );
      this.tweens.add({
        targets: star,
        alpha: alpha * 0.5,
        scale: { from: 1, to: 1.2 },
        duration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private createDailyHeader(width: number): void {
    const header = this.add.text(
      width / 2,
      50,
      `🌟 ${PLAIN_TEXT.dailyChallenge} 🌟`,
      {
        ...FONT_CONFIG.title,
        fontSize: '32px',
        color: '#ff69b4',
      }
    );
    header.setOrigin(0.5);

    // 顯示剩餘挑戰次數
    const attemptNum = this.todayChallenge.attempts.length + 1;
    this.attemptCountText = this.add.text(
      width / 2,
      85,
      `第 ${attemptNum} 次 / 共 ${MAX_DAILY_ATTEMPTS} 次`,
      {
        ...FONT_CONFIG.hint,
        fontSize: '18px',
        color: '#9370db',
      }
    );
    this.attemptCountText.setOrigin(0.5);
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
      115,
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
      50,
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
      height / 3 + 20,
      '',
      {
        ...FONT_CONFIG.question,
        align: 'center',
      }
    );
    this.questionText.setOrigin(0.5);
  }

  private createHintArea(width: number, height: number): void {
    this.countHintContainer = this.add.container(width / 2, height / 2);
    this.countHintContainer.setVisible(false);
  }

  private createOptionButtons(width: number, height: number): void {
    const buttonY = height * 0.72;
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

    const bg = this.add.graphics();
    bg.fillStyle(BUNNY_COLORS.pink, 0.9);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);
    bg.lineStyle(3, BUNNY_COLORS.gold);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);

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
      bg.lineStyle(3, BUNNY_COLORS.gold);
      container.setScale(1.02);
    } else {
      bg.fillStyle(BUNNY_COLORS.pink, 0.9);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);
      bg.lineStyle(3, BUNNY_COLORS.gold);
      container.setScale(1);
    }
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);
  }

  private createFeedbackText(width: number, height: number): void {
    this.feedbackText = this.add.text(
      width / 2,
      height / 2 + 40,
      '',
      {
        ...FONT_CONFIG.subtitle,
        align: 'center',
      }
    );
    this.feedbackText.setOrigin(0.5);
    this.feedbackText.setVisible(false);
  }

  private nextQuestion(): void {
    if (this.questionIndex >= this.totalQuestions) {
      this.stopTimer();
      this.completeChallenge();
      return;
    }

    this.currentQuestion = this.dailyQuestions[this.questionIndex];
    this.attempts = 0;

    this.progressText.setText(this.getProgressText());

    // 開始計時
    this.startTimer();

    const operator = this.currentQuestion.isAddition ? '+' : '-';
    this.questionText.setText(
      `${this.currentQuestion.num1} ${operator} ${this.currentQuestion.num2} = ?`
    );

    this.questionText.setScale(0);
    this.tweens.add({
      targets: this.questionText,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });

    this.updateOptionButtons();

    this.countHintContainer.setVisible(false);
    this.feedbackText.setVisible(false);
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

    this.feedbackText.setText(`🥕 ${PLAIN_TEXT.great} 🥕`);
    this.feedbackText.setColor('#ff69b4');
    this.feedbackText.setVisible(true);
    this.feedbackText.setScale(0);

    this.tweens.add({
      targets: this.feedbackText,
      scale: 1.2,
      duration: 300,
      yoyo: true,
      onComplete: () => {
        this.feedbackText.setScale(1);
      },
    });

    this.createCelebrationEffect();
    this.playSuccessSound();

    this.time.delayedCall(1500, () => {
      this.questionIndex++;
      this.nextQuestion();
    });
  }

  private handleWrongAnswer(): void {
    this.attempts++;

    this.playTryAgainSound();

    this.feedbackText.setText(`💗 ${PLAIN_TEXT.tryAgain} 💗`);
    this.feedbackText.setColor('#ff69b4');
    this.feedbackText.setVisible(true);

    this.tweens.add({
      targets: this.feedbackText,
      x: { from: this.scale.width / 2 - 10, to: this.scale.width / 2 + 10 },
      duration: 50,
      repeat: 4,
      yoyo: true,
    });

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

    this.countHintContainer.removeAll(true);

    const { num1, num2, isAddition } = this.currentQuestion;

    const hintLabel = this.add.text(
      0,
      -50,
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
      // 加法提示
      const startX = -((num1 + num2 + 1) * 25) / 2;

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
    const emojis = ['🌟', '✨', '💫', '⭐', '🌸', '🥕'];

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

  private completeChallenge(): void {
    // 記錄本次挑戰結果
    this.todayChallenge.attempts.push({
      score: this.correctCount,
      totalTime: this.totalTime,
    });

    this.gameSave = updateDailyChallenge(this.gameSave, this.todayChallenge);
    saveGame(this.gameSave);

    this.showResultScreen();
  }

  private showResultScreen(): void {
    const { width, height } = this.scale;

    if (this.questionText) this.questionText.setVisible(false);
    if (this.countHintContainer) this.countHintContainer.setVisible(false);
    if (this.feedbackText) this.feedbackText.setVisible(false);
    if (this.progressText) this.progressText.setVisible(false);
    if (this.attemptCountText) this.attemptCountText.setVisible(false);
    if (this.timerText) this.timerText.setVisible(false);
    this.optionButtons.forEach(btn => btn.setVisible(false));

    const backBtn = this.add.text(20, 20, `← ${PLAIN_TEXT.back}`, {
      ...FONT_CONFIG.hint,
      color: '#ff69b4',
    });
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setColor('#ff1493'));
    backBtn.on('pointerout', () => backBtn.setColor('#ff69b4'));
    backBtn.on('pointerdown', () => this.scene.start('MainMenu'));

    const resultBg = this.add.graphics();
    resultBg.fillStyle(BUNNY_COLORS.softPink, 0.95);
    resultBg.fillRoundedRect(width / 6, height / 6, width * 2 / 3, height * 2 / 3, 20);
    resultBg.lineStyle(4, BUNNY_COLORS.gold);
    resultBg.strokeRoundedRect(width / 6, height / 6, width * 2 / 3, height * 2 / 3, 20);

    const title = this.add.text(
      width / 2,
      height / 5 + 30,
      `🌟 ${PLAIN_TEXT.dailyChallenge} 🌟`,
      {
        ...FONT_CONFIG.title,
        fontSize: '28px',
        color: '#ff69b4',
      }
    );
    title.setOrigin(0.5);

    // 顯示本次成績
    const attemptNum = this.todayChallenge.attempts.length;
    const attemptText = this.add.text(
      width / 2,
      height / 4 + 30,
      `第 ${attemptNum} 次挑戰完成！`,
      {
        ...FONT_CONFIG.subtitle,
        fontSize: '22px',
        color: '#9370db',
      }
    );
    attemptText.setOrigin(0.5);

    const scoreText = this.add.text(
      width / 2,
      height / 3 + 20,
      `正確：${this.correctCount} / ${this.totalQuestions}`,
      {
        ...FONT_CONFIG.subtitle,
        fontSize: '22px',
      }
    );
    scoreText.setOrigin(0.5);

    const timeText = this.add.text(
      width / 2,
      height / 3 + 55,
      `⏱️ 時間：${this.totalTime} 秒`,
      {
        ...FONT_CONFIG.hint,
        fontSize: '20px',
      }
    );
    timeText.setOrigin(0.5);

    // 顯示今日最佳成績
    const bestAttempt = this.todayChallenge.attempts.reduce((best, curr) => {
      if (curr.score > best.score) return curr;
      if (curr.score === best.score && curr.totalTime < best.totalTime) return curr;
      return best;
    }, this.todayChallenge.attempts[0]);

    const bestText = this.add.text(
      width / 2,
      height / 2 + 10,
      `🏆 今日最佳：${bestAttempt.score} 題 / ${bestAttempt.totalTime} 秒`,
      {
        ...FONT_CONFIG.hint,
        fontSize: '18px',
        color: '#ffd700',
      }
    );
    bestText.setOrigin(0.5);

    // 剩餘次數
    const remaining = this.getRemainingAttempts();
    const remainingText = this.add.text(
      width / 2,
      height / 2 + 45,
      remaining > 0 ? `還可以挑戰 ${remaining} 次！` : '今日挑戰次數已用完',
      {
        ...FONT_CONFIG.hint,
        fontSize: '18px',
        color: remaining > 0 ? '#ff69b4' : '#888888',
      }
    );
    remainingText.setOrigin(0.5);

    // 按鈕區域
    const buttonY = height * 0.68;

    // 如果還有剩餘次數，顯示「再挑戰一次」按鈕
    if (remaining > 0) {
      this.createActionButton(
        width / 2 - 120,
        buttonY,
        '🔄 再挑戰',
        () => {
          this.scene.restart();
        }
      );
    }

    // 獎勵按鈕
    if (!this.todayChallenge.rewardClaimed) {
      this.createActionButton(
        remaining > 0 ? width / 2 + 120 : width / 2,
        buttonY,
        `🎁 ${PLAIN_TEXT.claimReward}`,
        () => {
          this.claimReward();
        },
        BUNNY_COLORS.gold
      );
    } else {
      const claimedText = this.add.text(
        remaining > 0 ? width / 2 + 120 : width / 2,
        buttonY,
        `✨ ${PLAIN_TEXT.rewardClaimed}`,
        {
          ...FONT_CONFIG.hint,
          fontSize: '18px',
          color: '#888888',
        }
      );
      claimedText.setOrigin(0.5);
    }
  }

  private createActionButton(
    x: number,
    y: number,
    text: string,
    callback: () => void,
    bgColor: number = BUNNY_COLORS.pink
  ): void {
    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 0.9);
    bg.fillRoundedRect(x - 90, y - 22, 180, 44, 22);
    bg.lineStyle(3, BUNNY_COLORS.white);
    bg.strokeRoundedRect(x - 90, y - 22, 180, 44, 22);

    const btnText = this.add.text(x, y, text, {
      ...FONT_CONFIG.button,
      fontSize: '20px',
    });
    btnText.setOrigin(0.5);

    const hitArea = this.add.rectangle(x, y, 180, 44, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(BUNNY_COLORS.hotPink, 0.95);
      bg.fillRoundedRect(x - 90, y - 22, 180, 44, 22);
      bg.lineStyle(3, BUNNY_COLORS.white);
      bg.strokeRoundedRect(x - 90, y - 22, 180, 44, 22);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(bgColor, 0.9);
      bg.fillRoundedRect(x - 90, y - 22, 180, 44, 22);
      bg.lineStyle(3, BUNNY_COLORS.white);
      bg.strokeRoundedRect(x - 90, y - 22, 180, 44, 22);
    });

    hitArea.on('pointerdown', () => {
      bgMusic.playClickSound();
      callback();
    });
  }

  private showCompletedScreen(): void {
    const { width, height } = this.scale;

    const backBtn = this.add.text(20, 20, `← ${PLAIN_TEXT.back}`, {
      ...FONT_CONFIG.hint,
      color: '#ff69b4',
    });
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setColor('#ff1493'));
    backBtn.on('pointerout', () => backBtn.setColor('#ff69b4'));
    backBtn.on('pointerdown', () => this.scene.start('MainMenu'));

    const resultBg = this.add.graphics();
    resultBg.fillStyle(BUNNY_COLORS.softPink, 0.95);
    resultBg.fillRoundedRect(width / 6, height / 5, width * 2 / 3, height * 3 / 5, 20);
    resultBg.lineStyle(4, BUNNY_COLORS.gold);
    resultBg.strokeRoundedRect(width / 6, height / 5, width * 2 / 3, height * 3 / 5, 20);

    const title = this.add.text(
      width / 2,
      height / 4 + 20,
      `🌟 ${PLAIN_TEXT.dailyChallenge} 🌟`,
      {
        ...FONT_CONFIG.title,
        fontSize: '32px',
        color: '#ff69b4',
      }
    );
    title.setOrigin(0.5);

    const completeText = this.add.text(
      width / 2,
      height / 3 + 20,
      `今日 ${MAX_DAILY_ATTEMPTS} 次挑戰已完成！`,
      {
        ...FONT_CONFIG.subtitle,
        fontSize: '22px',
        color: '#9370db',
      }
    );
    completeText.setOrigin(0.5);

    // 顯示三次成績
    let yPos = height / 2 - 20;
    this.todayChallenge.attempts.forEach((attempt, i) => {
      const attemptInfo = this.add.text(
        width / 2,
        yPos,
        `第 ${i + 1} 次：${attempt.score} 題 / ${attempt.totalTime} 秒`,
        {
          ...FONT_CONFIG.hint,
          fontSize: '18px',
          color: '#ff69b4',
        }
      );
      attemptInfo.setOrigin(0.5);
      yPos += 30;
    });

    // 最佳成績
    const bestAttempt = this.todayChallenge.attempts.reduce((best, curr) => {
      if (curr.score > best.score) return curr;
      if (curr.score === best.score && curr.totalTime < best.totalTime) return curr;
      return best;
    }, this.todayChallenge.attempts[0]);

    yPos += 10;
    const bestText = this.add.text(
      width / 2,
      yPos,
      `🏆 最佳：${bestAttempt.score} 題 / ${bestAttempt.totalTime} 秒`,
      {
        ...FONT_CONFIG.subtitle,
        fontSize: '20px',
        color: '#ffd700',
      }
    );
    bestText.setOrigin(0.5);

    // 獎勵
    yPos += 50;
    if (!this.todayChallenge.rewardClaimed) {
      this.createClaimButtonAtPosition(width / 2, yPos);
    } else {
      const claimedText = this.add.text(
        width / 2,
        yPos,
        `✨ ${PLAIN_TEXT.rewardClaimed} ✨`,
        {
          ...FONT_CONFIG.button,
          color: '#888888',
        }
      );
      claimedText.setOrigin(0.5);
    }
  }

  private createClaimButtonAtPosition(x: number, y: number): void {
    const bg = this.add.graphics();
    bg.fillStyle(BUNNY_COLORS.gold, 0.9);
    bg.fillRoundedRect(x - 120, y - 22, 240, 44, 22);
    bg.lineStyle(3, BUNNY_COLORS.coral);
    bg.strokeRoundedRect(x - 120, y - 22, 240, 44, 22);

    const btnText = this.add.text(x, y, `🎁 ${PLAIN_TEXT.claimReward}`, {
      ...FONT_CONFIG.button,
      fontSize: '20px',
    });
    btnText.setOrigin(0.5);

    const hitArea = this.add.rectangle(x, y, 240, 44, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });

    hitArea.on('pointerdown', () => {
      bgMusic.playClickSound();
      this.claimReward();
      bg.clear();
      bg.fillStyle(0x888888, 0.9);
      bg.fillRoundedRect(x - 120, y - 22, 240, 44, 22);
      btnText.setText(`✨ ${PLAIN_TEXT.rewardClaimed} ✨`);
      btnText.setColor('#ffffff');
      hitArea.removeInteractive();
    });
  }

  private claimReward(): void {
    this.todayChallenge.rewardClaimed = true;
    this.gameSave = updateDailyChallenge(this.gameSave, this.todayChallenge);

    const availableStickers = STICKERS.filter(
      s => !this.gameSave.progress.stickers.includes(s.id)
    );
    if (availableStickers.length > 0) {
      const randomSticker = Phaser.Utils.Array.GetRandom(availableStickers);
      this.gameSave = unlockSticker(this.gameSave, randomSticker.id);
      this.showRewardNotification(randomSticker.emoji, randomSticker.nameWithZhuyin);
    }

    saveGame(this.gameSave);
  }

  private showRewardNotification(emoji: string, name: string): void {
    const { width, height } = this.scale;

    const notification = this.add.text(
      width / 2,
      height * 0.85,
      `${PLAIN_TEXT.newUnlock}\n${emoji} ${name}`,
      {
        ...FONT_CONFIG.subtitle,
        align: 'center',
        backgroundColor: '#fff5f8',
        padding: { x: 20, y: 15 },
      }
    );
    notification.setOrigin(0.5);
    notification.setAlpha(0);

    this.tweens.add({
      targets: notification,
      alpha: 1,
      y: height * 0.8,
      duration: 500,
    });

    this.createCelebrationEffect();
  }
}
