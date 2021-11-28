---
title: 7、qiankun从原理到源码
order: 7
---

# qiankun 从原理到源码

[qiankun](https://qiankun.umijs.org/) 是一个基于 [single-spa](https://single-spa.js.org/) 的微前端实现库。
`single-spa`提供了`JS`入口、子应用生命周期管理等微前端基本功能。在这基础上，`qiankun`又实现了`html`入口、样式隔离、运行环境隔离、资源预加载和全局状态管理等，
来帮助大家更简单、无痛的构建一个生产可用微前端架构系统。可以说，`qiankun`是目前最完善的微前端解决方案之一。

在项目结构上，`qiankun`基于`single-spa`实现，又将部分功能提取为 [import-html-entry](https://github.com/kuitos/import-html-entry) 项目，不利于源码学习者了解`qiankun`实现微前端的完整流程。
本文将无关不同项目模块，从整体上介绍`qiankun`提供微前端服务的原理。

## 背景

考虑这样一种情况：你正在维护一个`angularjs`开发的前端项目，经过多年的发展，这个项目已然十分庞大。现在，你接到一个任务：需要往项目中新增一个模块。
我们可以使用原有技术开发新模块，但将不得不忍受过时技术可能存在的开发效率低、组件库不再受支持等问题。那如何才能使用新技术开发新模块，并与原有项目聚合为一个整体呢？
微前端给出了解决方案：新的模块在新项目中单独开发并部署，开发完成后再嵌入原有项目。在将子应用嵌入原项目时，我们也可以使用`iframe`，但这存在一些问题。

### 子模块

本文拟将如下子模块如何嵌入父应用作为线索介绍`qiankun`提供微前端服务的完整流程。子模块如下：

- [Vue 模块](https://linyun-git.github.io/mini-qiankun-demos/vue-demo/)
- [React 模块](https://linyun-git.github.io/mini-qiankun-demos/react-demo/)

子模块源码已托管到[github](https://github.com/linyun-git/mini-qiankun-demos)上。

### 使用 iframe 嵌入页面

`iframe`的`src`属性接收子模块的部署地址，使用`iframe`嵌入子模块的效果如下。不难发现：子应用的弹框无法超出`iframe`区域，
我们虽然可以在子应用与父应用间建立联系并在父应用中构建弹框，但这也将不可避免地对子应用和父应用产生侵入性影响，也不利于子模块单独调试。
事实上使用`iframe`嵌入子应用还有更多问题，详情可以查看[这里](https://www.yuque.com/kuitos/gky7yw/gesexv)。

```tsx | preview
import React from 'react';

const style = {
  width: '100%',
  border: 'none',
  minHeight: '310px',
};

export default () => (
  <iframe
    style={style}
    src="https://linyun-git.github.io/mini-qiankun-demos/react-demo/"
  ></iframe>
);
```

### 手动加载子应用

使用`iframe`实现微前端存在很多问题，而这些问题在`qiankun`中都不复存在，下面将介绍`qiankun`如何处理这些问题并实现微前端。

## 加载子应用

### 加载入口`html`

子应用最终会被部署到一个线上地址，从这个地址可以获取到子应用的入口`html`文件。将这个文件中的文本内容插入文档中就可以呈现子应用的`dom`结构。
那么我们首先可以从子应用的入口地址获取子应用的`html`文本，这里使用 [fetch](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API) 实现，代码如下。

```typescript
function getEntryHTML(entry: string): Promise<string> {
  return fetch(entry).then((rep) => rep.text());
}

getEntryHTML(
  'https://linyun-git.github.io/mini-qiankun-demos/react-demo/',
).then((html) => console.log(html));
```

从[React 子应用](https://linyun-git.github.io/mini-qiankun-demos/react-demo/) 获取到的`html`文本如下。

```text
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <link href="/favicon.ico" rel="icon"/>
  <meta content="width=device-width,initial-scale=1" name="viewport"/>
  <meta content="#000000" name="theme-color"/>
  <meta content="Web site created using create-react-app" name="description"/>
  <link href="/logo192.png" rel="apple-touch-icon"/>
  <link href="/manifest.json" rel="manifest"/>
  <title>React App</title>
  <link href="/static/css/2.4eb19277.chunk.css" rel="stylesheet">
  <link href="/static/css/main.2f865207.chunk.css" rel="stylesheet">
</head>
<body>
<noscript>You need to enable JavaScript to run this app.</noscript>
<div id="root"></div>
<script>
// 省略...
</script>
<script src="/static/js/2.cd7f5aad.chunk.js"></script>
<script src="/static/js/main.8eaafa86.chunk.js"></script>
</body>
</html>
```

### 补全引用资源地址

`html`文件中会引入其他资源，比如 css 和 js 文件。如果直接将获取到的`html`文本插入父应用`dom`中，浏览器也会自动解析并请求这些文件。
但为了让浏览器正确解析仍需要对引入资源进行一些修改。

#### 补全静态资源地址

`html`文件中引用其他资源的地址通常不是完整的`url`，而是会根据当前文档所在地址调整的相对地址。
这将导致浏览器错误地根据父应用所在地址解析完整路径并请求。我们需要在插入子应用`html`前将其中引用资源的相对地址替换为完整的`url`。
实现代码如下。

```typescript
const HREF_REG = /(href|src)=('|")(\S+?)\2/g; // 匹配指src和href属性，如 href="/favicon.ico"

/**
 * 将资源地址解析为带域信息的地址
 * 比如：
 * ./index.js -> https://linyun-git.github.io/mini-qiankun-demos/react16/index.js
 * /mini-qiankun-demos/react16/index.css -> https://linyun-git.github.io/mini-qiankun-demos/react16/index.css
 */
function getEntirePath(href: string, entry: string) {
  return new URL(href, entry).toString();
}

async function getEntryHTML(entry: string): Promise<string> {
  try {
    const html = await fetch(entry).then((rep) => rep.text());
    return html.replace(HREF_REG, ($0, $1, $2, $3) => {
      return `${$1}=${$2}${getEntirePath($3, entry)}${$2}`;
    });
  } catch (e) {
    return '';
  }
}
```

#### 补全动态引用资源地址

子应用中也存在不直接在`html`文件中声明，而是根据需要动态加载的资源，我们也需要对这部分地址进行补全。
`webpack`提供了运行时修改`publicPath`的功能，更多技术细节可以查阅[webpack 文档](https://webpack.js.org/guides/public-path/#on-the-fly)。
为了让动态引用的资源正确加载，我们需要与子应用约定：当子应用运行被父应用加载时，需要根据父应用提供的地址修改运行时`publicPath`。
父应用实现代码如下，子应用如何修改运行时`publicPath`可以参考[这里](https://qiankun.umijs.org/zh/faq#a-%E4%BD%BF%E7%94%A8-webpack-%E8%BF%90%E8%A1%8C%E6%97%B6-publicpath-%E9%85%8D%E7%BD%AE)。

```typescript
// 修改getEntryHTML方法以在加载时修改子应用运行时publicPath。
async function getEntryHTML(entry: string): Promise<string> {
  try {
    const html = await fetch(entry).then((rep) => rep.text());
    // 绑定子应用运行时publicPath
    window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__ = entry;
    return html.replace(HREF_REG, ($0, $1, $2, $3) => {
      return `${$1}=${$2}${getEntirePath($3, entry)}${$2}`;
    });
  } catch (e) {
    return '';
  }
}
```

### 替换无法解析的 dom

`html`中存在一些全局只能存在一个的标签，比如`head`和`body`。由于父应用中已经存在这些标签，那么在将子应用的`html`插入`dom`时浏览器会忽略子应用的这些标签。
为了保证子应用的`dom`结构，我们可以将这些特殊标签替换为其他标签。这里将`head`标签和`body`标签均替换为`div`，并添加特殊属性方便查询，实现代码如下。

```typescript
const HEAD_TAG = /<(head)(.*?\\)\1>/gi; // 匹配head标签
const BODY_TAG = /<(body)(.*?\\)\1>/gi; // 匹配body标签

// 修改getEntryHTML方法以在加载时替换特殊标签。
async function getEntryHTML(entry: string): Promise<string> {
  try {
    const html = await fetch(entry).then((rep) => rep.text());
    window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__ = entry;
    return html
      .replace(HREF_REG, ($0, $1, $2, $3) => {
        return `${$1}=${$2}${getEntirePath($3, entry)}${$2}`;
      })
      .replace(HEAD_TAG, ($0, $1, $2) => {
        return `<div mini-qiankun-head ${$2} div>`;
      })
      .replace(BODY_TAG, ($0, $1, $2) => {
        return `<div mini-qiankun-body ${$2} div>`;
      });
  } catch (e) {
    return '';
  }
}
```

### 解析 script 标签

在得到资源地址正确的`html`文件后，我们可以直接使用`innerHTML`将其嵌入父应用中。一般情况下，`html`标签都会被正确解析，但通过这种方式生成的`script`标签不会请求资源文件，也不会执行`JS`代码。
鉴于此，我们可以创建新的`script`标签并使用`appendChild`方法（使用`appendChild`添加到页面上的`script`标签是会被正确解析并执行的）将其添加到页面中。
另外，后出现的`script`可能依赖于前面`script`的执行，为了保证执行顺序，我们可以在请求`JS`文件后统一处理。实现代码如下。

```typescript
const ALL_SCRIPT_REGEX = /<script.*?>(.*?)<\/script>/gis; // 匹配所有script标签
const SCRIPT_SRC_REG = /\ssrc=(['"])\s*?(\S+)\s*?\1/i; // 匹配带src属性的script标签

/**
 * 解析html文件中的script标签，返回不包含script标签的html文本和所有script引用的代码
 * @param html html文件
 */
async function parseHTMLScript(html: string) {
  const scriptsTemp: string[] = [];
  const pureHtml = html.replace(ALL_SCRIPT_REGEX, ($0, $1) => {
    if (SCRIPT_SRC_REG.test($0)) {
      scriptsTemp.push({
        async: true,
        src: $0.match(SCRIPT_SRC_REG)[2],
      });
    } else {
      scriptsTemp.push($1);
    }
    // 原标签没用了，直接注释掉
    return `<!-- ${$0} -->`;
  });
  const scripts = await Promise.all(
    scriptsTemp.map((temp) => {
      return temp.async ? fetch(temp.src).then((rep) => rep.text()) : temp;
    }),
  );
  return [pureHtml, scripts] as const;
}
```

### 嵌入子应用并执行脚本

至此，我们已经能够正确解析子应用的入口文件，只需将子应用的`html`插入它应该出现的位置并执行脚本即可。实现代码如下。

```typescript
/**
 * 加载一个子应用
 * @param entry 子应用的入口文件地址
 * @param container 子应用要挂载的容器
 */
async function mountEntry(entry: string, container: HTMLElement) {
  const html = await getEntryHTML(entry);
  const [pureHtml, scriptTextArr] = await parseHTMLScript(html);
  const scripts = scriptTextArr.map((scriptText) => {
    const scriptDom = document.createElement('script');
    scriptDom.innerHTML = scriptText;
    return scriptDom;
  });
  container.innerHTML = pureHtml;
  scripts.forEach((script) => {
    container.appendChild(script);
  });
}
```

你可以通过下面的例子验证目前的代码。

<Alert type="info">
  注：为了防止污染文档，该 demo 仍在<code>iframe</code>中运行。可以从 demo 的选项中选择在新的标签页查看。
</Alert>

<Alert type="info">
  注：由于挂载容器与父应用冲突，React子应用暂时无法挂载，稍后将解决。
</Alert>

<code src="./demos/qiankun-source/demo-1" iframe="true"></code>

上面的 demo 已经能够成功加载子应用，但也存在一些问题：

1. 同一个子应用再次挂载时会重新请求和解析资源文件。
2. React 子应用无法挂载，但影响了父应用的样式。

接下来我们将解决这些问题。

## 子应用生命周期

现在，每个子应用在挂载时都会请求并解析全部的资源文件，即便是子应用重新挂载时。实际上这是不必要的，子应用依赖的全局对象应该只创建一次，比如`React`，之后挂载只需重新执行`render`。
为了解决这个问题，我们不得不让子应用做出一些更改：子应用需要导出一些生命周期函数，并让父应用在恰当的时候执行。
基于此，我们可以将生命周期函数分为以下三种：

- bootstrap: 在子应用初始化时执行一次，用于初始化全局变量。
- mount: 子应用每次挂载时执行，用于渲染 DOM。
- unmount: 子应用卸载时执行，用于销毁挂载时创建的实例，避免内存泄露。

既然确定了有哪些生命周期函数，接下来就是让父应用拿到子应用的生命周期函数。我们可以直接将子应用的生命周期函数挂载到 window 上，但这不利于规范。
一般的做法是让子应用暴露出一个模块，从模块获取子应用的生命周期函数。这里使用`umd`模块规范，如何将一个`React`应用输出为`umd`模块可以参考[这里](https://qiankun.umijs.org/zh/guide/tutorial#react-%E5%BE%AE%E5%BA%94%E7%94%A8)。

### 从子应用加载应用模块

在`umd`模块规范下，子应用执行后会将模块挂载在`window`对象上，我们可以观察`window`属性的变化来获取子应用暴露出的模块。执行子模块脚本并获取应用模块的实现如下：

```typescript
/**
 * 执行脚本并获取子应用导出的生命周期函数
 * @param scripts JS脚本
 */
export function execScripts(scripts: string[]) {
  for (let i = 0; i < scripts.length; i++) {
    const exec = new Function(scripts[i]);
    exec();
  }
  const keys = Object.keys(window);
  const moduleName = keys[keys.length - 1];
  return window[moduleName as any];
}
```

<Alert type="info">
  注：<code>webpack</code>会将应用及其依赖输出为多个模块，应用自身暴露出的模块通常是最后一个，这里根据<code>Object.keys</code>方法返回的顺序判断来获取最后一个被挂载到<code>window</code>上的模块，但这是不安全的。
根据浏览器实现不同，<code>Object.keys</code>返回键名的顺序可能是不同的，稍后我们将通过代理<code>window</code>实现。
</Alert>

### 子应用状态

为了判断子应用应该执行哪个生命周期函数，我们需要记录子应用的状态。现将子应用分为如下状态：

```typescript
enum APP_STATUS {
  NOT_LOADED = 'NOT_LOADED', // 尚未加载资源
  LOADING_SOURCE_CODE = 'LOADING_SOURCE_CODE', // 请求资源中
  NOT_BOOTSTRAPPED = 'NOT_BOOTSTRAPPED', // 尚未初始化
  NOT_MOUNTED = 'NOT_MOUNTED', // 尚未挂载
  MOUNTED = 'MOUNTED', // 已挂载
}
```

子应用生命周期变化如下：

- 加载资源: NOT_LOADED -> LOADING_SOURCE_CODE
- 资源加载完成: LOADING_SOURCE_CODE -> NOT_BOOTSTRAPPED
- 初次挂载: NOT_BOOTSTRAPPED -> NOT_MOUNTED -> MOUNTED
- 卸载: MOUNTED -> NOT_MOUNTED
- 再次挂载: NOT_MOUNTED -> MOUNTED

### 多子应用管理

一个父应用通常包含多个子应用，我们可以按路由拆分子应用。父应用只需提供子应用的入口，每次路由切换自动执行子应用生命周期函数。

#### 提供统一注册应用入口

提供统一的注册子应用的函数供父应用一次性注册多个子应用。

```typescript
// 子应用现在不仅是一个入口地址，还包含它的当前状态、生命周期函数等，我们可以将子应用保存在一个数据结构中。
interface SubApp {
  name: string; // 为子应用命名，方便管理
  entry: string; // 子应用入口
  status: APP_STATUS; // 子应用激活路由
  template: string; // 子应用html模板
  activeRule: string | (() => boolean); // 子应用激活路由
  container: string; // 子应用挂载容器
  bootstrap(): Promise<null>; // 生命周期函数
  mount(): Promise<null>;
  unmount(): Promise<null>;
}

// 注册子应用需要的参数
interface RegistrableApp {
  name: string; // 为子应用命名，方便管理
  entry: string; // 子应用入口
  activeRule: string; // 子应用激活路由
  container: string; // 子应用挂载容器
}

const subApps: SubApp[] = [];

/**
 * 注册子应用
 * @param registrableApps 子应用元数据
 */
export function registerMicroApps(registrableApps: RegistrableApp[]) {
  subApps.push(
    ...registrableApps.map((app) => {
      return {
        ...app,
        status: APP_STATUS.NOT_LOADED,
        template: '',
        bootstrap: async () => null,
        mount: async () => null,
        unmount: async () => null,
      };
    }),
  );
}
```

#### 监听路由变化

我们需要在路由变化时加载子应用并执行子应用的生命周期函数。父应用可能使用`history`模式的路由也可能使用`hash`模式的路由，这里只考虑`history`模式。
`history`模式下，我们可以通过监听`popstate`事件来响应路由变化，但使用`pushState`方法和`replaceState`方法改变路由时不会抛出`popstate`事件。
我们可以通过重写来拦截这两个方法，更多内容可以参考这篇[教程](https://juejin.cn/post/6844903749421367303)。实现代码如下：

```typescript
let listenning = false;
let listeners: EventListener[] = [];
let globalListener: EventListener;
let originPushState: (data: any, title: string, url?: string | null) => void;
let originReplaceState: (data: any, title: string, url?: string | null) => void;

/**
 * 增加事件监听
 * @param listener 监听器
 */
export function listenHistoryChange(listener: EventListener) {
  listeners.push(listener);
  if (listenning) {
    return;
  }

  // 统一执行监听函数
  globalListener = function (this: Window, ...args) {
    // @ts-ignore
    listeners.forEach((fn) => fn.apply(this, ...args));
  };
  window.addEventListener('popstate', globalListener);

  // 拦截pushState，并执行一遍监听函数
  originPushState = window.history.pushState;
  window.history.pushState = function () {
    // @ts-ignore
    originPushState.apply(this, arguments);
    const event = new CustomEvent('popstate');
    Object.assign(event, {
      state: window.history.state,
    });
    // @ts-ignore
    globalListener.apply(window, event);
  };

  // 拦截replaceState，并执行一遍监听函数
  originReplaceState = window.history.replaceState;
  window.history.replaceState = function () {
    // @ts-ignore
    originReplaceState.apply(this, arguments);
    const event = new CustomEvent('popstate');
    Object.assign(event, {
      state: window.history.state,
    });
    // @ts-ignore
    globalListener.apply(window, event);
  };
}

/**
 * 取消事件监听
 * @param listener 监听器
 */
export function unlistenHistoryChange(listener: EventListener) {
  if (!listenning) {
    return;
  }
  listeners = listeners.filter((fn) => fn !== listener);
}
```

#### 执行子应用生命周期函数

每次路由变化时，我们可以根据子应用的当前状态和子应用的激活路由来判断当前应该挂载的和卸载的子应用，并执行它们的生命周期函数。实现代码如下：

```typescript
/**
 * 获取子应用的挂载容器
 * @param app 子应用
 */
function getContainer(app: SubApp) {
  return document.querySelector(app.container)!;
}

/**
 * 根据路由判断子应用是否应该激活
 * @param app 子应用
 */
function shouldBeActive(app: SubApp) {
  if (typeof app.activeRule === 'string') {
    return location.pathname.startsWith(app.activeRule);
  } else {
    return app.activeRule();
  }
}

/**
 * 根据当前路由判断应该挂载、应该卸载的子应用
 * @param apps
 */
function getAppChanges(apps: SubApp[]) {
  const appsToUnmount: SubApp[] = [];
  const appsToLoad: SubApp[] = [];
  const appsToBootstrap: SubApp[] = [];
  const appsToMount: SubApp[] = [];
  apps.forEach((app) => {
    const appShouldBeActive = shouldBeActive(app);
    switch (app.status) {
      case APP_STATUS.NOT_LOADED:
        if (appShouldBeActive) {
          appsToLoad.push(app);
          appsToBootstrap.push(app);
          appsToMount.push(app);
        }
        break;
      case APP_STATUS.NOT_BOOTSTRAPPED:
        if (appShouldBeActive) {
          appsToBootstrap.push(app);
          appsToMount.push(app);
        }
        break;
      case APP_STATUS.NOT_MOUNTED:
        if (appShouldBeActive) {
          appsToMount.push(app);
        }
        break;
      case APP_STATUS.MOUNTED:
        if (!appShouldBeActive) {
          appsToUnmount.push(app);
        }
        break;
    }
  });
  return {
    appsToUnmount,
    appsToLoad,
    appsToBootstrap,
    appsToMount,
  };
}

/**
 * 根据当前路由执行子应用生命周期函数
 * @param apps 所有子应用
 */
async function reroute(apps: SubApp[]) {
  const { appsToUnmount, appsToLoad, appsToBootstrap, appsToMount } =
    getAppChanges(apps);
  // 执行卸载需要删除上一次挂载容器，部分框架从页面卸载时不会自动删除dom，比如vue
  await Promise.all(
    appsToUnmount.map(async (app) => {
      await app.unmount();
      Array.from(getContainer(app).children).forEach((child) => child.remove());
      Object.assign(app, {
        status: APP_STATUS.NOT_MOUNTED,
      });
    }),
  );
  // 从入口加载文件，并将执行得到的生命周期函数存到apps中
  await Promise.all(
    appsToLoad.map(async (app) => {
      const { template, execScripts } = await importEntry(app.entry);
      // 将注入运行时publicPath推迟到子应用代码执行前
      (window as any).__INJECTED_PUBLIC_PATH_BY_QIANKUN__ = app.entry;
      const module = execScripts();
      Object.assign(app, module, {
        template,
        status: APP_STATUS.NOT_BOOTSTRAPPED,
      });
    }),
  );
  await Promise.all(
    appsToBootstrap.map(async (app) => {
      await app.bootstrap();
      Object.assign(app, {
        status: APP_STATUS.NOT_MOUNTED,
      });
    }),
  );
  // 要挂载的应用先将html模板插入页面再执行mount方法，以免找不到挂载节点
  await Promise.all(
    appsToMount.map(async (app) => {
      const div = document.createElement('div');
      div.innerHTML = app.template;
      getContainer(app).appendChild(div);
      await app.mount();
      Object.assign(app, {
        status: APP_STATUS.MOUNTED,
      });
    }),
  );
}

/**
 * 开启监听路由并切换子应用
 */
export function start() {
  reroute(subApps);
  listenHistoryChange(() => reroute(subApps));
}
```

请通过下面的例子验证目前为止的代码，请尝试通过点击`mount Vue`和`other page`按钮来观察重新挂载子应用的过程。

<code src="./demos/qiankun-source/demo-2" iframe="true"></code>

## CSS 沙箱

### Shadow Dom 实现样式隔离

接下来解决子应用影响父应用样式的问题。目前，子应用会被直接添加到 dom 中，包括`link`标签和`style`标签。其中的`CSS`选择器同样也会匹配到父应用中的元素。
我们可以修改子应用样式的选择器，添加只查找子应用挂载容器内的元素。也可以使用更简洁的方法：直接将子应用挂载到[shadow dom](https://developer.mozilla.org/zh-CN/docs/Web/Web_Components/Using_shadow_DOM)下，
`shadow dom`是一个天然的`CSS`隔离环境。其中的样式规则不会影响到外部，同时外部的样式规则也无法作用到`shadow dom`之内。这里使用`shadow dom`来实现样式隔离。

我们需要修改子应用的挂载方法，并将子应用的`html`文本改为插入`shadow dom`中。具体代码如下：

```typescript
/**
 * 创建一个包含shadow dom的节点
 * @param template 放入shadow dom中的内容
 */
function createShadowRoot(template: string): HTMLDivElement {
  const div = document.createElement('div');
  const shadowDom = div.attachShadow({ mode: 'open' });
  shadowDom.innerHTML = template;
  return div;
}

// 新增数据结构，用于保存沙箱相关结构
class Sandbox {
  mountRoot: HTMLDivElement;

  constructor(template: string) {
    this.mountRoot = createShadowRoot(template);
  }
}

// 修改子应用结构，将沙箱保存到子应用上
interface SubApp {
  name: string;
  entry: string;
  status: APP_STATUS;
  template: string;
  activeRule: string | (() => boolean);
  container: string;
  sandbox?: Sandbox; // 沙箱环境
  bootstrap(): Promise<null>;
  mount(): Promise<null>;
  unmount(): Promise<null>;
}

// 修改reroute方法
async function reroute(apps: SubApp[]) {
  const { appsToUnmount, appsToLoad, appsToBootstrap, appsToMount } =
    getAppChanges(apps);

  // 执行卸载
  // 省略。。。

  // 加载资源文件
  // 省略。。。

  // 执行初始化
  // 省略。。。

  // 每次挂载沙箱节点
  await Promise.all(
    appsToMount.map(async (app) => {
      if (!app.sanbox) {
        app.sanbox = new Sandbox(app.template);
      }
      getContainer(app).appendChild(app.sanbox.mountRoot);
      await app.mount();
      Object.assign(app, {
        status: APP_STATUS.MOUNTED,
      });
    }),
  );
}
```

### document 代理

现在，我们已经成功将子应用的`html`文本插入`shadow dom`中，但此时子应用是无法挂载的，因为子应用中使用`document.querySelector`无法查询到`shadow dom`中的元素。
可以通过以下方式解决：

- 与子应用约定，当作为子应用挂载时查询挂载节点的根节点从`mount`方法传入。这很容易实现，因为挂载子应用时就是执行的子应用的`mount`方法，修改传参即可。
- 对子应用的`document`对象进行代理，限制代理对象的查询行为。目前这种方式实现比较复杂，但对子应用影响更小。

<Alert type="info">
  注：对document对象进行代理可以解决很多问题，比如限制子应用插入新标签的位置。但qiankun并没有使用代理document的方式，而是使用更多额外逻辑去处理。
  理由是一些极端情况下对document进行代理会产生意外，详情可以看<a href='https://github.com/umijs/qiankun/pull/846'>这里</a>。这里暂不考虑这种情况。
</Alert>

<Alert type="info">
  注：在浏览器中，部分原生函数的执行上下文依赖于原生对象，直接通过代理对象调用时会抛出<code>Illegal invocation</code>异常，因此在返回原生函数前需要进行<code>bind</code>操作。
</Alert>

这里使用代理`document`对象的方式实现。首先，创建一个`document`对象的代理，并拦截节点查询方法。
为了不让子应用动态插入的标签直接插入父应用中，这里同时也对获取`head`元素和`body`元素进行了拦截，返回之前替换过的一般元素。

```typescript
// 创建一个document的代理对象，并对查询节点的方法进行代理。
function createDocumentProxy(
  rootDom: ShadowRoot,
  rawDocument = document,
): Document {
  const proxyMap = new Map();
  proxyMap.set('getElementsByName', (name: string) =>
    rootDom.querySelectorAll(`[name=${name}]`),
  );
  proxyMap.set('getElementsByClassName', (className: string) =>
    rootDom.querySelectorAll(`.${className}`),
  );
  proxyMap.set('getElementsByTagName', (tagName: string) => {
    if (tagName === 'body') {
      return rootDom.querySelectorAll('[mini-qiankun-body]');
    }
    if (tagName === 'head') {
      return rootDom.querySelectorAll('[mini-qiankun-head]');
    }
    return rootDom.querySelectorAll(tagName);
  });
  proxyMap.set('querySelector', (selector: string) => {
    if (selector === 'body') {
      return rootDom.querySelector('[mini-qiankun-body]');
    }
    if (selector === 'head') {
      return rootDom.querySelector('[mini-qiankun-head]');
    }
    return rootDom.querySelector(selector);
  });
  proxyMap.set('body', rootDom.querySelector('[mini-qiankun-body]'));
  proxyMap.set('head', rootDom.querySelector('[mini-qiankun-head]'));

  return new Proxy(rawDocument, {
    get(target, p, receiver) {
      if (proxyMap.has(p)) {
        return proxyMap.get(p);
      }
      if (p in rootDom) {
        // @ts-ignore
        const rootValue = rootDom[p];
        if (
          rootValue instanceof Function &&
          !rootValue.name.startsWith('bound ')
        ) {
          return rootValue.bind(rootDom);
        }
        return rootValue;
      }
      // @ts-ignore
      const rawValue = rawDocument[p];
      // 部分原生函数的执行上下文需要是原生对象，否则会抛出 Illegal invocation 异常
      if (rawValue instanceof Function && !rawValue.name.startsWith('bound ')) {
        return rawValue.bind(rawDocument);
      }
      return rawValue;
    },
  });
}

// 修改沙箱，增加document代理
class Sandbox {
  mountRoot: HTMLDivElement;
  documentProxy: Document;

  constructor(template: string) {
    this.mountRoot = createShadowRoot(template);
    this.documentProxy = createDocumentProxy(this.mountRoot.shadowRoot!);
  }
}
```

### 子应用作用域覆盖

现在，我们已经创建好了`document`代理对象，那如何让子应用使用代理对象而不是原生`document`对象呢？我们可以利用函数作用域实现。
我们可以在一个函数作用域中执行子应用脚本，并将`document`代理添加到此作用域中以覆盖原生的`document`对象。实现代码如下。

```typescript
/**
 * 在指定作用域中执行JS代码
 * @param script 要执行的JS代码
 * @param env 表示运行环境的对象，每个字段都将被添加到作用域中
 */
function execScript(script: string, env: any = {}) {
  const envKeys = Object.keys(env).filter((key) => key !== 'this');
  let exeFn = new Function(...envKeys, script);
  // 考虑可能代理this的情况，this无法直接覆盖，单独进行处理
  if (env.this) {
    exeFn = exeFn.bind(env.this);
  }
  exeFn(...envKeys.map((key) => env[key]));
}

// 修改执行脚本的方法，每次执行均在指定作用域中进行
export function execScripts(scripts: string[], env: any = {}) {
  for (let i = 0; i < scripts.length; i++) {
    execScript(scripts[i], env);
  }
  const keys = Object.keys(window);
  const moduleName = keys[keys.length - 1];
  return window[moduleName as any];
}
```

还需在子应用加载时使用作用域覆盖。由于闭包的存在，执行子应用代码后返回的生命周期函数也受该作用域影响。

```typescript
// 修改reroute方法以在执行时使用作用域覆盖
async function reroute(apps: SubApp[]) {
  const { appsToUnmount, appsToLoad, appsToBootstrap, appsToMount } =
    getAppChanges(apps);

  // 执行卸载
  // 省略。。。

  // 从入口加载文件，并将执行得到的生命周期函数存到apps中
  await Promise.all(
    appsToLoad.map(async (app) => {
      const { template, execScripts } = await importEntry(app.entry);
      const documentProxy = createDocumentProxy();
      const module = execScripts({
        document: app.sandbox.documentProxy,
      });
      Object.assign(app, module, {
        template,
        status: APP_STATUS.NOT_BOOTSTRAPPED,
      });
    }),
  );

  // 执行初始化
  // 省略。。。

  // 执行挂载
  // 省略。。。
}
```

请通过下面的例子验证目前为止的代码。

<Alert type="info">
  注：由于对document对象进行了代理，react子应用查询到的挂载节点不再与父应用冲突，react子应用可以成功挂载。
</Alert>

<Alert type="info">
  另外：<code>React 16.13.1</code>才支持将应用挂载到<code>shadow dom</code>下。
  如果需要使用<code>qiankun</code>的严格隔离模式，请至少将React升级到16.13.1版本，详情请看<a href='https://github.com/facebook/react/issues/10422'>这里</a>。
</Alert>

<code src="./demos/qiankun-source/demo-3" iframe="true"></code>

## JS 沙箱

一般情况下，JS 应用可以安全地将一个模块挂载在全局对象上。但在微前端中并不是这样，一个子应用挂载在`window`上的全局变量可能被另一个子应用使用甚至修改。
比如说`Mockjs`，它会拦截全部通过`XMLHttpRequest`发送的请求，在一个子应用使用了`Mockjs`时，其他子应用发送的请求也会被拦截，这可能并不是我们想要的。
请通过上一个例子进行验证：在`vue`子应用和`react`子应用的`about`路由中都会使用`mock`模块，并将其挂载在`window`上，可以看到：`vue`子应用和`react`子应用都可以修改`mock`模块并且修改的是同一个模块。

### window 代理

为了解决这个问题，我们可以对`window`对象进行代理，每个子应用访问到的`window`对象均为代理对象，就像`document`代理做的那样。
每个子应用对`window`对象做的修改都只记录在相应的代理对象上。实现代码如下。

<Alert type="info">
  注：这里只实现了<code>window</code>代理的基本内容，<code>qiankun</code>在实现中考虑了更多特殊情景。
</Alert>

```typescript
// 修改Sandbox，增加window代理
class Sandbox {
  mountRoot: HTMLDivElement;
  documentProxy: Document;
  windowProxy: Window;

  constructor(template: string) {
    this.mountRoot = createShadowRoot(template);
    this.documentProxy = createDocumentProxy(this.mountRoot.shadowRoot!);
    this.windowProxy = createWindowProxy(this.documentProxy);
  }
}

// 前面提到过，我们需要记录最后一个被设置在window上的模块，代理对象上的该属性将被视为模块名
export const LAST_SET_NAME = '__PROXY_LAST_SET_NAME__';

/**
 * 创建一个window的代理对象
 * @param document document代理对象
 * @param rawWindow 原始的window对象
 */
function createWindowProxy(document: Document, rawWindow = window): Window {
  const descriptorTargetMap = new Map();
  const deletePropsSet = new Set();
  const fakeWindow: Window = Object.create(null, {
    document: {
      enumerable: true,
      value: document,
    },
  });
  const proxy = new Proxy(rawWindow, {
    get(target: Window, p: string | symbol, receiver: any): any {
      if (p === 'window' || p === 'self' || p === 'globalThis') {
        return proxy;
      }
      if (p === 'hasOwnProperty') {
        return (key: string) =>
          Object.prototype.hasOwnProperty.call(fakeWindow, p) ||
          (!deletePropsSet.has(p) && rawWindow.hasOwnProperty(p));
      }
      if (p === 'eval') {
        return eval;
      }
      if (p in fakeWindow) {
        // @ts-ignore
        const targetValue = fakeWindow[p];
        if (showBind(targetValue)) {
          return targetValue.bind(proxy);
        }
        return targetValue;
      }
      // @ts-ignore
      const rawValue = rawWindow[p];
      if (showBind(rawValue)) {
        return rawValue.bind(rawWindow);
      }
      return rawValue;
    },
    set(
      target: Window,
      p: string | symbol,
      value: any,
      receiver: any,
    ): boolean {
      if (deletePropsSet.has(p)) {
        deletePropsSet.delete(p);
      }
      // @ts-ignore
      fakeWindow[p] = value;
      // @ts-ignore
      fakeWindow[LAST_SET_NAME] = p;
      return true;
    },
    has(target: Window, p: string | symbol): boolean {
      if (deletePropsSet.has(p)) {
        return false;
      }
      return p in fakeWindow || p in rawWindow;
    },
    ownKeys(target) {
      return [
        ...new Set(
          Reflect.ownKeys(rawWindow).concat(Reflect.ownKeys(fakeWindow)),
        ),
      ].filter((key) => !deletePropsSet.has(key));
    },
    deleteProperty(target: Window, p: string | symbol): boolean {
      if (Object.prototype.hasOwnProperty.call(fakeWindow, p)) {
        // @ts-ignore
        return delete fakeWindow[p];
      }
      deletePropsSet.add(p);
      return true;
    },
    defineProperty(
      target: Window,
      p: string | symbol,
      attributes: PropertyDescriptor,
    ): boolean {
      if (deletePropsSet.has(p)) {
        deletePropsSet.delete(p);
      }
      return Reflect.defineProperty(target, p, attributes);
    },
  });
  return proxy;
}

/**
 * 部分原生函数依赖于原生对象，但不能对构造函数进行bind操作，这个函数用于判断是否要进行bind操作
 * @param value 判断是否进行bind操作的值
 */
function showBind(value: any) {
  return (
    value instanceof Function &&
    !value.name.startsWith('bound ') &&
    !(
      value.prototype?.constructor === value &&
      Object.getOwnPropertyNames(value.prototype).length > 1
    )
  );
}
```

这里代理`window`对象时会将修改或添加的属性保存在`fakeWindow`对象上，而删除的属性会记录在`deletePropsSet`中。
这样，子应用对`window`对象进行的操作就不会作用于原生对象了。此外，这里将`document`代理对象也注入了`window`代理对象，修复了通过`window.document`可以直接获取到原生`document`对象的漏洞。

### 子应用作用域覆盖

就像代理`document`对象时那样，我们也需要将`window`代理对象添加到子应用代码执行的作用域中。但也需要考虑更多场景。
一般情况下，我们为`window`附加的属性可以直接作为全局变量访问，但附加到`window`代理上的属性并不具备此行为，这在一些场景下会引起一些错误。
比如`Vue`会将自身挂载到`window`上以在其它地方访问。`with`语句允许将对象的属性添加到作用域中，我们可以使用`with`来模拟这个行为。
此外，全局作用域中的`this`会指向`window`对象，我们可以使用`bind`进行覆盖。实现代码如下：

```typescript
// 传递给with语句的变量名
const MINI_QIANKUN_GLOBAL_OBJECT = '__MINI_QIANKUN_GLOBAL_OBJECT__';

// 修改execScript，允许指定全局对象覆盖作用域
function execScript(script: string, env: any = {}, global: any = {}) {
  const envKeys = Object.keys(env).filter((key) => key !== 'this');
  let exeFn: any = () => 0;
  // 这里需要换行，以免被注释
  exeFn = new Function(
    ...envKeys,
    MINI_QIANKUN_GLOBAL_OBJECT,
    `with(${MINI_QIANKUN_GLOBAL_OBJECT}) {\n${script}\n}`,
  );
  // this无法直接覆盖，单独进行处理
  if (env['this']) {
    exeFn = exeFn.bind(env['this']);
  }
  exeFn(...envKeys.map((key) => env[key]), global);
}

// 修改传参
export function execScripts(
  scripts: string[],
  env: any = {},
  global: any = {},
) {
  for (let i = 0; i < scripts.length; i++) {
    execScript(scripts[i], env, global);
  }
  const keys = Object.keys(window);
  const moduleName = keys[keys.length - 1];
  return window[moduleName as any];
}

// 修改execScripts传参
export async function importEntry(entry: string) {
  const html = await getEntryHTML(entry);
  const [pureHtml, scriptTextArr] = await parseHTMLScript(html);
  return {
    template: pureHtml,
    execScripts: (env?: any, global?: any) =>
      execScripts(scriptTextArr, env, global),
  };
}
```

在执行子应用脚本时需要将`window`代理对象添加到作用域，同时需要修改获取模块逻辑。

```typescript
// 修改reroute
async function reroute(apps: SubApp[]) {
  const { appsToUnmount, appsToLoad, appsToBootstrap, appsToMount } =
    getAppChanges(apps);

  // 执行卸载
  // 省略。。。

  // 从入口加载文件，并将执行得到的生命周期函数存到apps中
  await Promise.all(
    appsToLoad.map(async (app) => {
      const { template, execScripts } = await importEntry(app.entry);
      app.sandbox = new Sandbox(template);
      (window as any).__INJECTED_PUBLIC_PATH_BY_QIANKUN__ = app.entry;
      // 执行脚本，并将window和document代理添加到作用域
      execScripts(
        {
          document: app.sandbox.documentProxy,
          window: app.sandbox.windowProxy,
          this: app.sandbox.windowProxy,
        },
        app.sandbox.windowProxy,
      );
      // 获取模块
      const moduleName = app.sandbox.windowProxy[LAST_SET_NAME];
      const module = app.sandbox.windowProxy[moduleName];
      Object.assign(app, module, {
        template,
        status: APP_STATUS.NOT_BOOTSTRAPPED,
      });
    }),
  );

  // 执行初始化
  // 省略。。。

  // 执行挂载
  // 省略。。。
}
```

### 动态脚本作用域覆盖

目前，子应用的脚本会在指定作用域中执行。但子应用可能会动态向`dom`插入脚本，默认情况下，这些脚本会在全局作用域中执行。
我们需要拦截插入的脚本，并在给定的作用域中执行。实现代码如下：

```typescript
const SCRIPT_TAG_REG = /^script$/i; // 匹配script标签

/**
 * 对执行dom进行拦截
 * @param dom 要拦截标签插入的元素
 * @param env 执行脚本的作用域
 * @param global 执行脚本时使用的全局对象
 */
export function interceptScript(dom: HTMLElement, env: any, global: any) {
  const rawAppendChild = dom.appendChild;
  dom.appendChild = function (child: any) {
    const tagName = child.nodeName;
    if (SCRIPT_TAG_REG.test(tagName)) {
      // 将拦截到的script标签替换为注释
      const newChild = new Comment(child.outerHTML);
      rawAppendChild.call(dom, newChild);
      // 解析标签并在指定作用域中执行
      parseHTMLScript(child.outerHTML).then(([pureHtml, scripts]) => {
        execScripts(scripts, env, global);
      });
    } else {
      rawAppendChild.call(dom, child);
    }
    return child;
  };
}
```

添加拦截器的代码如下。

```typescript
// 修改Sandbox以在创建时添加动态脚本拦截器
class Sandbox {
  mountRoot: HTMLDivElement;
  documentProxy: Document;
  windowProxy: Window;

  constructor(template: string) {
    this.mountRoot = createShadowRoot(template);
    this.documentProxy = createDocumentProxy(this.mountRoot.shadowRoot!);
    this.windowProxy = createWindowProxy(this.documentProxy);
    // 对body进行拦截
    interceptScript(
      this.documentProxy.body,
      {
        document: this.documentProxy,
        window: this.windowProxy,
        this: this.windowProxy,
      },
      this.windowProxy,
    );
    // 对head进行拦截
    interceptScript(
      this.documentProxy.head,
      {
        document: this.documentProxy,
        window: this.windowProxy,
        this: this.windowProxy,
      },
      this.windowProxy,
    );
  }
}
```

对`window`对象进行代理已基本实现，请通过下面的例子进行验证。不难发现：`vue`子应用使用的`mock`模块与`react`子应用使用的`mock`模块之间不再关联。

<code src="./demos/qiankun-source/demo-4" iframe="true"></code>

## 总结

本文对`qiankun`实现微前端的原理进行了介绍，包含四个主要部分：

- 请求并解析`html`文本，以实现`html`入口加载子应用。
- 约定子应用生命周期，以提高子应用重挂载效率。
- 提供 CSS 沙箱以实现样式隔离。
- 提供 JS 沙箱以实现子应用运行环境隔离。

同时，在实现微前端过程中也需要子应用做出一些修改，包括：

- 子应用动态加载资源时需要从父应用获取运行时`publicPath`。
- 子应用需要导出为`umd`模块，并提供生命周期函数。
