const path = require('path');
import { defineConfig } from 'dumi';

const repo = 'hand-g4.gihub.io';

export default defineConfig({
  // 详细配置: https://d.umijs.org/config
  title: '前端四组',
  favicon: '/hand-logo.png', // 默认会指向项目根目录 /public
  logo: '/hand-logo.png', // 默认会指向项目根目录 /public
  outputPath: 'docs-dist',
  mode: 'site',
  base: `/${repo}/`,
  publicPath: process.env.NODE_ENV === 'production' ? `/${repo}/` : '/',
  styles: [`.__dumi-default-navbar-logo { background-size: 30% !important; }`],
  resolve: {
    passivePreview: true,
  },
  alias: {
    '@/': path.resolve(__dirname, './src/'),
  },
});
