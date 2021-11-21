import { importEntry } from './import-html-entry';
import { listenHistoryChange } from './listenHistory';

enum APP_STATUS {
  NOT_LOADED = 'NOT_LOADED', // 尚未加载资源
  LOADING_SOURCE_CODE = 'LOADING_SOURCE_CODE', // 请求资源中
  NOT_BOOTSTRAPPED = 'NOT_BOOTSTRAPPED', // 尚未初始化
  NOT_MOUNTED = 'NOT_MOUNTED', // 尚未挂载
  MOUNTED = 'MOUNTED', // 已挂载
}

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

// 注册子应用
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
