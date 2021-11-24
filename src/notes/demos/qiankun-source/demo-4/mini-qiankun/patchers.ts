import { parseHTMLScript, execScripts } from './import-html-entry';

const SCRIPT_TAG_REG = /^script$/i;

// 在注入script标签时进行拦截
export function interceptScript(dom: HTMLElement, env: any, global: any) {
  const rawAppendChild = dom.appendChild;
  dom.appendChild = function (child: any) {
    const tagName = child.nodeName;
    if (SCRIPT_TAG_REG.test(tagName)) {
      const newChild = new Comment(child.outerHTML);
      rawAppendChild.call(dom, newChild);
      parseHTMLScript(child.outerHTML).then(([pureHtml, scripts]) => {
        execScripts(scripts, env, global);
      });
    } else {
      rawAppendChild.call(dom, child);
    }
    return child;
  };
}
