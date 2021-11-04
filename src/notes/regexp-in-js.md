---
title: 2、如何在JS中使用正则？
order: 2
---

## 创建正则表达式对象

### 字面量创建

创建正则表达式字面量时需要使用双斜杠`//`包裹正则表达式主体，模式紧跟在第二个斜杠后。示例如下：

```javascript
// 主体: \d+; 模式: gi
const reg = /\d+/gi;
```

### 构造函数创建

`RegExp`是正则表达式的构造函数，`RegExp()`函数接收两个参数，分别表示正则表达式主体和模式，当正则表达式主体输入为字符串时需要注意对特殊字符进行转义。示例如下：

```javascript
// 主体: \d+; 模式: gi
const reg = new RegExp('\\d+', 'gi');
```

## 使用正则表达式

### 测试字符串

测试一个字符串是否满足某个正则表达式时使用`RegExp.prototype.test()`方法，其接受一个字符串作为参数，返回一个布尔值，表示字符串中是否存在与正则表达式匹配的内容。示例如下：

```javascript
/i/.test('aaiaa'); // true
/^i$/.test('aaiaa'); // false
```

### 匹配字符串

当使用一个正则表达式匹配字符串时通常会得到如下信息：

```typescript
type info = {
  [key: number]: number; // 0表示与正则表达式匹配的子串，1~n依次表示原子组匹配的内容
  index: number; // 与正则表达式匹配的子串在原始字符串中的索引位置
  input: string; // 输入字符串
  groups?: object; // 一个对象，键为正则表达式中原子组的别名，值为原子组匹配的内容
};
```

#### 匹配非全局模式的正则表达式

非全局匹配使用`String.prototype.match`或`RegExp.prototype.exec`进行匹配，每次执行会得到匹配信息。示例如下：

```javascript
console.log('stringstr'.match(/str/));

// ['str', index: 0, input: 'stringstr', groups: undefined]
```

#### 匹配全局模式的正则表达式

- 使用`String.prototype.match`返回一个数组，数组中每个元素时每次匹配到的字符串。示例如下：

  ```javascript
  console.log('stringstr'.match(/str/g));
  // ['str', 'str']
  ```

- 使用`String.prototype.matchAll`返回一个迭代器，每次执行返回一次的匹配信息。示例如下：

  ```javascript
  for (const result of 'stringstr'.matchAll(/str/g)) {
    console.log(result);
  }
  // ['str', index: 0, input: 'stringstr', groups: undefined]
  // ['str', index: 6, input: 'stringstr', groups: undefined]
  ```

- 使用`RegExp.prototype.exec`每执行一次返回一个匹配信息，正则表达式会自动记录上次匹配的索引，直至匹配信息为`null`。示例如下：

  ```javascript
  let result;
  const reg = /str/g;
  while ((result = reg.exec('stringstr'))) {
    console.log(result);
  }
  // ['str', index: 0, input: 'stringstr', groups: undefined]
  // ['str', index: 6, input: 'stringstr', groups: undefined]
  ```

### 替换字符串

替换字符串使用`String.prototype.replace`方法。传入全局模式的正则表达式时会进行全局替换，非全局模式的正则表达式只会进行一次替换。

- 使用新字符串替换。在新字符串中可以使用特殊字符来使用匹配信息。示例如下：

  ```javascript
  // $1-$n: 依次表示原子组匹配的内容
  // $<name>: 表示别名为name的原子组匹配的内容
  // $&: 表示匹配到的子串
  // $`: 表示匹配到的内容的前面的所有字符(原始字符串)
  // $': 表示匹配到的内容的后面的所有字符(原始字符串)
  console.log('<h1>123</h1>'.replace(/<(h[1-6])>[^]*<\/\1>/, '<$1>替换</$1>'));

  // <h1>替换</h1>
  ```

- 使用函数返回值替换。函数接收的第一个参数为满足匹配条件的子串，剩余参数一次是原子组匹配的子串内容。示例如下：

  ```javascript
  const result = '<h1>123</h1>'.replace(
    /<(h[1-6])>[^]*<\/\1>/,
    function (substr, $1) {
      return `<${$1}>替换</${$1}>`;
    },
  );
  console.log(result);

  // <h1>替换</h1>
  ```

## 正则表达式 API

### 字符串方法

| 方法名                        | 说明                                           |
| ----------------------------- | ---------------------------------------------- |
| `String.prototype.match`      | 进行一次匹配                                   |
| `String.prototype.matchAll`   | 以迭代方式进行匹配，只接受全局模式的正则表达式 |
| `String.prototype.replace`    | 替换子串                                       |
| `String.prototype.replaceAll` | 替换子串，只能进行全局替换                     |
| `String.prototype.search`     | 查询子串索引                                   |
| `String.prototype.splice`     | 分割字符串                                     |

### 正则表达式方法

| 方法名                  | 说明                                                   |
| ----------------------- | ------------------------------------------------------ |
| `RegExp.prototype.test` | 测试一个字符串是否可以匹配该正则                       |
| `RegExp.prototype.exec` | 对字符串进行一次匹配，全局匹配模式会记录上次匹配位置。 |
