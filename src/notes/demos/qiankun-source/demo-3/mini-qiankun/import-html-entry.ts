// 匹配指src和href属性，如 href="/favicon.ico"
const HREF_REG = /(href|src)=(['"])(\S+?)\2/g;
// 匹配head标签
const HEAD_TAG_REG = /<(head)(.*?\/)\1>/gis;
// 匹配body标签
const BODY_TAG_REG = /<(body)(.*?\/)\1>/gis;
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
  return html
    .replace(HREF_REG, ($0, $1, $2, $3) => {
      return `${$1}=${$2}${getEntirePath($3, entry)}${$2}`;
    })
    .replace(HEAD_TAG_REG, ($0, $1, $2) => {
      return `<div mini-qiankun-head ${$2}div>`;
    })
    .replace(BODY_TAG_REG, ($0, $1, $2) => {
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
 * 在指定作用域中执行JS代码
 * @param script 要执行的JS代码
 * @param env 表示运行环境的对象，每个字段都将被添加到作用域中
 */
function execScript(script: string, env: any = {}) {
  const envKeys = Object.keys(env).filter((key) => key !== 'this');
  let exeFn = new Function(...envKeys, script);
  // this无法直接覆盖，单独进行处理
  if (env['this']) {
    exeFn = exeFn.bind(env['this']);
  }
  exeFn(...envKeys.map((key) => env[key]));
}

/**
 * 执行脚本并获取子应用导出的生命周期函数
 * @param scripts JS脚本
 * @param env 运行环境
 */
export function execScripts(scripts: string[], env: any = {}) {
  for (let i = 0; i < scripts.length; i++) {
    execScript(scripts[i], env);
  }
  const keys = Object.keys(window);
  const moduleName = keys[keys.length - 1];
  return window[moduleName as any];
}

export async function importEntry(entry: string) {
  const html = await getEntryHTML(entry);
  const [pureHtml, scriptTextArr] = await parseHTMLScript(html);
  return {
    template: pureHtml,
    execScripts: (env?: any) => execScripts(scriptTextArr, env),
  };
}
