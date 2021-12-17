---
title: 13、解析Vue.nextTick
order: 13
---

# 解析Vue.nextTick

#### 一、原理
1、vue异步异步更新队列（JS运行机制 、 事件循环）
Vue 在观察到数据变化时并不是直接更新 DOM，而是开启一个队列，并缓冲在同一事件循环中发生的所有数据改变。在缓冲时会去除重复数据，从而避免不必要的计算和DOM操作。
```js
<template>
  <div class="hello">
    <h3 id="h">{{testMsg}}</h3>
  </div>
</template>
 
<script>
export default {
  name: 'HelloWorld',
  data () {
    return {
      testMsg:"初始值",
    }
  },
methods: {
 changeTxt(){
      let that=this;
      that.testMsg="更新值";  //修改dom结构
       
      that.$nextTick(function(){  //使用vue.$nextTick()方法可以dom数据更新后延迟执行
        let domTxt=document.getElementById('h').innerText; 
        console.log(domTxt);  //输出可以看到vue数据修改后并没有DOM没有立即更新，
        if(domTxt==="原始值"){
          console.log("文本data被修改后dom内容没立即更新");
        }else {
          console.log("文本data被修改后dom内容被马上更新了");
        }
      });
    },
}
```
图解：
![image.png](https://upload-images.jianshu.io/upload_images/19825289-6e682c901b0e9783.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
事件循环：

第一个tick（本次更新循环）

1.首先修改数据，这是同步任务。同一事件循环的所有的同步任务都在主线程上执行，形成一个执行栈，此时还未涉及DOM.

2.Vue开启一个异步队列，并缓冲在此事件循环中发生的所有数据变化。如果同一个watcher被多次触发，只会被推入队列中一次。

第二个tick(‘下次更新循环’)

同步任务执行完毕，开始执行异步watcher队列的任务，更新DOM。Vue在内部尝试对异步队列使用原生的Promise.then和MutationObserver方法，如果执行环境不支持，会采用 setTimeout(fn, 0) 代替。

第三个tick（下次 DOM 更新循环结束之后）
#### 二、应用场景及原因

1.在Vue生命周期的created()钩子函数进行DOM操作一定要放到Vue.nextTick()的回调函数中。

在created()钩子函数执行的时候DOM 其实并未进行任何渲染，而此时进行DOM操作无异于徒劳，所以此处一定要将DOM操作的js代码放进Vue.nextTick()的回调函数中。与之对应的就是mounted()钩子函数，因为该钩子函数执行时所有的DOM挂载和渲染都已完成，此时在该钩子函数中进行任何DOM操作都不会有问题。

2.在数据变化后要执行的某个操作，而这个操作需要使用随数据改变而改变的DOM结构的时候，这个操作都应该放进Vue.nextTick()的回调函数中。

具体原因在Vue的官方文档中详细解释：

         Vue 异步执行 DOM 更新。只要观察到数据变化，Vue 将开启一个队列，并缓冲在同一事件循环中发生的所有数据改变。如果同一个 watcher 被多次触发，只会被推入到队列中一次。这种在缓冲时去除重复数据对于避免不必要的计算和 DOM 操作上非常重要。然后，在下一个的事件循环“tick”中，Vue 刷新队列并执行实际 (已去重的) 工作。Vue 在内部尝试对异步队列使用原生的Promise.then和MutationObserver，如果执行环境不支持，会采用setTimeout(fn, 0)代替。

例如，当你设置vm.someData = 'new value'，该组件不会立即重新渲染。当刷新队列时，组件会在事件循环队列清空时的下一个“tick”更新。多数情况我们不需要关心这个过程，但是如果你想在 DOM 状态更新后做点什么，这就可能会有些棘手。虽然 Vue.js 通常鼓励开发人员沿着“数据驱动”的方式思考，避免直接接触 DOM，但是有时我们确实要这么做。为了在数据变化之后等待 Vue 完成更新 DOM ，可以在数据变化之后立即使用Vue.nextTick(callback)。这样回调函数在 DOM 更新完成后就会调用。