import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  transpilePackages: ["@lobehub/ui", "@lobehub/fluent-emoji", "antd", "antd-style", "@ant-design"],
};

export default nextConfig;
