---
title: DraggableLayout
order: 1
nav:
  title: Components
  order: 1
---

# DraggableLayout 可拖拽布局

提供了可变宽度布局功能。

## 组件概述

- Layout: 布局容器，其下可嵌套子容器`Wrapper`。
- Wrapper: 子容器，可变宽度以子容器进行，其下可嵌套任何元素，只能放在`Layout`中。

## 代码演示

```tsx | preview
/**
 * title: 基本使用
 * desc: 基本分栏布局。尝试拖拽每栏的分割线。
 */
import React from 'react';
import { DraggableLayout as Layout } from 'dumi-demo';

const { Wrapper } = Layout;

const style = {
  backgroundColor: '#7dbcea',
  textAlign: 'center',
  color: '#fff',
  lineHeight: '120px',
};

function Index() {
  return (
    <Layout style={{ minHeight: '300px' }}>
      <Wrapper style={style}>
        <span>Left</span>
      </Wrapper>
      <Wrapper style={style}>
        <span>Center</span>
      </Wrapper>
      <Wrapper style={style}>
        <span>Right</span>
      </Wrapper>
    </Layout>
  );
}

export default Index;
```

```tsx | preview
/**
 * title: 初始化宽度
 * desc: 设置每栏的`initVector`属性可按权分配初始宽度。
 */
import React from 'react';
import { DraggableLayout as Layout } from 'dumi-demo';

const { Wrapper } = Layout;

const style = {
  backgroundColor: '#7dbcea',
  textAlign: 'center',
  color: '#fff',
  lineHeight: '120px',
};

function Index() {
  return (
    <Layout style={{ minHeight: '300px' }}>
      <Wrapper initVector={1} style={style}>
        <span>initVector-1</span>
      </Wrapper>
      <Wrapper initVector={2} style={style}>
        <span>initVector-2</span>
      </Wrapper>
      <Wrapper initVector={1} style={style}>
        <span>initVector-1</span>
      </Wrapper>
    </Layout>
  );
}

export default Index;
```

```tsx | preview
/**
 * title: 最大/最小宽度限制
 * desc: 设置每栏的`minVector`和`maxVector`可限制拖拽的最小/最大宽度。单位支持像素和百分比。<br />默认最小宽度为20px，最大宽度为100%。
 */
import React from 'react';
import { DraggableLayout as Layout } from 'dumi-demo';

const { Wrapper } = Layout;

const style = {
  backgroundColor: '#7dbcea',
  textAlign: 'center',
  color: '#fff',
  lineHeight: '120px',
};

function Index() {
  return (
    <Layout style={{ minHeight: '300px' }}>
      <Wrapper style={style}>
        <span>Left</span>
      </Wrapper>
      <Wrapper minVector="150px" maxVector="40%" style={style}>
        <span>minVector: 150px</span>
        <br />
        <span>maxVector: 40%</span>
      </Wrapper>
      <Wrapper style={style}>
        <span>Right</span>
      </Wrapper>
    </Layout>
  );
}

export default Index;
```

```tsx | preview
/**
 * title: 异步更新列宽
 * desc: 鼠标释放后才更新列宽。
 */
import React from 'react';
import { DraggableLayout as Layout, DragModelType } from 'dumi-demo';

const { Wrapper } = Layout;

const style = {
  backgroundColor: '#7dbcea',
  textAlign: 'center',
  color: '#fff',
  lineHeight: '120px',
};

function Index() {
  return (
    <Layout
      dragModel={DragModelType.asynchronous}
      style={{ minHeight: '300px' }}
    >
      <Wrapper style={style}>
        <span>Left</span>
      </Wrapper>
      <Wrapper style={style}>
        <span>Center</span>
      </Wrapper>
      <Wrapper style={style}>
        <span>Right</span>
      </Wrapper>
    </Layout>
  );
}

export default Index;
```

```tsx | preview
/**
 * title: 垂直布局
 * desc: 支持垂直（纵向）布局。
 */
import React from 'react';
import { DraggableLayout as Layout, LayoutType } from 'dumi-demo';

const { Wrapper } = Layout;

const style = {
  backgroundColor: '#7dbcea',
  textAlign: 'center',
  color: '#fff',
  lineHeight: '120px',
};

function Index() {
  return (
    <Layout layout={LayoutType.vertical} style={{ minHeight: '300px' }}>
      <Wrapper style={style}>
        <span>Top</span>
      </Wrapper>
      <Wrapper style={style}>
        <span>Center</span>
      </Wrapper>
      <Wrapper style={style}>
        <span>Bottom</span>
      </Wrapper>
    </Layout>
  );
}

export default Index;
```

```tsx | preview
/**
 * title: 嵌套使用
 * desc: 支持嵌套使用组成复杂布局。
 */
import React from 'react';
import { DraggableLayout as Layout, LayoutType } from 'dumi-demo';

const { Wrapper } = Layout;

const style = {
  backgroundColor: '#7dbcea',
  textAlign: 'center',
  color: '#fff',
  lineHeight: '120px',
};

function Center() {
  return (
    <Layout
      layout={LayoutType.horizontal}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      <Wrapper style={style}>
        <span>Left</span>
      </Wrapper>
      <Wrapper style={style}>
        <span>Center</span>
      </Wrapper>
      <Wrapper style={style}>
        <span>Right</span>
      </Wrapper>
    </Layout>
  );
}

function Index() {
  return (
    <Layout layout={LayoutType.vertical} style={{ minHeight: '300px' }}>
      <Wrapper style={style}>
        <span>Top</span>
      </Wrapper>
      <Wrapper style={style}>
        <Center />
      </Wrapper>
      <Wrapper style={style}>
        <span>Bottom</span>
      </Wrapper>
    </Layout>
  );
}

export default Index;
```

```tsx | preview
/**
 * title: 响应父容器尺寸变化
 * desc: 只有`initVector`设置为数值的子容器才会响应布局容器的尺寸变化。<br />尝试调整浏览器窗口宽度。
 */
import React from 'react';
import { DraggableLayout as Layout } from 'dumi-demo';

const { Wrapper } = Layout;

const style = {
  backgroundColor: '#7dbcea',
  textAlign: 'center',
  color: '#fff',
  lineHeight: '120px',
};

function Index() {
  return (
    <Layout style={{ minHeight: '300px' }}>
      <Wrapper initVector="200px" style={style}>
        <span>initVector-200px</span>
      </Wrapper>
      <Wrapper initVector={1} style={style}>
        <span>initVector-1</span>
      </Wrapper>
      <Wrapper initVector={1} style={style}>
        <span>initVector-1</span>
      </Wrapper>
    </Layout>
  );
}

export default Index;
```

### API

#### Layout

<API src="./Layout.tsx" hideTitle></API>

#### Wrapper

<API src="./Wrapper.tsx" hideTitle></API>

#### 关于权重、像素和百分比

- 权重：设为初始宽/高度时，子容器的初始宽/高度会根据父容器的剩余宽/高度按权分配，父容器的尺寸变化会按子容器当前宽/高度等比分配给子容器。
- 像素：设为初始宽/高度时表示固定初始值，父容器调整尺寸不会影响子容器。设为最大/小宽高时表示固定最大/小值。
- 百分比：设为初始宽/高度时表示初始值根据父容器计算，父容器调整尺寸不会影响子容器。设为最大/小值时，根据父容器当前尺寸动态计算最大/小值。
