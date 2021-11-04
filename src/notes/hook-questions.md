---
title: 4、React hook 遇到的问题
order: 4
---

# 记录 React hook 遇到的问题

> 这里主要介绍在项目中使用 React Hooks 遇到的问题。

## 一、关于 useEffect 依赖数组和组件默认值问题

背景前置：

\- 组件需要从外部接受一个 Props

\- 组件内需要用 `useEffect` 监听这个 Props，做对应逻辑

**错误代码示例**：

```javascript
import { useEffect } from 'react';

export default function ErrorExample({ init = {} }) {
  // 注意这行：init = {}
  useEffect(() => {
    console.log(init);

    // ...
  }, [init]);

  // ...
}
```

我们都知道， `useEffect ` 第二个参数可以接受一个依赖数组，React 底层会去监听这个 props ，只要它发生改变就会执行对应的回调函数。

但是当这个属性是从外边传进来，而我们需要对这个属性赋一个默认值的时候，**问题就出现了**，这个就是我们错误示例中的做法，它会导致：<font color="red">页面的其他属性改变时，导致 useEffect 重复回调的问题，引起不必要的渲染。</font>

**建议解决办法：**

这个特性理论上不是 React 的问题，但是在实际中，为了更好的性能，和可能引起不必要的问题，我们只要把 `init = {}` 的默认值去掉即可。如果需要赋默认值，可以通过其他方式，不要在传入 Props 给一个 `引用类型` 的默认值即可。

## 二、当不需要与 Dom 绑定的属性，不要使用 useState

我们都知道，React 的一个特点就是：数据试图绑定，数据管理。但是这个特性有时候会滥用！

特别在一种场景：当我们需要一个储存数据的容器，但是不需要与 DOM 做一个视图上的绑定的时候，我们可以用 `useRef` 而不是 `useState` ！

**错误示例**

```javascript
function ClickButton(props) {
  const [count, setCount] = useState(0);

  const onClickCount = () => {
    setCount((c) => c + 1);
  };

  const onClickRequest = () => {
    apiCall(count);
  };

  return (
    <div>
      <button onClick={onClickCount}>Counter</button>
      <button onClick={onClickRequest}>Submit</button>
    </div>
  );
}
```

这是一个点击的示例，这里面的属性（count）并没有与 Dom 做绑定，只是单纯做一个数据记录，像这种情况，不需要 useState 也可以！

```javascript
function ClickButton(props) {
  const count = useRef(0);

  const onClickCount = () => {
    count.current++;
  };

  const onClickRequest = () => {
    apiCall(count.current);
  };

  return (
    <div>
      <button onClick={onClickCount}>Counter</button>
      <button onClick={onClickRequest}>Submit</button>
    </div>
  );
}
```

这样写，代码会更优雅，而且更符合第一感受：count 属性就是一个数据容器，它不会跟 DOM 有任何关联！

## 结束

今天就先记录这两个问题，后期遇到其他的会持续更新...

这两个也不能说算是 BUG，感觉更多是一种良好实践！平时写代码可以多想，注意，总是会有一些让人意想不到的点！

参考简介：[https://www.lorenzweiss.de/common_mistakes_react_hooks/#1-using-usestate-when-no-rerender-is-needed](https://www.lorenzweiss.de/common_mistakes_react_hooks/#1-using-usestate-when-no-rerender-is-needed)
