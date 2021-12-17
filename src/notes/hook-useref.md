---
title: 8、React Hooks系列之useRef
order: 8
---

# React Hooks系列之useRef

#### 一、useRef 是什么？
`const myRef = useRef(initialValue);`

* useRef 返回一个可变的 ref 对象，且只有一个current属性，初始值为传入的参数( initialValue )；
* 返回的 ref 对象在组件的整个生命周期内保持不变；
* 当更新 current 值时并不会 re-render ，而 useState 更新值时会触发页面渲染；
* 更新 useRef 是 side effect (副作用)，所以一般写在 useEffect 或 event handler 里;
* useRef 类似于类组件的 this。
#### 二、useRef 可以解决什么问题？
##### 1、使用useRef来获取上一次的值
```
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
```
这个函数再渲染过程中总是返回上一次的值，因为 ref.current 变化不会触发组件的重新渲染，所以需要等到下次的渲染才能显示到页面上。
##### 2、使用useRef来保存不需要变化的值
因为useRef的返回值在组件的每次redner之后都是同一个，所以它可以用来保存一些在组件整个生命周期都不需要变化的值。最常见的就是定时器的清除场景。
**（1）以前用全局变量设置定时器**
```
const App = () => {
  let timer;
  useEffect(() => {
    timer = setInterval(() => {
      console.log('触发了');
    }, 1000);
  },[]);
  const clearTimer = () => {
    clearInterval(timer);
  }
  return (
    <>
      <Button onClick={clearTimer}>停止</Button>
    </>)
}
```

上面的写法存在一个问题，如果这个App组件里有state变化或者他的父组件重新render等原因导致这个App组件重新render的时候，我们会发现，点击停止按钮，定时器依然会不断的在控制台打印，定时器清除事件无效了。

因为组件重新渲染之后，这里的timer以及clearTimer 方法都会重新创建，timer已经不是定时器的变量了。

**（2）使用useRef定义定时器**
```
const App = () => {
  const timer = useRef();
  useEffect(() => {
    timer.current = setInterval(() => {
      console.log('触发了');
    }, 1000);
  },[]);
  const clearTimer = () => {
    clearInterval(timer.current);
  }
  return (
    <>
      <Button onClick={clearTimer}>停止</Button>
    </>)
}
```
**(3) 实现一个深度依赖对比的 useDeepEffect**
普通的useEffect只是一个浅比较的方法，如果我们依赖的state是一个对象，组件重新渲染，这个state对象的值没变，但是内存引用地址变化了，一样会触发useEffect的重新渲染。
```
const createObj = () => ({
    name: 'zouwowo'
});
useEffect(() => {
  // 这个方法会无限循环
}, [createObj()]);
```
使用 useRef 实现深度依赖比较
```
import equal from 'fast-deep-equal';
export useDeepEffect = (callback, deps) => {
  const emitEffect = useRef(0);
  const prevDeps = useRef(deps);
  if (!equal(prevDeps.current, deps)) {
    // 当深比较不相等的时候，修改emitEffect.current的值，触发下面的useEffect更新
    emitEffect.current++;
  }
  prevDeps.current = deps;
  return useEffect(callback, [emitEffect.current]);
}
```
**（4）小结**
* useRef 是定义在实例基础上的，如果代码中有多个相同的组件，每个组件的 ref 只跟组件本身有关，跟其他组件的 ref 没有关系。
* 组件前定义的 global 变量，是属于全局的。如果代码中有多个相同的组件，那这个 global 变量在全局是同一个，他们会互相影响。
* 组件重新渲染之后，全局变量会被重新创建，ref 则不会被刷新。
##### 3、实现父组件获取子组件的属性和方法

```
import React, {MutableRefObject, useState, useEffect, useRef, useCallback} from 'react'
interface IProps {
    //prettier-ignore
    label: string,
    cRef: MutableRefObject<any>
}
const ChildInput: React.FC<IProps> = (props) => {
    const { label, cRef } = props
    const [value, setValue] = useState('')
    const handleChange = (e: any) => {
        const value = e.target.value
        setValue(value)
    }
    const getValue = useCallback(() => {
        return value
    }, [value])
    useEffect(() => {
        if (cRef && cRef.current) {
            cRef.current.getValue = getValue
        }
    }, [getValue])
    return (
        <div>
            <span>{label}:</span>
            <input type="text" value={value} onChange={handleChange} />
        </div>
    )
}
const ParentCom: React.FC = (props: any) => {
    const childRef: MutableRefObject<any> = useRef({})
    const handleFocus = () => {
        const node = childRef.current
        alert(node.getValue())
    }
    return (
        <div>
            <ChildInput label={'名称'} cRef={childRef} />
            <button onClick={handleFocus}>focus</button>
        </div>
    )
}
export default ParentCom
```
父组件按钮点击时，通过调用getValue，获取到子组件input里的value值。