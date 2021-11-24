// 修改沙箱，增加document代理
class Sandbox {
  mountRoot: HTMLDivElement;
  documentProxy: Document;

  constructor(template: string) {
    this.mountRoot = createShadowRoot(template);
    this.documentProxy = createDocumentProxy(this.mountRoot.shadowRoot!);
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

export default Sandbox;
