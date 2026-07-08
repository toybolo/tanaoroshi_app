import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // スマホ実機からLAN経由(http://<PCのIP>:3000)で開発サーバーへアクセスできるようにする
  allowedDevOrigins: ["192.168.3.8"],
};

export default nextConfig;
