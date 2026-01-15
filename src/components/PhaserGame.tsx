'use client';

import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from '@/game/config';

export default function PhaserGame() {
  const gameContainer = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!gameContainer.current || gameRef.current) return;

    // 創建 Phaser 遊戲實例
    const config = createGameConfig('game-container');
    gameRef.current = new Phaser.Game(config);

    // 遊戲載入完成
    gameRef.current.events.on('ready', () => {
      setIsLoading(false);
    });

    // 稍微延遲以確保 DOM 準備就緒
    setTimeout(() => {
      setIsLoading(false);
    }, 500);

    // 清理函數
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a0a2e] z-10">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">😈</div>
            <p className="text-pink-400 text-xl animate-pulse">
              載（ㄗㄞˇ）入（ㄖㄨˋ）中（ㄓㄨㄥ）...
            </p>
          </div>
        </div>
      )}
      <div
        id="game-container"
        ref={gameContainer}
        className="rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/50"
      />
    </div>
  );
}
