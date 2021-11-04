---
title: 3、前端界面截图实现
order: 3
---

# 前端界面截图实现

因为做动态内容管理，需要截取一张图片，作为页面的预览图。

在这样的背景下，前端截图的功能，就氤氲而生了！

**首先**，放出别人的解决方案：[https://stackoverflow.com/questions/10721884/render-html-to-an-image](https://stackoverflow.com/questions/10721884/render-html-to-an-image)

里面大佬说了四个方向去解决。而且还有很多 `html` 转 `png` 的框架，还是很齐全的解决方案！

我在里面找到了一个 `html 转 png` 的框架：[dom-to-image](https://github.com/tsayen/dom-to-image)

## 具体代码

我选择 `dom-to-image` 框架以后，还遇到了一个问题，就是页面有动画的情况，页面会出现空白，截图不到内容。

具体的没有太多好的解决办法。

我的做法是，先让页面滚动道底部，触发页面的出现动画，这个时候再调用截图的插件，这样就能获取全部的 DOM，截图展示的就是真正的页面了。

（ps：`dom-to-image` 这个框架主要是根据 dom 去渲染成为一个图片的）

具体代码：

```javascript
import domtoimage from 'dom-to-image';

window.scrollTo({
  top: document.body.scrollHeight, // 滚动道底部，触发出现动画，获取全部的DOM 元素
  left: 0,
  behavior: 'smooth',
});
setTimeout(() => {
  domtoimage
    .toJpeg(
      document.getElementById('templates-wrapper'), // 你需要截图的DOM 根元素
      { quality: 0.95 },
    )
    .then((dataUrl) => {
      const link = document.createElement('a');
      link.download = 'my-image-name.jpeg';
      link.href = dataUrl;
      link.click();
    });
}, 2000); // 延时不一定需要。这里是为了兼容滚动时的动画时间
```
