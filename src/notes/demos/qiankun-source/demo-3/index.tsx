import React, { useEffect } from 'react';
import { registerMicroApps, start } from './mini-qiankun';

function Demo3() {
  useEffect(() => {
    registerMicroApps([
      {
        name: 'vue-demo',
        entry: 'https://linyun-git.github.io/mini-qiankun-demos/vue-demo/',
        container: '.container',
        activeRule: '/hand-g4.gihub.io/~demos/qiankun-source-demo-3/vue-demo',
      },
      {
        name: 'react-demo',
        entry: 'https://linyun-git.github.io/mini-qiankun-demos/react-demo/',
        container: '.container',
        activeRule: '/hand-g4.gihub.io/~demos/qiankun-source-demo-3/react-demo',
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
      '/hand-g4.gihub.io/~demos/qiankun-source-demo-3/vue-demo/#/',
    );
  };

  const handleMountReact = () => {
    history.pushState(
      {},
      '',
      '/hand-g4.gihub.io/~demos/qiankun-source-demo-3/react-demo/#/',
    );
  };

  const handleToOtherPage = () => {
    history.pushState({}, '', '/hand-g4.gihub.io/~demos/qiankun-source-demo-3');
  };

  return (
    <>
      <button onClick={handleMountVue}>mount Vue</button>
      <button onClick={handleMountReact}>mount React</button>
      <button onClick={handleToOtherPage}>other page</button>
      <div style={{ border: '1px solid red' }}>
        <h1>Container</h1>
        <div className="container" />
      </div>
    </>
  );
}

export default Demo3;
