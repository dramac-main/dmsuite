import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  transpilePackages: ["@lobehub/ui", "antd", "antd-style", "@ant-design"],
};

export default nextConfig;
