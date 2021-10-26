---
title: BlobResponseHelper
order: 1
nav:
  title: Utils
  order: 2
---

## BlobResponseHelper

### 介绍

#### BlobResponseHelper 是什么？

BlobResponseHelper 是一个用于处理 HTTP 响应的工具类，且只针对响应体为 blob 类型的请求。它提供了一系列处理 blob 数据的方法，包括将 blob 数据转换为其他类型的数据和下载 blob 数据。

#### 何时使用 BlobResponseHelper？

- 需要下载通过 AJAX 下载文件时。BlobResponseHelper 提供了 blob 下载方法，且可以通过传入回调函数进行条件下载。
- 需要在客户端处理 blob 数据时。BlobResponseHelper 允许将 blob 类型的响应数据转换为其他数据类型。

### 创建 BlobResponseHelper 实例

BlobResponseHelper 提供了四种方式用于创建 BlobResponseHelper 实例：通过 URL 创建、通过 axios 创建、通过 XMLHttpRequest 创建、通过 fetch 创建。

- 根据 URL 创建。BlobResponseHelper 允许直接从文件下载地址创建。

  ```javascript
  const blobResponseHelper = BlobResponseHelper.fromURL(
    'https://picsum.photos/200/300',
  );
  ```

- 通过 axios 创建。根据 axios 创建实例时，需要将 axios 请求的响应对象或被 Promise 包装过的该对象传入静态方法 fromAxiosResponse()中。注意需要将 axios 请求的 responseType 设为 blob。

  ```javascript
  // 发送一个axios请求，且需要将responseType设为blob
  const axiosResponse = axios(
    `https://picsum.photos/200/300?random=${Date.now()}`,
    {
      responseType: 'blob',
    },
  );
  // 根据axios响应对象创建BlobResponseHelper实例
  const blobResponseHelper =
    BlobResponseHelper.fromAxiosResponse(axiosResponse);
  ```

- 通过 XMLHttpRequest 创建。根据 XMLHttpRequest 创建时，需要将 XMLHttpRequest 实例传入静态方法 fromXMLHttpRequest()中。注意需要将请求的 responseType 设为 blob 且不能设置 XMLHttpRequest 实例的 onload 属性，BlobResponseHelper 需要根据 onload 进行初始化。

  ```javascript
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `https://picsum.photos/200/300?random=${Date.now()}`);
  xhr.responseType = 'blob';
  xhr.send();
  const blobResponseHelper = BlobResponseHelper.fromXMLHttpRequest(xhr);
  ```

- 通过 fetch 创建。根据 fetch 请求创建时，只需将 fetch 请求的响应对象或被 Promise 包装过的该对象传入 fromFetchResponse 方法即可，无需进行其他设置。

  ```javascript
  const fetchResponse = fetch(
    `https://picsum.photos/200/300?random=${Date.now()}`,
  );
  const blobResponseHelper =
    BlobResponseHelper.fromFetchResponse(fetchResponse);
  ```

### 将响应数据转为其他类型数据

BlobResponseHelper 提供了将响应 blob 数据转换为其他类型的方法，可转换类型包括：ArrayBuffer、JSON 解析数据、文本数据、ObjectURL、DataURL。获取这些数据时均为 Promise 包装后的结果。

```javascript
// 获取文本数据
blobResponseHelper.text().then((result) => console.log(result));
// 获取DataURL
blobResponseHelper.dataURL().then((result) => console.log(result));
```

### 下载文件

BlobResponseHelper 提供了直接下载响应数据的方法，下载文件的结果会返回为一个 Promise 对象。默认只有当 http 请求的状态码在 200~299 之间时才会下载，且返回的 Promise 对象状态为“成功”，其他情况均为“失败”。下载时允许传入一个回调函数用于自定义判断是否应该下载。

```javascript
blobResponseHelper
  .download()
  .then(() => alert('下载成功'))
  .catch(() => alert('下载失败'));
```

### Demo

```tsx | preview
import React, { useState } from 'react';
import { BlobResponseHelper, BlobHelper } from 'dumi-demo';

export default () => {
  const [href, setHref] = useState('https://picsum.photos/200/300');
  const [filename, setFilename] = useState(`default_name.jpg`);
  const [loading, setLoading] = useState(false);
  const handleDownload = () => {
    const blobResponseHelper = BlobResponseHelper.fromURL(href);
    setLoading(true);
    blobResponseHelper.download({ filename }).finally(() => setLoading(false));
  };

  return (
    <>
      <div style={{ display: 'flex', marginBottom: '10px' }}>
        <label style={{ width: '100px' }} htmlFor="href">
          下载链接:{' '}
        </label>
        <input
          style={{ flex: '1', outline: 'none' }}
          id="href"
          type="text"
          value={href}
          onChange={(e) => setHref(e.target.value)}
          placeholder="请输入下载链接"
        />
      </div>
      <div style={{ display: 'flex' }}>
        <label style={{ width: '100px' }} htmlFor="filename">
          文件名:{' '}
        </label>
        <input
          style={{ flex: '1', outline: 'none' }}
          id="filename"
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="请输入文件名"
        />
      </div>
      <br />
      <button disabled={loading} onClick={handleDownload}>
        {loading ? 'Download...' : '点我下载'}
      </button>
    </>
  );
};
```

### API

#### BlobResponseHelper

##### 静态方法

| 方法                        | 说明                                                 | 参数                                                           | 返回值                  |
| --------------------------- | ---------------------------------------------------- | -------------------------------------------------------------- | ----------------------- |
| fromURL(url)                | 根据文件下载地址创建 BlobResponseHelper 实例         | 文件下载地址                                                   | BlobResponseHelper 实例 |
| fromAxiosResponse(response) | 根据 Axios 请求实例化 BlobResponseHelper             | 接收 axios 的响应对象或一个返回响应对象的 Promise 对象作为参数 | BlobResponseHelper 实例 |
| fromXMLHttpRequest(xhr)     | 根据 XMLHttpRequest 实例创建 BlobResponseHelper 实例 | 接收 XMLHttpRequest 实例作为参数                               | BlobResponseHelper 实例 |
| fromFetchResponse(response) | 根据 fetch 请求实例化 BlobResponseHelper             | 接收 fetch 的响应对象或一个返回响应对象的 Promise 对象作为参数 | BlobResponseHelper 实例 |

##### 实例方法

| 方法              | 说明                                                                                                      | 参数                                                                                                                                                                                                                                     | 返回值                                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| ok()              | 判断本次 http 请求是否成功(状态码为 200~299)                                                              |                                                                                                                                                                                                                                          | 返回一个 Promise 包装的布尔值表示是否成功                                                                                     |
| status()          | 返回本次请求的状态码                                                                                      |                                                                                                                                                                                                                                          | 返回 Promise 包装后的状态码                                                                                                   |
| statusText()      | 返回本次请求状态码的描述信息                                                                              |                                                                                                                                                                                                                                          | 返回 Promise 包装后的描述信息                                                                                                 |
| headers()         | 返回本次请求的响应头                                                                                      |                                                                                                                                                                                                                                          | 返回 Promise 包装后的响应头                                                                                                   |
| arrayBuffer()     | 返回响应转为 ArrayBuffer 的结果                                                                           |                                                                                                                                                                                                                                          | 返回一个 Promise 包装的 ArrayBuffer 实例                                                                                      |
| blob()            | 返回接收到的 blob 对象                                                                                    |                                                                                                                                                                                                                                          | 返回一个 Promise 包装的 Blob 实例                                                                                             |
| blobHelper()      | 返回内置的 blob 工具类实例                                                                                |                                                                                                                                                                                                                                          | 返回一个 Promise 包装的 BlobHelper 实例                                                                                       |
| json()            | 返回 JSON 解析数据的结果。先将 blob 转为文本类型再使用 JSON.parse 进行解析                                |                                                                                                                                                                                                                                          | 返回一个 Promise 包装的 JSON 类型的数据                                                                                       |
| text()            | 返回响应转为文本类型的结果                                                                                |                                                                                                                                                                                                                                          | 返回一个 Promise 包装的字符串                                                                                                 |
| objectURL()       | 返回 blob 数据的 ObjectURL                                                                                |                                                                                                                                                                                                                                          | 返回一个 Promise 包装的 URL 字符串                                                                                            |
| dataURL()         | 返回 blob 数据的 dataURL                                                                                  |                                                                                                                                                                                                                                          | 返回一个 Promise 包装的 URL 字符串                                                                                            |
| download(options) | 下载 blob 文件，下载文件的文件名优先使用 options 中配置的文件名，其次是响应头中的文件名和内置的默认文件名 | options 包含两个可选属性：filename、shouldDownload。filename 表示文件名；shouldDownload 是一个回调函数，用于判断是否应该进行本次下载，它将接收状态码、请求头、请求体三个参数，返回一个布尔值；shouldDownload 也可以是 true，表示总是下载 | 返回一个 Promise 对象。如果进行了下载那么 Promise 对象的状态为”成功“，反之则为“失败”。失败时将返回 BlobReponseHelper 实力自身 |

#### BlobHelper

BlobHelper 是用于直接处理 blob 对象的工具类，BlobResponseHelper 基于此类实现。

##### 静态方法

BlobHelper 提供了一系列用于构造 BlobHelper 实例的静态方法。这些方法均会将传入的参数转为 Blob 类型。

| 方法                                   | 说明                                         | 参数                                                                   | 返回值          |
| -------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------- | --------------- |
| fromArrayBuffer(arrayBuffer, mimetype) | 通过 ArrayBuffer 构建 BlobHelper 实例        | arrayBuffer 为 ArrayBuffer 实例; mimetype 为该数据的 MIME 类型，可选   | BlobHelper 实例 |
| fromBase64(base64, mimetype)           | 通过 base64 编码的字符串构建 BlobHelper 实例 | base64 为 base64 格式编码的字符串；mimetype 为该数据的 MIME 类型，可选 | BlobHelper 实例 |
| fromBlob(blob)                         | 根据 Blob 构建 BlobHelper 实例               | Blob 对象                                                              | BlobHelper 实例 |
| fromDataURL(dataURL)                   | 根据 dataURL 构建 BlobHelper 实例            | 一个表示 dataURL 的字符串                                              | BlobHelper 实例 |
| fromText(text)                         | 根据文本字符串构建 BlobHelper 实例           | 文本字符串                                                             | BlobHelper 实例 |

##### 实例方法

| 方法               | 说明                                                       | 参数                   | 返回值                          |
| ------------------ | ---------------------------------------------------------- | ---------------------- | ------------------------------- |
| arrayBuffer()      | 返回 ArrayBuffer 形式的数据                                |                        | Promise 包装的 ArrayBuffer 对象 |
| blob()             | 返回 Blob 数据                                             |                        | Promise 包装的 Blob 对象        |
| dataURL()          | 返回数据的 dataURL                                         |                        | Promise 包装的表示 URL 的字符串 |
| download(filename) | 下载文件，优先使用传入的文件名，其次是内置的默认文件名。   | 一个表示文件名的字符串 | Promise 对象，表示是否开始下载  |
| json()             | 返回 JSON 类型的数据。先将 blob 类型转为文本类型再进行解析 |                        | Promise 包装的 JSON 类型数据    |
| objectURL()        | 返回数据的 objectURL                                       |                        | Promise 包装的表示 URL 的字符串 |
| text()             | 返回文本类型的数据                                         |                        | Promise 包装的文本数据          |
