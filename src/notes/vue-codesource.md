---
title: 11、Vue源码解析
order: 11
---

# Vue源码解析

#### 基础知识点

1、将伪数组转换为真数组
`[].slice.call(likeArr)  或  Array.prototype.slice.call(likeArr)`
2、得到节点类型
`node.nodeType`
3、给对象添加属性（指定描述符）不支持IE8,所以vue也不支持IE8
`Object.defineProperty(obj, propertyName, {})`

**属性描述符**

（1）数据描述符
* configurable: 是否可以重新定义，默认false;
* enumerable: 是否可以枚举，默认为false；
* value：初始值；
* writable：是否可以修改属性值；默认为false；

（2）访问描述符
* get：回调函数，根据其他相关的属性动态计算得到当前属性值；
* set：回调函数，监视当前属性值的变化，更新其他相关的属性值；
```
const obj = {
    firstName: 'A',
    lastName: 'B'
}
// 给obj添加fullName属性
// obj.fullName = 'A-B'
```
![image.png](https://upload-images.jianshu.io/upload_images/19825289-c19a6fec5f10e090.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

4、得到对象自身可枚举属性组成的数组
`Object.keys(obj)`
5、判断prop是否是obj自身的属性
`obj.hasOwnProperty(prop)`
6、文档碎片（高效批量更新多个节点）
`DocumentFragment`
* document：对应显示的页面，包含n个element，一旦更新document内部的某个元素就会导致界面更新；
* documentFragment：内存中包含n个element的容器对象（不与界面关联），如果更新fragment中的某个element，界面不会更新。

#### 数据代理

1、数据代理：通过一个对象代理对另一个对象中属性的操作（读/写）
2、vue 数据代理：通过vm对象来代理data对象中所有属性的操作
3、好处：更方便的操作data中的数据
4、基本实现流程：
   * 通过Object.defineProperty()给vm添加data对象的属性对应的属性描述符
   * 所有添加的属性都包含getter/setter
   * getter/setter 内部去操作data中对应的属性数据
  
![image.png](https://upload-images.jianshu.io/upload_images/19825289-088b1ce32d25c2ae.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

#### 模板解析的基本流程

1、将el的所有子节点取出来，添加到一个新建的文档fragment对象中
2、对fragment中的所有层次子节点递归进行编译解析处理
   * 对表达式文本节点进行解析
   * 对元素节点的指令属性进行解析
      * 事件指令解析
      * 一般指令解析
      
3、将解析后的fragment添加到el中显示
（1）大括号表达式解析
* 根据正则对象得到匹配出的表达式字符串
* 从data中取出表达式对应的属性值
* 将属性值设置为文本节点的textContent

（2）事件指令解析
* 从指令名中取出事件名
* 根据指令的值（表达式）从methods中得到对应的事件处理函数对象
* 给当前元素节点绑定指定事件名和回调函数的dom事件监听
* 指令解析完后，移除次指令属性

（3）一般指令解析
* 得到指令名和指令值（表达式）
* 从data中根据表达式得到对应的值
* 根据指令名确定需要操作元素节点的什么属性
    * v-text----textContent 属性
    * v-html----innerHtml 属性
    * v-class----class 属性
* 将得到的表达式的值设置到对应的属性上
* 移除元素的指令属性

#### 数据绑定

1、数据绑定
一旦更新了data中的某个属性数据，所欲界面上直接使用或间接使用了此属性的节点都会更新
* 初始化显示：页面（表达式/指令）能从data读取数据显示（编译/解析）
* 更新显示：更新data中的属性数据=》页面更新

2、数据劫持
* 数据劫持是vue中用来实现数据绑定的一种技术
* 基本思想：通过defineProperty()来监视data中所有属性（任意层次）数据的变化，一旦变化就去更新页面。

3、MVVM结构图
MVVM作为数据绑定的入口，整合Observer、Compile和Watcher三者，通过Observer来监听自己的model数据变化，通过Compile来解析编译模板指令，最终利用Watcher搭起Observer和Compile之间的通信桥梁，达到数据变化 -> 视图更新；视图交互变化(input) -> 数据model变更的双向绑定效果。
![image.png](https://upload-images.jianshu.io/upload_images/19825289-6343245220e9047e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
4、四个重要对象
（1） Observer（观察者）
* 用来对data所有属性数据进行劫持的构造函数
* 给data中所有属性重新定义（Object.defineProperty）属性描述（get/set）
* 为data中的每个属性创建对应的dep对象（属性合dep对象是一对一关系）

（2）Dep(Depend)（属性订阅器）
* data中的每个属性（所有层次）都对应一个dep对象
* 创建的时机：
    * 在初始化define data中各个属性时创建对应的dep对象
    * 在data中的某个属性值被设置为新的对象时
* 对象的结构
{
    id,  // 每个dep都有一个唯一的id
    subs,  // 包含n个对应watcher的数组（subscribes的简写）
}
* subs属性说明
    * 当watcher被创建时，内部将当前watcher对象添加到对饮的dep对象的subs中
    * 当此data属性的值发生改变时，subs中所有的watcher都会收到更新的通知，从而最终更新对应的界面
    
（3）Compiler（编译）
* 用来解析模板页面的对象的构造函数（一个实例）
* 利用compiler对象解析模板页面
* 每解析一个表达式（非事件指令）都会创建一个对应的watcher对象，并建立watcher与dep的关系
* compiler与watcher的关系是一对多的关系

（4）Watcher（订阅者）
* 模板中每个非事件指令或大括号表达式都对应一个watcher对象
* 监视当前表达式数据的变化
* 创建的时机：在初始化编译模板时
* 对象的组成
{
    vm,  // vm对象
    exp,  // 对应指令的表达式
    depIds， // 相关的n个dep的容器对象
    value， // 当前表达式对应的value
    cb， // 用于更新界面的回调
}

**Dep与Watcher之间的关系**
（1）什么关系？
多对多的关系
data属性-->n个watcher（模板中有多个表达式使用了此属性： {{a}}/v-text='a'）
表达式-->watcher-->n个Dep（多层表达式a.b.c）

（2）如何建立?
data中属性get()中建立的

（3）什么时候建立？
初始化的解析模板中的表达式创建watcher对象时

#### 双向数据绑定

1、双向数据绑定是建立在单向数据绑定（model==>View）的基础上的
2、双向数据绑定的实现流程：
* 在解析v-model指令时，给当前元素添加input监听
* 当input的value发生变化时，将最新的值赋值给当前表达式所对应的data属性
