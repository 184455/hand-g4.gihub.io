import BlobHelper from './BlobHelper';

interface AxiosResponse {
  data: Blob;
  headers: any;
  status: number;
  statusText: string;
}

type PromiseOrNot<T> = Promise<T> | T;
type ShouldDownload =
  | ((status: number, headers: any, blob: Blob) => boolean)
  | boolean;

function convertXhrHeadersToObject(xhrHeaders: string) {
  const headers: any = {};
  xhrHeaders.split(/\r?\n/).forEach((header) => {
    const [key, value] = header.split(/: /);
    if (!key) {
      return;
    }
    headers[key] = value;
  });
  return headers;
}

class BlobResponseHelper {
  /**
   * 根据Axios请求构建
   * @returns {BlobResponseHelper}
   */
  static fromAxiosResponse(response: AxiosResponse | Promise<AxiosResponse>) {
    const promise = Promise.resolve(response);
    const status = promise.then((res) => res.status);
    const statusText = promise.then((res) => res.statusText);
    const headers = promise.then((res) => res.headers);
    const data = promise.then((res) => res.data);
    return new BlobResponseHelper(status, statusText, headers, data);
  }

  /**
   * 根据Fetch请求构建
   * @returns {BlobResponseHelper}
   */
  static fromFetchResponse(response: Response | Promise<Response>) {
    const promise = Promise.resolve(response);
    const status = promise.then((res) => res.status);
    const statusText = promise.then((res) => res.statusText);
    const headers = promise.then((res) => {
      return Array.from(res.headers.entries()).reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {} as any);
    });
    const data = promise.then((res) => res.blob());
    return new BlobResponseHelper(status, statusText, headers, data);
  }

  /**
   * 根据URL构建
   * @param url 文件所在地址
   */
  static fromURL(url: string) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    xhr.send();
    return this.fromXMLHttpRequest(xhr);
  }

  /**
   * 根据XMLHttpRequest请求构建
   * @returns {BlobResponseHelper}
   */
  static fromXMLHttpRequest(xhr: XMLHttpRequest) {
    if (xhr.readyState === 4) {
      const status = xhr.status;
      const statusText = xhr.statusText;
      const headers = convertXhrHeadersToObject(xhr.getAllResponseHeaders());
      const data = xhr.response;
      return new BlobResponseHelper(status, statusText, headers, data);
    }
    const promise = new Promise<AxiosResponse>((resolve) => {
      xhr.onload = () => {
        resolve({
          status: xhr.status,
          statusText: xhr.statusText,
          headers: convertXhrHeadersToObject(xhr.getAllResponseHeaders()),
          data: xhr.response,
        });
      };
    });
    const status = promise.then((res) => res.status);
    const statusText = promise.then((res) => res.statusText);
    const headers = promise.then((res) => res.headers);
    const data = promise.then((res) => res.data);
    return new BlobResponseHelper(status, statusText, headers, data);
  }

  /**
   * 构造函数
   * @param status number | Promise<number> 状态码
   * @param statusText string | Promise<string> 状态信息
   * @param headers object | Promise<object> 响应头部
   * @param data blob | Promise<blob> 响应体
   */
  constructor(
    status: PromiseOrNot<number>,
    statusText: PromiseOrNot<string>,
    headers: PromiseOrNot<object>,
    data: PromiseOrNot<Blob>,
  ) {
    this._status = Promise.resolve(status);
    this._statusText = Promise.resolve(statusText);
    this._headers = Promise.resolve(headers);
    this._data = Promise.resolve(data);
  }

  /**
   * 获取arrayBuffer数据
   * @returns {Promise<ArrayBuffer>}
   */
  async arrayBuffer() {
    const blobHelper = await this.blobHelper();
    return blobHelper.arrayBuffer();
  }

  /**
   * 获取blob数据
   * @returns {Promise<Blob>}
   */
  async blob() {
    const blobHelper = await this.blobHelper();
    return blobHelper.blob();
  }

  /**
   * 返回blobHelper
   * @returns {Promise<BlobHelper>}
   */
  async blobHelper() {
    if (this._blobHelper) {
      return this._blobHelper;
    }
    const data = await this._data;
    if (!data) {
      return Promise.reject(null);
    }
    this._blobHelper = Promise.resolve(BlobHelper.fromBlob(data));
    return this._blobHelper;
  }

  /**
   * 生成dataURL
   * @returns {Promise<string>} 返回Promise包装的URL
   */
  async dataURL() {
    const blobHelper = await this.blobHelper();
    return blobHelper.dataURL();
  }

  /**
   * 下载文件
   * @param filename 文件名
   * @param shouldDownload 根据响应信息判断是否应该下载文件，可以为true，表示始终下载；可以为一个回调函数，返回值用于判断是否下载
   * @returns {Promise<*|Promise<never>>} 返回一个Promise对象用于判断下载是否成功
   */
  async download({
    filename = '',
    shouldDownload = false,
  }: { filename?: string; shouldDownload?: ShouldDownload } = {}) {
    let ok = false;
    if (shouldDownload === true) {
      ok = true;
    } else if (shouldDownload instanceof Function) {
      const status = await this._status;
      const headers = await this._headers;
      const blob = await this.blob();
      ok = shouldDownload(status, headers, blob);
    } else {
      ok = await this.ok();
    }
    const blobHelper = await this.blobHelper();
    return ok
      ? blobHelper.download(filename || (await this.filename()))
      : Promise.reject(this);
  }

  /**
   * 返回响应头
   * @returns {Promise<void>}
   */
  async headers() {
    return this._headers;
  }

  /**
   * 返回json类型的数据
   * @returns {Promise<*>} 返回Promise包装的json数据
   */
  async json() {
    const blobHelper = await this.blobHelper();
    return blobHelper.json();
  }

  /**
   * 创建objectURL
   * @returns {Promise<string>} 返回Promise包装的URL
   */
  async objectURL() {
    const blobHelper = await this.blobHelper();
    return blobHelper.objectURL();
  }

  /**
   * 判断响应是否成功
   * @returns {Promise<boolean>}
   */
  async ok() {
    if (this._ok !== undefined) {
      return this._ok;
    }
    const status = await this._status;
    this._ok = Promise.resolve(status >= 200 && status <= 299);
    return this._ok;
  }

  /**
   * 返回状态码
   * @returns {Promise<number>}
   */
  async status() {
    return this._status;
  }

  /**
   * 返回状态描述
   * @returns {Promise<string>}
   */
  async statusText() {
    return this._statusText;
  }

  /**
   * 获取文本数据
   * @returns {Promise<string>} 返回Promise包装的文本
   */
  async text() {
    const blobHelper = await this.blobHelper();
    return blobHelper.text();
  }

  private _blobHelper?: Promise<BlobHelper>;
  private _ok?: Promise<boolean>;
  private readonly _data: Promise<Blob>;
  private readonly _headers: Promise<any>;
  private readonly _status: Promise<number>;
  private readonly _statusText: Promise<string>;

  // 私有方法，根据响应头的content-disposition属性获取文件名
  private async filename() {
    const headers = await this._headers;
    const disposition: string = headers?.['content-disposition'];
    if (!disposition) {
      return '';
    }
    return disposition.match(/filename=(['"]?)(?<filename>.*?)\1/i)?.groups
      ?.filename;
  }
}

export default BlobResponseHelper;
