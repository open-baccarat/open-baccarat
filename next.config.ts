import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // 配置 serverless 函数以支持 Puppeteer
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  },
  // 排除 chromium 二进制文件的打包分析
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 排除 chromium 相关模块的打包
      config.externals = config.externals || [];
      config.externals.push('@sparticuz/chromium');
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
