import { defineConfig } from 'dumi';

const repo = 'hand-g4.gihub.io';

export default defineConfig({
  title: 'dumi-demo',
  favicon:
    'https://user-images.githubusercontent.com/9554297/83762004-a0761b00-a6a9-11ea-83b4-9c8ff721d4b8.png',
  logo: 'https://user-images.githubusercontent.com/9554297/83762004-a0761b00-a6a9-11ea-83b4-9c8ff721d4b8.png',
  outputPath: 'docs-dist',
  mode: 'site',
  // more config: https://d.umijs.org/config
  base: `/${repo}/`,
  publicPath: `/${repo}/`,
  resolve: {
    passivePreview: true,
  },
});
