import { interceptScript } from './patchers';

class Sandbox {
  mountRoot: HTMLDivElement;
  documentProxy: Document;
  windowProxy: Window;

  constructor(template: string) {
    this.mountRoot = createShadowRoot(template);
    this.documentProxy = createDocumentProxy(this.mountRoot.shadowRoot!);
    this.windowProxy = createWindowProxy(this.documentProxy);
    interceptScript(
      this.documentProxy.body,
      {
        document: this.documentProxy,
        window: this.windowProxy,
        this: this.windowProxy,
      },
      this.windowProxy,
    );
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

export default Sandbox;
