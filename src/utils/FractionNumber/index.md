---
title: FractionNumber
order: 2
---

## FractionNumber 分数

使用分数保存小数

### 何时使用

- 小数精确计算。

### 使用构造器创建分数

`FractionNumber`是分数的构造器，其接受两个参数表示分子和分母。

```ts
import { FractionNumber } from 'dumi-demo';

const fractionNumber = new FractionNumber(1, 10);

console.log(fractionNumber.value());
// 控制台输出: 0.1
```

### 从小数自动创建分数

`fraction()`函数接收一个数值参数，并返回其分数形式。

```ts
import { fraction } from 'dumi-demo';

const fractionNumber = fraction(0.1);

console.log(fractionNumber.value());
// 控制台输出: 0.1
```

### 四则运算

分数支持四则运算，运算过程为分数计算，故在处理无限小数时也不会丢失精度。以下为加减乘除示例。

```ts
import { fraction } from 'dumi-demo';

const fractionNumber = fraction(0.1);

console.log(fractionNumber.add(0.2).value());
// 控制台输出: 0.3

console.log(fractionNumber.sub(0.2).value());
// 控制台输出: -0.1

console.log(fractionNumber.mul(0.2).value());
// 控制台输出: 0.02

console.log(fractionNumber.div(0.2).value());
// 控制台输出: 0.5
```

### 解析字符串

`fractionCompute()`函数提供了解析四则运算表达式并计算的功能，运算过程均为分数计算。

```ts
import { fractionCompute } from 'dumi-demo';

console.log(fractionCompute('0.1 + 0.2').value());
// 控制台输出: 0.3
```

### 在运算表达式中插入分数

使用`fractionCompute()`时可以在表达式中插入分数，并且不会丢失精度。前提是使用函数的"标签模板"调用形式，请参考下例。

```ts
import { FractionNumber, fractionCompute } from 'dumi-demo';

const fractionNumber1 = new FractionNumber(1, 5);

const result = fractionCompute`3 * ${fractionNumber1} + 0.1`;

console.log(result.value());
// 控制台输出: 0.7
```

### 试一下

fraction、fractionCompute、FractionNumber 已在作用域中。

```tsx | preview
import React, { useState } from 'react';
import { fraction, fractionCompute, FractionNumber } from 'dumi-demo';

const initValue = `
const fractionNumber = fraction(0.1);
const result = fractionCompute\`1 + 2 * (3 + \${fractionNumber}) - 0.2\`;
console.log(result.value());
`;

export default () => {
  const [value, setValue] = useState(initValue);
  const runCode = () => {
    try {
      const fun = new Function(
        'fraction',
        'fractionCompute',
        'FractionNumber',
        value,
      );
      fun(fraction, fractionCompute, FractionNumber);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <>
      <textarea
        style={{
          width: '100%',
          minHeight: '300px',
          fontSize: '16px',
          fontFamily: 'Consolas, Courier, monospace',
          outline: 'none',
          resize: 'none',
        }}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      ></textarea>
      <button onClick={runCode}>run</button>
    </>
  );
};
```

### API

#### FractionNumber 实例方法

| 方法名                                | 参数   | 返回值                                       |
| ------------------------------------- | ------ | -------------------------------------------- |
| add(num: FractionNumber \| number)    | 被加数 | 新的 FractionNumber 实例，为加法运算的结果。 |
| div(num: FractionNumber \| number)    | 除数   | 新的 FractionNumber 实例，为除法运算的结果。 |
| equals(num: FractionNumber \| number) | 数值   | 布尔值，表示两个数是否相等。                 |
| mul(num: FractionNumber \| number)    | 乘数   | 新的 FractionNumber 实例，为乘法运算的结果。 |
| power(num: number): FractionNumber    | 指数   | 新的 FractionNumber 实例，为幂运算的结果。   |
| sub(num: FractionNumber \| number)    | 减数   | 新的 FractionNumber 实例，为减法运算的结果。 |
| value(): number                       |        | 分数计算得到的小数值。                       |

#### 工具函数

| 函数名                                                                                               | 参数                                                                                                                     | 返回值                                                   |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| fraction(num: string \| number \| FractionNumber)                                                    | 可以转为数值的字符串、数值、分数                                                                                         | 将一个数值转为分数，返回一个 FractionNumber 实例。       |
| fractionCompute(template: TemplateStringsArray \| string, ...args: Array<number \| FractionNumber> ) | template 为分段的表达式字符串数组或整个表达式字符串；args 为插入表达式中的值。表达式只能由小括号、四则运算符、数值组成。 | 对一个表达式运用分数计算，返回一个 FractionNumber 实例。 |
