---
title: 9、React组件通信的几种方式--TypeScript
order: 9
---

# React组件通信的几种方式--TypeScript

通过todoList示例进行学习，首先创建基于TypeScript的react工程：
`npx create-react-app myapp --template typescript`
示例：
![image.png](https://upload-images.jianshu.io/upload_images/19825289-9026d9a59184831a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
#### 一、props&Event
* 父组件向子组件通信：
父组件通过向子组件传递 props，子组件得到 props 后进行相应的处理。
* 子组件向父组件通信：
利用回调函数，父组件将一个函数作为 props 传递给子组件，子组件调用该回调函数，便可以向父组件通信。
* 跨级组件通信:
跨级组件通信，就是父组件向子组件的子组件通信，向更深层的子组件通信，解决方法就是中间组件层层传递 props。
如果父组件嵌套较深，那么中间的每一层组件都要去传递 props，增加了复杂度，也给后期维护带来不便，并且这些 props 并不是这些中间组件自己所需要的。

父组件传递props：
```
// 父组件
const Todo = () => {
    // 把数据统一存到todo父组件里
    const [todoList, setTodoList] = useState<StateProps[]>([]);
    // 改变todo
    const changeTodo = (id: number) => {
        const newTodoList = todoList.map(item => {
            if (item.id === id) {
                return Object.assign({}, item, { isFinished: !item.isFinished })
            }
            return item;
        })
        setTodoList(newTodoList);
    }
    // 添加todo
    const addTodo = (todo: StateProps) => {
        setTodoList([...todoList, todo]);
    }
    return (
        <div className="todo">
            <TodoInput addTodo={addTodo} />
            <TodoList todoList={todoList} changeTodo={changeTodo} />
        </div>
    )
}
```
子组件接收 props 与调用回到函数:
```
// 子组件
const TodoInput = ({ addTodo }: IProps) => {
    const [text, setText] = useState('');
    const handleChangeText = (e: React.ChangeEvent) => {
        setText((e.target as HTMLInputElement).value);
    }
    const handleAddTodo = () => {
        if (!text) return;
        addTodo({
            id: new Date().getTime(),
            text: text,
            isFinished: false,
        })
        setText('');
    }
    return (
        <div className="todo-input">
            <input type="text" placeholder="请输入代办事项" onChange={handleChangeText} value={text} />
            <button style={{ marginLeft: '10px' }} onClick={handleAddTodo} >+添加</button>
        </div>
    )
}

const TodoList = ({ todoList, changeTodo }: IProps) => {
    return (
        <div className="todo-list" style={style}>
            {todoList.map(item => <TodoItem key={item.id} todo={item} changeTodo={changeTodo} />)}
        </div>
    )
}

// 孙子组件
const TodoItem = ({ todo, changeTodo }: IProps) => {
    // 改变事项状态
    const handleChange = () => {
        changeTodo(todo.id);
    }
    return (
        <div className="todo-item" style={style}>
            <input type="checkbox" checked={todo.isFinished} onChange={handleChange} />
            <span style={{ textDecoration: todo.isFinished ? 'line-through' : 'none' }}>{todo.text}</span>
        </div>
    )
}
```
### 二、Context

context 相当于一个全局变量，是一个大容器，我们可以把要通信的内容放在这个容器中，这样一来，不管嵌套有多深，都可以随意取用。
使用 context 也很简单，需要满足两个条件：
* 上级组件要声明自己支持 context，并提供一个函数来返回相应的 context 对象；
* 子组件要声明自己需要使用 context。
使用步骤：
（1）通过 createContext 创建一个 context 对象，然后给这个对象指定属性值；
（2）通过用 <MyContext.Provider> </MyContext.Provider> 组件包裹需要接收上层属性的子组件；
（3）将需要传递的属性放在 Provider 组件的 value 属性上向下传递；
（4）在子组件中获取值时使用 useContext 来简化操作。
```
// Provide组件
import React, { createContext, useState } from "react";
export interface StateProps {
    id: number;
    text: string;
    isFinished: boolean;
}
export interface ContextProps {
    todoList: StateProps[];
    changeTodo: (id: number) => void;
    addTodo: (todo: StateProps) => void;
}
// const MyContext = createContext<ContextProps | null>(null); // 泛型写法
export const MyContext = createContext({} as ContextProps); // 断言写法
const MyProvide = (props: React.PropsWithChildren<{}>) => {
    // 把数据统一存到todo父组件里
    const [todoList, setTodoList] = useState<StateProps[]>([]);
    // 改变todo
    const changeTodo = (id: number) => {
        const newTodoList = todoList.map(item => {
            if (item.id === id) {
                return Object.assign({}, item, { isFinished: !item.isFinished })
            }
            return item;
        })
        setTodoList(newTodoList);
    }
    // 添加todo
    const addTodo = (todo: StateProps) => {
        setTodoList([...todoList, todo]);
    }
    return (
        <MyContext.Provider value={{ todoList, changeTodo, addTodo }} >
            {/* 插槽内容 */}
            {props.children}
        </MyContext.Provider>
    )
}
export default MyProvide;

// 子组件
import React, { useContext } from 'react';
import TodoItem from './TodoItem';
import { MyContext } from './MyProvider';
const style = {
    marginTop: '20px',
}
const TodoList = () => {
    const { todoList } = useContext(MyContext);
    return (
        <div className="todo-list" style={style}>
            {todoList.map(item => <TodoItem key={item.id} todo={item} />)}
        </div>
    )
}
```
以上方法中的todoList是一个相对复杂的数据，使用useState定义不太好维护，所以还可以使用 useReducer 进行优化。
```
// 将业务逻辑拆分到一个单独文件中，方便进行状态管理
export interface StateProps {
    id: number;
    text: string;
    isFinished: boolean;
}
export interface ActionProps {
    type: string;
    [key: string]: any;
}
const reducer = (state: StateProps[], action: ActionProps) => {
    switch (action.type) {
        case 'ADD':
            return [...state, action.todo];
        case 'CHANGESTATUS':
            return state.map(item => {
                if (item.id === action.id) {
                    return Object.assign({}, item, { isFinished: !item.isFinished })
                }
                return item;
            });
        default:
            return state;
    }
}
export default reducer;

// Provider 组件
import React, { createContext, useReducer } from "react";
import reducer, { StateProps, ActionProps } from "../store/reducer";
export interface ContextProps {
    state: StateProps[];
    dispatch: React.Dispatch<ActionProps>;
}
// const MyContext = createContext<ContextProps | null>(null); // 泛型写法
export const MyContext = createContext({} as ContextProps); // 断言写法
const MyProvide = (props: React.PropsWithChildren<{}>) => {
    // 把数据统一存到todo父组件里
    // const [todoList, setTodoList] = useState<StateProps[]>([]);
    // 改用useReducer进行优化
    const initState: StateProps[] = [];
    const [state, dispatch] = useReducer(reducer, initState)
    return (
        <MyContext.Provider value={{ state, dispatch }} >
            {/* 插槽内容 */}
            {props.children}
        </MyContext.Provider>
    )
}
```
需要注意 dispatch 中的 type 值需要与 reducer 中定义的一一对应。
### 三、Redux
先安装相关依赖：
`npm i -S redux react-redux @types/react-redux`
##### Redux基本概念
* **Store** （状态容器）
Store 就是保存数据的地方，整个应用只能有一个 Store。
* **State**
Store对象包含所有数据。当前时刻的 State，可以通过store.getState()拿到。Redux 规定， 一个 State 对应一个 View。
* **reducer** 
是一个纯函数(什么样的输入就有什么样的输出)，它接受 Action 和当前 State 作为参数，返回一个新的 State，不会进行 DOM 操作和 Ajax 请求，不能调用Date.now()或者Math.random()等不纯的方法，因为每次会得到不一样的结果。
* **action**
Action 就是 View 发出的通知，表示 State 应该要发生变化了。
Action 是一个对象。其中的type属性是必须的，表示 Action 的名称，其他属性可以自由设置。
* **dispatch**
dispatch 是 View 发出 Action 的唯一方法。
##### 使用步骤：
1、通过 createStore 实例化 store 实例：
```
import { createStore } from "redux";
import reducer from "./reducer";
const store = createStore(reducer, []);
```
2、在根组件引入 Provider 组件，将其作为最外侧，并传入 store 实例，这样所有子组件都能拿到 store 里的状态：
```
import { Provider } from 'react-redux';
import store from '../store';
// 父组件
const Todo = () => {
    return (
        <Provider store={store}>
            <div className="todo">
                <TodoInput />
                <TodoList />
            </div>
        </Provider>
    )
}
```
3、在 reducer 函数中定义状态和状态处理，其实就是根据不同的 action 对象分别对状态做不同的处理：
```
const reducer = (state: StateProps[] = [], action: ActionProps) => {
    switch (action.type) {
        case types.ADD:
            return [...state, action.todo];
        case types.CHANGESTATUS:
            return state.map(item => {
                if (item.id === action.id) {
                    return Object.assign({}, item, { isFinished: !item.isFinished })
                }
                return item;
            });
        default:
            return state;
    }
}
```
4、定义 action 对象：
```
import * as types from './actionType';
import { StateProps } from './reducer';
export const addAction = (todo: StateProps) => ({
    type: types.ADD,
    todo,
})
export const changeAction = (id: number) => ({
    type: types.CHANGESTATUS,
    id,
})
```
5、当在某一个事件发生的时候，通过调用 dispatch 传入 action 对象，从而实现 state 的改变，这里引入 hooks 的 useDispatch 方法简化代码：
```
import { useDispatch } from 'react-redux'; // 减少代码复杂度
import { addAction } from '../store/action';

const dispatch = useDispatch();

dispatch(addAction({
            id: new Date().getTime(),
            text: text,
            isFinished: false,
        }))
```
6、使用 useSelector 获取状态值：
```
import { useSelector } from 'react-redux';
import { RootState } from '../store/reducer';

const state = useSelector((state: RootState) => state);  // 返回具体要拿的store中的state或者整个store
```
### 四、Mobx
先安装相关依赖：
`npm i mobx mobx-react`
##### 使用步骤
1、定义一个状态类，在类中定义状态以及修改状态的方法，并调用 mobx 中的 makeAutoObservable 方法将状态和方法转换为可观察的：
```
import { makeAutoObservable } from 'mobx';

class TodoStore {
    todoList: StateProps[] = [];
    constructor() {
        makeAutoObservable(this); // 自动转换
    }
    // 添加事项
    addAction(todo: StateProps) {
        this.todoList.push(todo)
    }
    // 改变事项状态
    changeAction(id: number) {
        this.todoList = this.todoList.map(item => {
            if (item.id === id) {
                return Object.assign({}, item, {
                    isFinished: !item.isFinished
                })
            }
            return item;
        })
    }
}
```
2、配合 react 的 createContext 将数据注入子组件：
```
import React, { createContext, useContext } from 'react';
import todoStore from './TodoStore';
export const MyContext = createContext<typeof todoStore>(todoStore);

const MyProvider: React.FC = ({ children }) => {
    return (
        <MyContext.Provider value={todoStore}>
            {children}
        </MyContext.Provider>
    )
}
```
3、自定义一个 hooks 用来获取 store 数据：
```
// 自定义 hook 获取 store
export const useStore = () => {
    const store = useContext(MyContext);
    if (!store) throw Error('no store');
    return store;
}
```
4、通过 mobx 的 observer 包裹需要引用 store 数据的组件，将其变为响应式组件：
```
import React from 'react';
import { observer } from 'mobx-react';
import TodoItem from './TodoItem';
import { useStore } from '../store/index';
// 子组件
const TodoList = () => {
    const store = useStore();
    return (
        <div className="todo-list">
            {store.todoList.map(item => <TodoItem key={item.id} todo={item} />)}
        </div>
    )
}
export default observer(TodoList);
```
用 useRef 和 useEffct 对 todoList 做优化：
```
import React, { useRef, useEffect } from 'react';
import { useStore } from '../store/index';
import { observer } from 'mobx-react';
const TodoInput = () => {
    // const [text, setText] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const store = useStore();
    // const handleChangeText = (e: React.ChangeEvent) => {
    //     setText((e.target as HTMLInputElement).value);
    // }
    // 相当于 componentDidMount、componentDidUpdate、componentWillUnmount 的集合
    useEffect(() => {
        inputRef?.current!.focus();
    }, [])
    const handleAddTodo = () => {
        const value = inputRef.current!.value;
        store.addAction({
            id: new Date().getTime(),
            text: value,
            isFinished: false,
        })
        inputRef.current!.value = '';
    }
    return (
        <div className="todo-input">
            {/* <input type="text" placeholder="请输入代办事项" onChange={handleChangeText} value={text} /> */}
            <input type="text" placeholder="请输入代办事项" ref={inputRef} />
            <button style={{ marginLeft: '10px' }} onClick={handleAddTodo} >+添加</button>
        </div>
    )
}
export default observer(TodoInput);
```
### 五、总结
1、props&Event 针对组件嵌套层级比较浅；
2、Context 结合 Hooks 也是比较简单的，适合解决一些小型数据管理；
3、Mobx 和 Redux 状态管理库适合管理大型数据。