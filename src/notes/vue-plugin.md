---
title: 12、Vue插件从封装到发布
order: 12
---

# Vue插件从封装到发布

### 一、插件的定义
引用官方介绍：

>插件是自包含的代码，通常向 Vue 添加全局级功能。它可以是公开 install() 方法的 object，也可以是 function。
>插件的功能范围没有严格的限制—— 一般有下面几种：
>1. 添加全局方法或者 property。如：vue-custom-element;
>2. 添加全局资源：指令/过渡等。如：vue-touch）;
>3. 通过全局 mixin 来添加一些组件选项。(如vue-router)；
>4. 添加全局实例方法，通过把它们添加到 config.globalProperties 上实现；
>5. 一个库，提供自己的 API，同时提供上面提到的一个或多个功能。如 vue-router。

### 二、怎样封装插件
在这里通过封装一个长列表虚拟滚动高阶插件来学习插件的封装。
#### （一）需求场景：
一个长列表 Web 页面，如果需要展示成千上万条数据，那么页面中就会有数万甚至数十万的HTML节点，会严重消耗浏览器性能，进而给用户造成非常不友好的体验。前端如何优化这种 「 长列表 」显示场景，才能符合「 企业最佳实践标准 」？

有以下几个关键点：
1. 分页：不把长列表数据一次性全部显示在页面上；
2. 截取长列表一部分数据用来填充屏幕容器区域；
3. 长列表数据不可视部分使用空白占位填充；
4. 监听滚动事件根据滚动位置动态改变可视列表和空白填充；

我们将以上操作思路称为”虚拟滚动“。

**虚拟滚动**，就是根据 <u>容器可视区域</u> 的 <u>列表容积数量</u>，监听用户滑动或者滚动事件，动态截取 <u>长列表数据</u> 中的 <u>部分数据</u> 渲染到页面上，动态使用空白占位填充容器的 <u>上下滚动区域内容</u> ，模拟实现 <u>原生滚动效果</u>。 
![image.png](https://upload-images.jianshu.io/upload_images/19825289-852cb02c82483ae3.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

#### （二）基础案例准备
##### 使用 Express + Mockjs 模拟新闻类列表 API 接口
（1）安装依赖：
```
// 安装 express、mockjs
npm i express mockjs -S 

// 不用每次都重启服务的工具
npm i -D nodemon

node index.js  // 启动服务
```
（2）代码：
```
const Mock = require('mockjs');
const express = require("express");
const app = express();
// 根据传入的参数num，生成num条模拟列表数据
function generatorList(num) {
    return Mock.mock({
        [`list|${num}`]: [{
            'id|+1': 1, // 模拟ID，自增方式追加
            title: "@ctitle(15,25)",
            image: "@natural(0, 15)",
            reads: "@natural(0, 9999)",
            from: "@ctitle(3, 10)",
            date: "@date('yyyy-MM-dd')"
        }]
    })
}
// 允许跨域请求返回数据
app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Origin', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Origin', 'X-Request-With');
    res.header('Access-Control-Allow-Origin', 'Content-Type');
    next();
})
// 截取路由并返回数据
app.get('/data', function (req, res) {
    const { num } = req.query;
    return res.send(generatorList(num));
})
// 设置端口并打印对应调用结果
const server = app.listen(4000, function () {
    console.log('4000端口启动成功！接口地址为：http://localhost:4000/data?num=')
})
```
##### 使用Axios请求Mock数据
```
// main.js引入axios
import axios from 'axios';
Vue.prototype.$axios = axios;  // 全局可用

// 组件内调用接口获取数据
getMockData(num) {
  this.$axios
    .get(`http://localhost:4000/data?num=${num}`)
    .then((res) => {
      this.allDataList = res.data.list;
    })
    .catch((err) => {
      window.console.log(err);
    });
}
```
##### 计算滚动容器最大列表容积
根据滚动容器 DOM 元素高度 `this.$refs.scrollContainer.offsetHeight` 和单条数据的固定高度  `oneHeight` ，计算当前滚动容器最大列表容积数量 `containSize` 。
> **注意：**
> 当屏幕 `Resize` 改变窗口，或者 `orientationchange` 手机横竖屏切换时，滚动容器最大容积数需要动态计算。
> 根据盒元素高度继承的原理，以及子元素高度溢出滚动的原理。如果滚动容器 CSS 高度使用百分比限制的话，要注意其父元素的高度需要指定，父元素的父元素一样需要指定高度，依次类推，只有这样，才会有当前滚动容器内部的滚动效果。

```
// 给滚动容器加一个 ref 属性，用来获取当前滚动容器的 DOM 节点
<div class="scroll-container" ref="scrollContainer">
// 首先在data中声明两个属性
data() {
  return {
    // 列表单条条数据 CSS 高度，这个数值需要固定，根据 CSS 值手动填写，如此才能准确的计算容积
    oneHeight: 100,
    // 当前页面可以容纳的列表最大数量
    containSize: 0
  }
}
mounted() {
// 根据显示区域高度，计算可以容纳最大列表数量
 	this.myresize();
window.onresize = this.myresize;
 	window.orientationchange = this.myresize;
},
methods: {
  // 监听窗口变化动态计算容器最大容积数
  myresize: () => {
    console.log(this.$refs.scrollContainer.offsetHeight);
    // 容积数量可能只截取了单条数据的一部分，所以要进位加一
    this.containSize = 
      Math.ceil(this.$refs.scrollContainer.offsetHeight / this.oneHeight) + 2;
  }
}
```
##### 监听滚动事件动态截取数据
监听用户滚动、滑动事件，根据滚动位置，动态计算当前可视区域起始数据的索引位置 `startIndex`，再根据  `containSize`，计算结束数据的索引位置`endIndex`，最后根据`startIndex`与 `endIndex`截取长列表所有数据 
`allDataList` 中需显示的数据列表 `showDataList`。
```
// 给滚动容器添加滚动事件 @scroll="handleScroll"
// 使用passive修饰符，确保默认滚动行为有效
<div class="scroll-container" ref="scrollContainer" @scroll.passive="handleScroll">
// 显示容器最大容积截取的数组数据
<div v-for="(item, index) in showDataList" :key="index">
 
data() {
  return {
    // 可视元素开始索引
    startIndex:0
}
}
computed: {
    // 根据 starIndex 和屏幕容积 containSize 计算 endIndex
    endIndex() {
      let endIndex = this.startIndex + this.containSize;
      // 判断截取到最后元素是否存在，如果不存在则只取最后一位
      if (!this.allDataList[endIndex]) {
        endIndex = this.allDataList.length - 1;
      }
      return endIndex;
    },
    // 根据容器最大容积数，截取显示，实际需要渲染列表，这里也通过计算属性动态依赖计算
    showDataList() {
      // 根据 starIndex 和 endIndex，截取 allDataList 对应需要显示部分 showDataList
      return this.allDataList.slice(this.startIndex, this.endIndex);
    }
},
methods: {
  // 监听容器滚动事件
  handleScroll() {
    this.startIndex = ~~(
       this.$refs.scrollContainer.scrollTop / this.oneHeight
    );
  }
}
// 给容器添加 Y 轴可滚动 CSS 属性
.scroll-container {
   overflow-y: auto;
}
```
> **注意：**
> 1. 务必给 scroll-container 添加 overflow-y: auto; 的 CSS 属性，Vue 才能监听滚动触发事件；
> 2. 使用 Computed 计算属性，可以依赖性的计算创建对应属性；
> 3. 使用 slice 截取显示数据，因为数组操作 splice 会改变原始数组，slice 不会改变原始数组。

##### 使用计算属性动态设置上下空白占位
根据 `startIndex` 和 `endIndex` 的位置，使用计算属性，动态的计算并设置，上下空白填充的高度样式`blankFillStyle`，使用 padding 或者 margin 进行空白占位都是可以的。

```
<!-- 添加上下空白占位 -->
<div :style="blankFillStyle">
<!-- 循环遍历元素 -->
</div>
computed: {
// blankFillStyle 依赖 计算上下空白占位高度样式
blankFillStyle() {
return {
paddingTop: this.startIndex * 100 + "px",
paddingBottom: (this.allDataList.length - this.endIndex) * 100 + "px"
};
}
}
```
> **注意：**
> 1. 填充样式必须以盒子包裹的方式包裹所有节点；

##### 下拉置底自动请求加载数据
```
// 监听容器滚动事件
handleScroll() {
  // 获取当前容器在scoll事件中距离顶部的位移 scrollTop 计算可视元素开始索引
  let CurrentStartIndex = ~~(
    this.$refs.scrollContainer.scrollTop / this.oneHeight
  );
  // 如果当前可视元素开始索引和记录的 startIndex 开始索引发生变化，才需要更改 showDataList
  if (CurrentStartIndex === this.startIndex) return;
  // 当前可视元素索引发生变化后，更新记录的 startIndex 值
  this.startIndex = CurrentStartIndex;
  // PS：因为计算属性依赖关系，startIndex 发生变化，endIndex 会自动触发计算属性的操作
  // 同理，根据计算属性依赖关系，showDataList 也会自动触发返回新的值
  
  // 如果下拉到了底部，并且上一次请求已经完成，则触发新的数据更新
  // 使用 this.loadingTag 状态进行节流，防止非必要触发
  if ( this.containSize + currentIndex > this.listData.length - 1  
       && !this.loadingTag ) {
       // 请求新的20条新闻数据，如果没有请求到数据则直接return
       let newListData = await this.getAllListData(20);
       if (!!newListData && newListData.length === 0) return;
       // 使用拓展运算符将请求的最新数据写进所有数据的列表
       this.listData = [...this.listData, ...newListData];
  }
}
```
##### 滚动事件节流定时器优化
监听滚动事件触发对应函数方法的频率是极高的，该如何做好页面节流优化呢？
```
// 定义滚动行为事件方法
handleScroll() {
  if (!this.isScrollStatus) return;
  this.isScrollStatus = false;
  // 设置定时器实现节流
  const mytimer = setTimeout(() => {
    this.isScrollStatus = true;
    clearTimeout(mytimer); // 避免内存泄露
  }, 30)
  // 此处时间如果太大，在快速滚动的情况下会出现白屏
  // 执行数据设置的相关任务，滚动事件的具体行为
  this.setDataStateIndex();
},
```
##### 滚动事件节流请求动画帧优化
```
//兼容低版本浏览器
let requestAnimationFrame =
  window.requestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.msRequestAnimationFrame;
//浏览器防抖优化：根据浏览器FPS采用递归方法，队列调用requestAnimationFrame方法实现优化
let fps = 30;
let interval = 1000 / fps;
let then = Date.now();
requestAnimationFrame(() => {
  let now = Date.now();
  let delta = now - then;
  then = now;
  this.setDataStartIndex();
  if (delta >= interval) {
    requestAnimationFrame(arguments.callee);
  }
});
```
##### 设置上下滚动缓冲消除快速滚动白屏(预加载)
```
computed: {
    // 容器最后一个元素的索引
    endIndex() {
      let endIndex = this.startIndex + this.containSize * 2;
      if (!this.allDataList[endIndex]) {
        endIndex = this.allDataList.length;
      }
      return endIndex;
    },
    // 定义一个待显示的数组列表元素
    showDataList() {
      const startIndex = this.startIndex <= this.containSize ? 0 : this.startIndex - this.containSize;
      return this.allDataList.slice(startIndex, this.endIndex);
    },
    // 定义上方空白的高度
    // topBlankFill() {
    //   return this.startIndex * this.oneHeight;
    // },
    // // 定义下方空白的高度
    // bottomBlankFill() {
    //   return (this.allDataList.length - this.endIndex) * this.oneHeight;
    // },
    // 定义空白填充的样式
    blankFillStyle() {
      const startIndex = this.startIndex <= this.containSize ? 0 : this.startIndex - this.containSize;
      return {
        paddingTop: startIndex * this.oneHeight + 'px',
        paddingBottom: (this.allDataList.length - this.endIndex) * this.oneHeight + 'px',
      }
    },
  },
```
##### 路由切换定位列表滚动位置
```
// 在 app.vue 文件的路由出口添加 keepAlive 
<keep-alive>
 <router-view />
</keep-alive>
```
```
// 在 index.vue 文件中记录相关信息
data(){
  return {
    // 在data中声明一个属性，用来保存路由切换后的偏移定位
    scrollTop: 0  
  }
},
methods:{
  async setDataStartIndex() {
      // 根据滚动事件，获取当前容器在scoll事件中距离顶部的位移
    	this.scrollTop = this.$refs.scrollContainer.scrollTop;
  		// 根据 scrollTop 计算可视元素开始索引
      let CurrentStartIndex = ~~( this.scrollTop / this.oneHeight );
    	...
  }
},
activated() {
//在keep-alive路由模式下，切换路由时确保能够返回用户之前所在位置
this.$nextTick(() => {
this.$refs.scrollContainer.scrollTop = this.scrollTop;
});
},
```
#### （三）插件封装调用
##### 剥离代码构建插件文件并直接调用
1. 在 src 文件夹下，创建 plugins 文件夹，用来保存我们的自定义插件，并创建插件 VirtualScroll.vue 文件
```
<template>
  <div class="scroll-container" ref="scrollContainer" @scroll.passive="handleScroll">
      <!-- 滚动容器内部数据 -->
   </div>
</template>
<script>
export default {
   // 对应实现虚拟滚动的脚本文件
};
</script>
<style lang="scss" scoped>
  .scroll-container {
  	/* 对应实现虚拟滚动的 css 文件*/
  }
</style>
```
2. 新建 index.js 文件输出插件
```
import VirtualScroll from './VirtualScroll.vue';
const plugin = {
    install(Vue) {
        Vue.component("VirtualScroll", VirtualScroll);
    }
}
export default plugin;
```
3. 在 main.js 文件中，给 Vue 添加全局插件属性
```
//引入定制化虚拟滚动插件并注册到Vue全局实例上，这里需要注意先后顺序，我们的定制化插件中会用到iView中的组件
import VirtualScroll from "./plugins";
Vue.use(VirtualScroll);
```
4. 在 index.vue 文件中调用插件
```
<template>
  <div class="news-box">
    <virtual-scroll />
  </div>
</template>
```
##### 调用插件并传递 Props 参数
调用插件的时候，需要抽离关键定制化的参数信息，向子组件进行通信使用
```
<virtual-scroll
        :msg="msg"
        :oneHeight="oneHeight"
        :requestUrl="requestUrl"
        :requestNum="requestNum"
        :imgsList="imgsList"
        :moreRequestNum="moreRequestNum"
    />
```
```
data() {
    return {
      // 提示显示信息
      msg: "小二正在努力，请耐心等待...",
      // 图片数组
      imgsList,
      // 记录单条数据的高度
      oneHeight: 100,
      // 请求数据的URL
      requestUrl: 'http://localhost:4000/data?num=',
      // 请求数据的条数
      requestNum: 20,
      // 下拉置底后再请求的数据条数
      moreRequestNum: 20,
    }
  }
```
在组件中使用 props 接收父组件传递过来的参数
```
props: {
    msg: {
      type: String,
      default: () => '小二正在努力，请耐心等待...'
    },
    oneHeight: {
      type: Number,
      default: () => 100
    },
    requestUrl: {
      type: String,
      default: () => 'http://localhost:4000/data?num='
    },
    requestNum: {
      type: Number,
      default: () => 20
    },
    imgsList: {
      type: Array,
      default: () => [],
    },
    moreRequestNum: {
      type: Number,
      default: 20,
    }
  },
```
修改关键传递过来的参数信息。

##### 使用作用域插槽传递单条元素结构
将 VirtualScroll.vue 组件内部的单条元素的 html 结构、css 样式、data 数据，使用作用域插槽传递出去
```
<div v-for="(item, index) in showDataList" :key="index">
<slot :thisItem="item"></slot>
</div>
```
将 VirtualScroll.vue 组件内部的单条元素的 html 结构、css 样式、data 数据，使用作用域插槽传递出去
在 index.vue 接收子组件中传递过来的单条元素内容，结构、数据、样式
```
<virtual-scroll
        :msg="msg"
        :oneHeight="oneHeight"
        :requestUrl="requestUrl"
        :requestNum="requestNum"
        :imgsList="imgsList"
        :moreRequestNum="moreRequestNum"
        v-slot:default="oneItem"
    >
      <router-link
          class="one-new"
          :to=" '/article/' + oneItem.thisItem.title + '/'+ oneItem.thisItem.reads + '/'+ oneItem.thisItem.from + '/'+ oneItem.thisItem.date + '/'+ oneItem.thisItem.image "
      >
        <!-- 新闻左侧标题、评论、来源部分 -->
        <div class="new-left">
          <h3>{{ oneItem.thisItem.title }}</h3>
          <div>
            <p>
              <img src="../assets/icons/msg.png" alt="评"/>
              <span>{{ oneItem.thisItem.reads }}</span>
              <span>{{ oneItem.thisItem.from }}</span>
            </p>
            <h4>{{ oneItem.thisItem.date }}</h4>
          </div>
        </div>
        <!-- 新闻右侧图片部分 -->
        <div class="new-right">
          <img :src="imgsList[oneItem.thisItem.image]" alt="PIC"/>
        </div>
      </router-link>
    </virtual-scroll>
```

### 三、参考文档
[Vue官方文档](https://v3.cn.vuejs.org/guide/plugins.html#%E7%BC%96%E5%86%99%E6%8F%92%E4%BB%B6)
[小程序长列表组件 - RecycleView](https://developers.weixin.qq.com/miniprogram/dev/extended/component-plus/recycle-view.html)