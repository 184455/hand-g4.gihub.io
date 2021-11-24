// 匹配指src和href属性，如 href="/favicon.ico"
const HREF_REG = /(href|src)=(['"])(\S+?)\2/g;
// 匹配head标签
const HEAD_TAG = /<(head)(.*?\/)\1>/gis;
// 匹配body标签
const BODY_TAG = /<(body)(.*?\/)\1>/gis;
// 匹配所有script标签
const ALL_SCRIPT_REGEX = /<script.*?>(.*?)<\/script>/gis;
// 匹配带src属性的script标签
const SCRIPT_SRC_REG = /\ssrc=(['"])\s*?(\S+)\s*?\1/i;

// 将资源地址解析为带域信息的地址
function getEntirePath(href: string, entry: string) {
  return new URL(href, entry).toString();
}

/**
 * 从入口获取html文件并将相对地址替换为绝对地址
 * @param entry 入口
 */
async function getEntryHTML(entry: string): Promise<string> {
  const html = await fetch(entry).then((rep) => rep.text());
  (window as any).__INJECTED_PUBLIC_PATH_BY_QIANKUN__ = entry;
  return html
    .replace(HREF_REG, ($0, $1, $2, $3) => {
      return `${$1}=${$2}${getEntirePath($3, entry)}${$2}`;
    })
    .replace(HEAD_TAG, ($0, $1, $2) => {
      return `<div mini-qiankun-head ${$2}div>`;
    })
    .replace(BODY_TAG, ($0, $1, $2) => {
      return `<div mini-qiankun-body ${$2}div>`;
    });
}

/**
 * 从html文件中解析出JS脚本
 * @param html
 */
export async function parseHTMLScript(html: string) {
  const scriptsTemp: any[] = [];
  const pureHtml = html.replace(ALL_SCRIPT_REGEX, ($0, $1) => {
    if (SCRIPT_SRC_REG.test($0)) {
      scriptsTemp.push({
        async: true,
        src: $0.match(SCRIPT_SRC_REG)![2],
      });
    } else {
      scriptsTemp.push($1);
    }
    return `<!-- ${$0} -->`;
  });
  const scripts = await Promise.all(
    scriptsTemp.map((temp) => {
      return temp.async ? fetch(temp.src).then((rep) => rep.text()) : temp;
    }),
  );
  return [pureHtml, scripts] as const;
}

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

export async function importEntry(entry: string) {
  const html = await getEntryHTML(entry);
  const [pureHtml, scriptTextArr] = await parseHTMLScript(html);
  return {
    template: pureHtml,
    execScripts: () => execScripts(scriptTextArr),
  };
}
