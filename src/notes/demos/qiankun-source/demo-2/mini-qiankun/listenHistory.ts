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
