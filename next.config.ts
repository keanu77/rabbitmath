import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // 靜態導出設定
  output: 'export',

  // GitHub Pages 部署時的路徑（改成你的 repo 名稱）
  // 如果部署到 username.github.io/repo-name，需要設定 basePath
  basePath: isProd ? '/kuromi-math' : '',
  assetPrefix: isProd ? '/kuromi-math/' : '',

  // 禁用圖片優化（靜態導出不支援）
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
