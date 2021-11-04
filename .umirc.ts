const path = require('path');
import { defineConfig } from 'dumi';

const repo = 'hand-g4.gihub.io';
const basePath = `/${repo}/`;
const isProduction = process.env.NODE_ENV === 'production';
const logoUrl = (isProduction ? basePath : '/') + 'hand-logo.png';

export default defineConfig({
  // 详细配置: https://d.umijs.org/config
  title: '前端四组',
  favicon: logoUrl,
  logo: logoUrl,
  outputPath: 'docs-dist',
  mode: 'site',
  base: basePath,
  publicPath: isProduction ? basePath : '/',
  styles: [`.__dumi-default-navbar-logo { background-size: 30% !important; }`],
  resolve: { passivePreview: true },
  alias: {
    '@/': path.resolve(__dirname, './src/'),
  },
});
