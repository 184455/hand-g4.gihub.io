---
title: 10、Vue-cli打造自己项目的脚手架工具
order: 10
---

# Vue-cli打造自己项目的脚手架工具

#### 一、为什么需要脚手架（命令行工具）？
* 减少重复性的工作，不再需要复制其他项目再删除无关代码，或者从零创建一个项目和文件；
* 根据交互动态生成项目结构和配置文件等；
* 多人协作更为方便，不需要再把文件传来传去。
#### 二、实现思路
![image.png](https://upload-images.jianshu.io/upload_images/19825289-605a947bcab0190a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
* 项目模板放在github上
* 用户通过命令交互的方式下载不同的模板
* 经过模板引擎渲染定制项目模板
* 模板变动，只需要更新模板即可，不需要用户更新脚手架
 #### 三、涉及知识点及模块
 * NodeJs
    基于Node.js开发命令行工具
 * ECMAScript 6
    使用最新版本语言进行开发  
 * npm 发包
    npm包的发布及更新流程
 * commander.js
    可以自动的解析命令和参数，用于处理用户输入的命令
 * download-git-repo
    下载并提取git仓库，用于下载项目模板
 * Inquirer.js
    通用的命令行用户界面集合，用于和用户进行交互
 * handlebars.js
    模板引擎，将用户提交的信息动态填充到文件中
 * ora
    下载过程久的话。可以用于显示下载中的动画效果
 * chalk
    可以给终端的字体加上颜色
 * log-symbols
    可以在终端上显示出狗√或×等图标
 #### 四、初始化操作
 * 初始化
```
mkdir demo-cli
cd demo-cli
npm init -y // 初始化生成package.json文件
```
* 新建 index.js 并写入以下内容：
```
#!/usr/bin/env node

console.log('hello cli');
```
* 配置package.json 中的bin字段
```
{
  "name": "vue-cli-test",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "bin": {
    "test": "index.js"
  }
}
```
* 执行npm link 链接命令到全局/执行npm unlink 可以建命令移除(在项目根路劲下执行)
* 执行bin中配置的命令测试
例如：在命令行输入命令 `test` 可看到对应输出。

#### 五、命令行工具参数设计
```
test -h|--help   // 查看使用帮助
test -V|--version   // 查看工具的版本号
test list   // 列出所有可用模板
test init <template-name> <project-name>  // 基于指定的模板进行项目初始化
```
#### 六、使用 commander 模块处理命令行
* 安装
`npm install commander`
* 使用
```
#!/usr/bin/env node
// 使用Node开发命令行工具所执行的Javascript脚本必须在顶部加入 #!/usr/bin/env node
const program = require('commander');
const download = require('download-git-repo');
const inquirer = require('inquirer');
const handlebars = require('handlebars');
const fs = require('fs');
const ora = require('ora');
const chalk = require('chalk');
const logSymbols = require('log-symbols')
// 1.获取用户输入命令
// process.argv原生获取命令行参数的方式
// console.log(process.argv)
program
    .version('0.0.1') // -V 或者 --version 的时候输出该版本号
const templates = {
    'tpl-a': {
        url: '', // 模板仓库地址
        downloadUrl: 'http://github.com:用户名/仓库名#分支名', // 模板下载地址
        description: 'a模板',
    },
    'tpl-b': {
        url: '',
        downloadUrl: '', // 模板下载地址
        description: 'b模板',
    },
    'tpl-c': {
        url: '',
        downloadUrl: '', // 模板下载地址
        description: 'c模板',
    }
}
program
    .command('init <template> <project>')
    .description('初始化项目模板')
    .action((templateName, projectName) => {
        const spiner = ora('正在下载模板...').start()
        // 根据模板名下载对应的模板到本地
        // download: 第一个参数是仓库下载地址，第二个参数是下载路劲
        const {downloadUrl} = templates[templateName];
        download(downloadUrl, projectName, {clone: true}, (err) => {
            if (err) {
                spiner.fail();
                console.log(logSymbols.error, chalk.red('初始化模板失败'))
                return
            }
            spiner.succeed(); // 下载成功提示
            // 模板文件下载成功
            // 1. 把项目下的package.json文件读取出来
            // 2. 使用向导的方式采集用户输入的值
            // 3. 使用模板引擎把用户输入的数据解析到package.json文件中
            // 4. 解析完毕，把解析之后的结果重新写入package.json文件中
            inquirer.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: '请输入项目名称'
                },
                {
                    type: 'input',
                    name: 'description',
                    message: '请输入项目名称'
                },
                {
                    type: 'input',
                    name: 'author',
                    message: '请输入项目名称'
                }
            ]).then((answers) => {
                // 把采集到的用户输入的数据解析替换到package.json中
                const packagePath = `${projectName}/package.json`
                const packageContent = fs.readFileSync(packagePath, 'utf8') // 读取本地文件
                const packageResult = handlebars.compile(packageContent)(answers) // 编译替换
                fs.writeFileSync(packagePath, packageResult); // 重写到本地文件
                console.log(logSymbols.success, chalk.yellow('初始化模板成功'))
            })
        })
    });
program
    .command('list')
    .description('查看所有可用模板')
    .action(() => {
        for (key in templates) {
            console.log(`${key} ${templates[key].description}`)
        }
    })
program.parse(process.argv);
// 2. 根据不同的指令执行不同的功能操作

```
![image.png](https://upload-images.jianshu.io/upload_images/19825289-99972c95022c5cf6.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

#### 七、下载模板
* 安装
`npm install download-git-repo`
* 修改代码
![image.png](https://upload-images.jianshu.io/upload_images/19825289-1732de68bcc2810d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
* download()第一个参数就是仓库下载地址
    端口号后面的'/' 在参数里要写成‘：’
    ```#master``` 代表的就是分支名
    不同的模板可以放在不同的分支下，更改分支便可以实现下载不同的模板文件了
 * 第二个参数是路劲
    上面我们直接在当前路径下创建一个name命名的文件夹存放模板，也可以使用二级目录比如test/${name}
#### 八、命令行交互
* inquirer
    一组常见的交互式命令行用户界面。
* 安装
`npm install inquirer`

命令行交互功能可以在用户执行init命令后，向用户提出问题，接收用户的输入并做出相应的处理，这里使用inquirer.js来实现。
![image.png](https://upload-images.jianshu.io/upload_images/19825289-8c267ff6a9010757.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
1）问题就放在prompt()中
2）问题的类型为input就是输入类型
3）name就是作为答案对象中的key
4）message就是问题了
5）用户输入的答案就在answers中
修改模板内package.json文件里需要用户自定义配置的参数，例如：
![image.png](https://upload-images.jianshu.io/upload_images/19825289-e84f721d2f43419b.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
在下载模板完成后将用户输入的答案渲染到package.json中
* handlebars（模板引擎）
    Handlebars.js 是Chris Wanstrath 创建的Mustache 模板语言的扩展。
* 安装
`npm i handlebars`
```
// 把采集到的用户输入的数据解析替换到package.json中const packagePath = `${projectName}/package.json`
onst packageContent = fs.readFileSync(packagePath, 'utf8') // 读取本地文件const packageResult = handlebars.compile(packageContent)(answers) // 编译替换
fs.writeFileSync(packagePath, packageResult); // 重写到本地文件
```
上面使用node.js的文件模块fs，将handlebars渲染完成后的模板重新写入到文件中。
#### 九、视觉美化
在用户输入答案后，开始下载模板，这时候使用ora来提示用户正在下载中。
* 安装ora
`npm install ora`

![image.png](https://upload-images.jianshu.io/upload_images/19825289-44b05760e40acefe.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
然后通过chalk来为打印信息加上样式，比如成功信息为绿色，失败信息为红色，这样子会让用户更加容易分解，同时也让终端的显示更加的好看。
* 安装chalk
`npm install ora`
* 安装log-symbols
`npm install log-symbols`

#### 十、npm 发包
发完包之后就能通过npm下载自己的cli
`npm install --global 脚手架名`
1. 打开npmjs.com官网
2. 注册一个npm账号
3. 在npm检索是否有重名的包名
4. 将package.json里的name修改为发布到npm上的包名（该名字和本地项目名称无关）
5. 打开控制台，执行`npm login`，登录npm
6. 登录成功以后，在项目下执行 `npm publish` 发布
7. 发布成功，就可以在本地进行安装测试了