import React, { useEffect } from 'react';
import { registerMicroApps, start } from './app';

function Demo2() {
  useEffect(() => {
    registerMicroApps([
      {
        name: 'vue-demo',
        entry: 'https://linyun-git.github.io/mini-qiankun-demos/vue-demo/',
        container: '.container',
        activeRule: '/dumi-demo/~demos/qiankun-source-demo-2/vue-demo',
      },
      {
        name: 'react-demo',
        entry: 'https://linyun-git.github.io/mini-qiankun-demos/react-demo/',
        container: '.container',
        activeRule: '/dumi-demo/~demos/qiankun-source-demo-2/react-demo',
      },
    ]);
    start();

    // 这里是为了在子应用初始化时不自动挂载，后面会介绍，请先忽略
    (window as any).__POWERED_BY_QIANKUN__ = true;
  }, []);

  const handleMountVue = () => {
    // 这里必须把hash路由写全，不然vue-router初始化时自动调用replaceState方法导致递归
    history.pushState(
      {},
      '',
      '/dumi-demo/~demos/qiankun-source-demo-2/vue-demo/#/',
    );
  };

  const handleMountReact = () => {
    history.pushState(
      {},
      '',
      '/dumi-demo/~demos/qiankun-source-demo-2/react-demo/#/',
    );
  };

  const handleToOtherPage = () => {
    history.pushState({}, '', '/dumi-demo/~demos/qiankun-source-demo-2');
  };

  return (
    <>
      <button onClick={handleMountVue}>mount Vue</button>
      <button onClick={handleMountReact}>mount React</button>
      <button onClick={handleToOtherPage}>other page</button>
      <div className="container" />
    </>
  );
}

export default Demo2;
