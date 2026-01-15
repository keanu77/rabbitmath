'use client';

import dynamic from 'next/dynamic';

// 動態載入 Phaser 遊戲組件（禁用 SSR）
const PhaserGame = dynamic(() => import('@/components/PhaserGame'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#1a0a2e]">
      <div className="text-center">
        <div className="text-8xl mb-6 animate-bounce">😈</div>
        <p className="text-pink-400 text-2xl animate-pulse font-medium">
          載（ㄗㄞˇ）入（ㄖㄨˋ）中（ㄓㄨㄥ）...
        </p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#1a0a2e] via-[#2d1b4e] to-[#0f051a] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl aspect-[4/3]">
        <PhaserGame />
      </div>
    </main>
  );
}
