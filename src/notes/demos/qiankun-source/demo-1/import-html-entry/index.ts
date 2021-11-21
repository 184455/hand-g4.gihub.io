// 匹配指src和href属性，如 href="/favicon.ico"
const HREF_REG = /(href|src)=(['"])(\S+?)\2/g;
// 匹配所有script标签
const ALL_SCRIPT_REGEX = /<script.*?>(.*?)<\/script>/gis;
// 匹配带src属性的script标签
const SCRIPT_SRC_REG = /\ssrc=(['"])(\S+)\1/i;

// 将资源地址解析为带域信息的地址
function getEntirePath(href: string, entry: string) {
  return new URL(href, entry).toString();
}

async function getEntryHTML(entry: string): Promise<string> {
  const html = await fetch(entry).then((rep) => rep.text());
  return html.replace(HREF_REG, ($0, $1, $2, $3) => {
    return `${$1}=${$2}${getEntirePath($3, entry)}${$2}`;
  });
}

async function parseHTMLScript(html: string) {
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

export async function mountEntry(entry: string, container: HTMLElement) {
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
