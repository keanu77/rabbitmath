// 背景音樂管理器 - 使用 Web Audio API 生成多種風格的背景音樂

// 音樂類型定義
export type MusicType = 'cute' | 'cheerful' | 'adventure' | 'calm';

export interface MusicTypeInfo {
  id: MusicType;
  name: string;
  emoji: string;
  description: string;
}

// 音樂類型資訊
export const MUSIC_TYPES: MusicTypeInfo[] = [
  { id: 'cute', name: '可愛風', emoji: '🎀', description: '甜美可愛的旋律' },
  { id: 'cheerful', name: '歡樂風', emoji: '🎉', description: '活潑歡快的節奏' },
  { id: 'adventure', name: '冒險風', emoji: '⚔️', description: '充滿動感的音樂' },
  { id: 'calm', name: '平靜風', emoji: '🌙', description: '舒緩放鬆的曲調' },
];

// 音樂配置
interface MusicConfig {
  scale: number[];
  melodyPatterns: number[][];
  chordProgressions: number[][];
  tempo: number; // 毫秒
  waveType: OscillatorType;
}

const MUSIC_CONFIGS: Record<MusicType, MusicConfig> = {
  // 可愛風 - C 大調，甜美旋律
  cute: {
    scale: [
      261.63, // C4
      293.66, // D4
      329.63, // E4
      349.23, // F4
      392.00, // G4
      440.00, // A4
      493.88, // B4
      523.25, // C5
    ],
    melodyPatterns: [
      [0, 2, 4, 2, 0, 4, 3, 2],
      [4, 5, 4, 2, 0, 2, 4, -1],
      [0, 0, 4, 4, 5, 5, 4, -1],
      [2, 4, 5, 4, 2, 0, 2, -1],
    ],
    chordProgressions: [
      [0, 2, 4], // C
      [3, 5, 0], // F
      [4, 6, 1], // G
      [0, 2, 4], // C
    ],
    tempo: 300,
    waveType: 'triangle',
  },

  // 歡樂風 - G 大調，活潑節奏
  cheerful: {
    scale: [
      392.00, // G4
      440.00, // A4
      493.88, // B4
      523.25, // C5
      587.33, // D5
      659.25, // E5
      739.99, // F#5
      783.99, // G5
    ],
    melodyPatterns: [
      [0, 2, 4, 5, 4, 2, 0, -1],
      [4, 4, 5, 5, 4, 2, 0, 2],
      [0, 4, 0, 4, 5, 4, 2, 0],
      [2, 4, 2, 0, 2, 4, 5, 4],
    ],
    chordProgressions: [
      [0, 2, 4], // G
      [1, 3, 5], // Am
      [4, 6, 1], // D
      [0, 2, 4], // G
    ],
    tempo: 250,
    waveType: 'square',
  },

  // 冒險風 - D 小調，動感十足
  adventure: {
    scale: [
      293.66, // D4
      329.63, // E4
      349.23, // F4
      392.00, // G4
      440.00, // A4
      466.16, // Bb4
      523.25, // C5
      587.33, // D5
    ],
    melodyPatterns: [
      [0, 4, 3, 4, 0, 4, 7, 4],
      [4, 3, 4, 5, 4, 3, 0, -1],
      [0, 0, 4, 4, 0, 4, 3, 4],
      [7, 4, 3, 4, 0, 3, 4, 0],
    ],
    chordProgressions: [
      [0, 2, 4], // Dm
      [3, 5, 0], // Gm
      [4, 6, 1], // Am
      [0, 2, 4], // Dm
    ],
    tempo: 220,
    waveType: 'sawtooth',
  },

  // 平靜風 - F 大調，舒緩旋律
  calm: {
    scale: [
      349.23, // F4
      392.00, // G4
      440.00, // A4
      466.16, // Bb4
      523.25, // C5
      587.33, // D5
      659.25, // E5
      698.46, // F5
    ],
    melodyPatterns: [
      [0, 2, 4, 2, 0, -1, -1, -1],
      [4, 5, 4, 2, 0, -1, 2, -1],
      [0, 0, 2, 2, 4, -1, -1, -1],
      [4, 2, 0, -1, 2, 4, 2, -1],
    ],
    chordProgressions: [
      [0, 2, 4], // F
      [3, 5, 0], // Bb
      [4, 6, 1], // C
      [0, 2, 4], // F
    ],
    tempo: 400,
    waveType: 'sine',
  },
};

class BackgroundMusicManager {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentOscillators: OscillatorNode[] = [];
  private activeGainNodes: GainNode[] = [];
  private melodyTimeout: ReturnType<typeof setTimeout> | null = null;
  private melodyNoteTimeouts: ReturnType<typeof setTimeout>[] = [];
  private volume: number = 0.15;
  private currentMusicType: MusicType = 'cute';

  initialize(): void {
    if (typeof window === 'undefined') return;

    try {
      this.audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    } catch (e) {
      console.log('Web Audio API not supported');
    }
  }

  // 設定音樂類型
  setMusicType(type: MusicType): void {
    const wasPlaying = this.isPlaying;

    if (wasPlaying) {
      this.stop();
    }

    this.currentMusicType = type;

    if (wasPlaying) {
      this.start();
    }
  }

  getMusicType(): MusicType {
    return this.currentMusicType;
  }

  start(): void {
    if (this.isPlaying || !this.audioContext || !this.gainNode) return;

    // 確保 AudioContext 是 running 狀態
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.playBackgroundLoop();
  }

  stop(): void {
    this.isPlaying = false;

    // 清除主循環 timeout
    if (this.melodyTimeout) {
      clearTimeout(this.melodyTimeout);
      this.melodyTimeout = null;
    }

    // 清除所有旋律音符的 timeouts
    this.melodyNoteTimeouts.forEach(t => clearTimeout(t));
    this.melodyNoteTimeouts = [];

    // 停止並斷開所有 oscillators
    this.currentOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // 已經停止
      }
    });
    this.currentOscillators = [];

    // 斷開所有 gain nodes
    this.activeGainNodes.forEach(node => {
      try {
        node.disconnect();
      } catch {
        // 已經斷開
      }
    });
    this.activeGainNodes = [];
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    }
  }

  toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private getConfig(): MusicConfig {
    return MUSIC_CONFIGS[this.currentMusicType];
  }

  private playBackgroundLoop(): void {
    if (!this.isPlaying || !this.audioContext || !this.gainNode) return;

    // 播放背景和弦
    this.playChord();

    // 播放旋律
    this.playMelody();
  }

  private playChord(): void {
    if (!this.audioContext || !this.gainNode) return;

    const config = this.getConfig();
    const chordIndex = Math.floor(Math.random() * config.chordProgressions.length);
    const chord = config.chordProgressions[chordIndex];

    chord.forEach((noteIndex, i) => {
      const freq = config.scale[noteIndex] / 2; // 低八度
      this.playNote(freq, 0.05, 2.0, 'sine', i * 0.05);
    });
  }

  private playMelody(): void {
    if (!this.isPlaying) return;

    const config = this.getConfig();
    const pattern = config.melodyPatterns[Math.floor(Math.random() * config.melodyPatterns.length)];
    const noteDuration = config.tempo;
    const totalDuration = pattern.length * noteDuration;

    pattern.forEach((noteIndex, i) => {
      if (noteIndex >= 0) {
        const timeoutId = setTimeout(() => {
          if (this.isPlaying) {
            const freq = config.scale[noteIndex];
            this.playNote(freq, 0.08, 0.25, config.waveType);
          }
        }, i * noteDuration);
        this.melodyNoteTimeouts.push(timeoutId);
      }
    });

    // 下一個循環
    this.melodyTimeout = setTimeout(() => {
      // 清理已完成的 timeouts
      this.melodyNoteTimeouts = [];
      this.playBackgroundLoop();
    }, totalDuration + 200);
  }

  private playNote(
    frequency: number,
    volume: number,
    duration: number,
    type: OscillatorType = 'sine',
    delay: number = 0
  ): void {
    if (!this.audioContext || !this.gainNode) return;

    const oscillator = this.audioContext.createOscillator();
    const noteGain = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime + delay);

    noteGain.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
    noteGain.gain.linearRampToValueAtTime(volume * this.volume, this.audioContext.currentTime + delay + 0.05);
    noteGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + delay + duration);

    oscillator.connect(noteGain);
    noteGain.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime + delay);
    oscillator.stop(this.audioContext.currentTime + delay + duration);

    this.currentOscillators.push(oscillator);
    this.activeGainNodes.push(noteGain);

    // 清理已停止的 oscillator 和 gain node
    setTimeout(() => {
      // 清理 oscillator
      const oscIndex = this.currentOscillators.indexOf(oscillator);
      if (oscIndex > -1) {
        this.currentOscillators.splice(oscIndex, 1);
        try {
          oscillator.disconnect();
        } catch { /* 已斷開 */ }
      }
      // 清理 gain node
      const gainIndex = this.activeGainNodes.indexOf(noteGain);
      if (gainIndex > -1) {
        this.activeGainNodes.splice(gainIndex, 1);
        try {
          noteGain.disconnect();
        } catch { /* 已斷開 */ }
      }
    }, (delay + duration) * 1000 + 100);
  }

  // 播放成功音效
  playSuccessSound(): void {
    if (!this.audioContext) {
      this.initialize();
    }
    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      this.playNote(freq, 0.2, 0.3, 'sine', i * 0.1);
    });
  }

  // 播放錯誤提示音效
  playTryAgainSound(): void {
    if (!this.audioContext) {
      this.initialize();
    }
    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.playNote(311.13, 0.15, 0.2, 'triangle');
    this.playNote(293.66, 0.15, 0.3, 'triangle', 0.15);
  }

  // 播放裝備音效
  playEquipSound(): void {
    if (!this.audioContext) {
      this.initialize();
    }
    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.playNote(440, 0.15, 0.15, 'sine');
    this.playNote(880, 0.15, 0.2, 'sine', 0.1);
  }

  // 播放按鈕點擊音效
  playClickSound(): void {
    if (!this.audioContext) {
      this.initialize();
    }
    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.playNote(600, 0.1, 0.08, 'sine');
  }
}

// 單例模式
export const bgMusic = new BackgroundMusicManager();
