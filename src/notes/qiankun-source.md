---
title: 7、qiankun从原理到源码
order: 7
---

# qiankun 从原理到源码

`qiankun`是一个基于`single-spa`的微前端实现库。通过解决`single-spa`的一些弊端和不足，来帮助大家更简单、无痛的构建一个生产可用微前端架构系统。
了解`qiankun`原理可以帮助大家更好理解其提供各个`api`的作用以及`qiankun`的缺陷与不足。本文将根据一个实例向大家介绍`qiankun`实现微前端的全过程。

## 背景

考虑这样一种情况：你正在维护一个`angularjs`开发的前端项目，经过多年的发展，这个项目已然十分庞大。现在，你接到一个任务：需要往项目中新增一个模块。
无法忍受过时技术的你决定在新的工程中开发新模块，开发完成后再嵌入原项目，并选好了嵌入技术：`iframe`。

### 子模块

子模块已开发完成，如下：

- [Vue 模块](https://linyun-git.github.io/mini-qiankun-demos/vue-demo/)
- [React 模块](https://linyun-git.github.io/mini-qiankun-demos/react-demo/)
  子模块源码请从[这里](https://github.com/linyun-git/mini-qiankun-demos)获取。

### 使用 iframe 嵌入页面

很快完成了新模块的开发，也顺利将其嵌入原项目中，就像下面这样。但同时也发现了`iframe`中的问题：子应用的弹框无法超过`iframe`区域。
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

使用`iframe`无法满足目标，你开始寻找其他嵌入方案。子应用实际上就是一堆`html`标签，标签又引入了其他资源，如果能在主模块上解析这些标签，那同样也能显示出子应用的效果。

## 加载子应用

### 从`html`入口获取代码

子应用最终会被部署到一个线上地址，我们可以直接从这个地址获取子应用的入口`html`文件。`html`文件中会从文件地址引入其他资源文件，但一般不包含域信息，比如`src="/index.js"`。
不包含域信息的路径会被错误解析而从当前域（父应用所在域）请求文件，因此在获取到`html`文件后还需要将资源地址改为包含域信息的地址。
实现代码如下。这里使用了正则表达式结合`replace`来修改资源地址，如何在 JS 中使用正则表达式可以参考[上文](./regexp-in-js)。

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

getEntryHTML('https://linyun-git.github.io/mini-qiankun-demos/react16/').then(
  (html) => console.log(html),
);
```

修改资源地址后得到的`html`文件如下。

```text
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <link href="https://linyun-git.github.io/favicon.ico" rel="icon"/>
  <meta content="width=device-width,initial-scale=1" name="viewport"/>
  <meta content="#000000" name="theme-color"/>
  <meta content="Web site created using create-react-app" name="description"/>
  <link href="https://linyun-git.github.io/mini-qiankun-demos/react16/logo192.png" rel="apple-touch-icon"/>
  <link href="https://linyun-git.github.io/manifest.json" rel="manifest"/>
  <title>React App</title>
  <link href="https://linyun-git.github.io/mini-qiankun-demos/react16/static/css/2.4eb19277.chunk.css" rel="stylesheet">
  <link href="https://linyun-git.github.io/mini-qiankun-demos/react16/static/css/main.2f865207.chunk.css" rel="stylesheet">
</head>
<body>
<noscript>You need to enable JavaScript to run this app.</noscript>
<div id="root"></div>
<script>
// 省略...
</script>
<script src="https://linyun-git.github.io/mini-qiankun-demos/react16/static/js/2.cd7f5aad.chunk.js"></script>
<script src="https://linyun-git.github.io/mini-qiankun-demos/react16/static/js/main.8eaafa86.chunk.js"></script>
</body>
</html>
```

### 解析 script 标签

在得到资源地址正确的`html`文件后，我们可以直接使用`innerHTML`将其嵌入父应用中。一般情况下，`html`标签都会被正确解析，但通过这种方式生成的`script`标签不会请求资源文件，也不会执行`JS`代码。
鉴于此，我们可以创建新的`script`标签并使用`appendChild`方法（使用`appendChild`添加到页面上的`script`标签是会被正确解析并执行的）将其添加到页面中。
另外，后出现的`script`可能依赖于前面`script`的执行，为了保证执行顺序，我们可以在请求`JS`文件后统一处理。实现代码如下。

```typescript
const ALL_SCRIPT_REGEX = /<script.*?>(.*?)<\/script>/gis; // 匹配所有script标签
const SCRIPT_SRC_REG = /\ssrc=('|")(\S+)\1/i; // 匹配带src属性的script标签

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

你可以通过下面的例子验证目前的代码。为了防止污染文档，该 demo 在`iframe`中运行。

注：由于挂载容器与文档主体冲突，目前点击`挂载React子应用`会导致页面卡死，这是正常的，后面会给出解决方案。

<code src="./demos/qiankun-source/demo-1" iframe="true"></code>

上面的 demo 已经能够成功加载子应用，但也存在一些问题：

1. 同一个子应用再次挂载时会重新请求和解析资源文件。
2. 子应用加载时，父应用的样式也发生了变化。
3. React 子应用无法挂载。
4. Vue 子应用可以加载，但不能切换路由。

接下来我们将解决这些问题。

## 子应用生命周期

现在，同一个子应用重新挂载时会重新请求并解析资源文件。并且子应用中的一些 JS 代码是不用重复执行的，比如全局对象`React`只需创建一次，之后挂载只需执行`render`。
为了解决这个问题，我们不得不让子应用做出一些更改：子应用需要导出一些生命周期函数，并让父应用在恰当的时候执行。
基于此，我们可以将生命周期函数分为以下三种：

- bootstrap: 在子应用初始化时执行一次，用于初始化全局变量。
- mount: 子应用每次挂载时执行，用于渲染 DOM。
- unmount: 子应用卸载时执行，用于销毁挂载时创建的实例，避免内存泄露。

既然确定了有哪些生命周期函数，接下来就是让主应用拿到子应用的生命周期函数。我们可以直接将子应用的生命周期函数挂载到 window 上，但这不利于规范。
一般的做法是让子应用暴露出一个模块，从模块获取子应用的生命周期函数。这里使用`umd`模块规范，如何将一个`React`应用输出为`umd`模块可以参考[这里](https://qiankun.umijs.org/zh/guide/tutorial#react-%E5%BE%AE%E5%BA%94%E7%94%A8)。

### 从子应用加载应用模块

在`umd`模块规范下，子应用执行后会将模块挂载在`window`对象上，我们可以观察`window`属性的变化来获取子应用暴露出的模块。执行子模块脚本并获取应用模块的实现如下：

```typescript
/**
 * 执行脚本并获取子应用导出的生命周期函数
 * @param scripts JS脚本
 */
export function execScripts(scripts: string[]) {
  let moduleName;
  for (let i = 0; i < scripts.length; i++) {
    const exec = new Function(scripts[i]);
    if (i === scripts.length - 1) {
      exec();
      const keys = Object.keys(window);
      moduleName = keys[keys.length - 1];
      console.log(moduleName);
    } else {
      exec();
    }
  }
  return window[moduleName as any];
}
```

`webpack`会将应用及其依赖输出为多个模块，应用自身暴露出的模块通常是最后一个，这里根据`Object.keys`方法返回的键名顺序来获取最后一个被挂载到`window`上的模块。
这种方法实际上是不可信的，因为根据浏览器实现不同，`Object.keys`返回键名的顺序可能是不同的，稍后我们将使用`Proxy`对`window`进行代理以获取最后一个被挂载的模块，这里请先忽略。

### 子应用状态

为了判断某一时刻应该执行子应用的哪个生命周期函数，我们需要记录子应用的状态。现将子应用分为如下状态：

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

## 应用沙箱

未完待续。。
