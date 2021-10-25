const DEFAULT_FILENAME = 'default_filename';
class BlobHelper {
  /**
   * 根据ArrayBuffer构建
   * @param arrayBuffer ArrayBuffer实例
   * @param mimetype MIME类型
   * @returns {BlobHelper}
   */
  static fromArrayBuffer(arrayBuffer, mimetype) {
    const blob = new Blob([arrayBuffer], { type: mimetype });
    const blobHelper = BlobHelper.fromBlob(blob);
    blobHelper._arrayBuffer = Promise.resolve(arrayBuffer);
    return blobHelper;
  }
  /**
   * 根据base64编码的字符串构建
   * @param base64 base64格式编码的字符串
   * @param mimetype MIME类型
   * @returns {BlobHelper}
   */
  static fromBase64(base64, mimetype) {
    const beforeStr = atob(base64);
    const arrayBuffer = new ArrayBuffer(beforeStr.length);
    const arrayView = new Uint8Array(arrayBuffer);
    for (let i = 0; i < beforeStr.length; i++) {
      arrayView[i] = beforeStr.charCodeAt(i);
    }
    return BlobHelper.fromArrayBuffer(arrayBuffer, mimetype);
  }
  /**
   * 根据Blob数据构建
   * @param blob Blob实例
   * @returns {BlobHelper}
   */
  static fromBlob(blob) {
    if (!(blob instanceof Blob)) {
      throw new Error('必须为blob类型');
    }
    return new BlobHelper(blob);
  }
  /**
   * 根据dataURL构建
   * @param dataURL
   * @returns {BlobHelper}
   */
  static fromDataURL(dataURL) {
    const dataURLArray = dataURL.split(/[:;,]/);
    const mimetype = dataURLArray[1];
    const data = dataURLArray[dataURLArray.length - 1];
    const blobHelper = BlobHelper.fromBase64(data, mimetype);
    blobHelper._dataURL = Promise.resolve(dataURL);
    return blobHelper;
  }
  /**
   * 根据文本字符串创建
   * @param text 文本字符串
   * @param mimetype MIME类型
   */
  static fromText(text, mimetype = 'text/plain') {
    const blob = new Blob([text], { type: mimetype });
    const blobHelper = BlobHelper.fromBlob(blob);
    blobHelper._text = Promise.resolve(text);
    return blobHelper;
  }
  constructor(blob) {
    this._blob = Promise.resolve(blob);
  }
  /**
   * 返回ArrayBuffer形式的数据
   * @returns {Promise<ArrayBuffer>} Promise包装过的ArrayBuffer对象
   */
  async arrayBuffer() {
    if (this._arrayBuffer) {
      return this._arrayBuffer;
    }
    const blob = await this.blob();
    const reader = new FileReader();
    this._arrayBuffer = new Promise((resolve) => {
      reader.onload = (e) => {
        resolve(reader.result);
      };
      reader.readAsArrayBuffer(blob);
    });
    return this._arrayBuffer;
  }
  /**
   * 返回Blob数据
   * @returns {Promise<Blob>} Promise包装过的Blob对象
   */
  async blob() {
    return this._blob;
  }
  /**
   * 返回dataURL
   * @returns {Promise<string>} Promise包装过的URL字符串
   */
  async dataURL() {
    if (this._dataURL) {
      return this._dataURL;
    }
    const blob = await this.blob();
    const reader = new FileReader();
    this._dataURL = new Promise((resolve) => {
      reader.onload = (e) => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
    return this._dataURL;
  }
  /**
   * 下载文件
   * @param filename 文件名
   * @returns {Promise<void>}
   */
  async download(filename = DEFAULT_FILENAME) {
    const url = await this.objectURL();
    const eleA = document.createElement('a');
    eleA.href = url;
    eleA.target = '_blank';
    eleA.download = filename;
    eleA.click();
  }
  /**
   * 返回JSON数据
   * @returns {Promise<*>}
   */
  async json() {
    if (this._json) {
      return this._json;
    }
    const text = await this.text();
    this._json = Promise.resolve(JSON.parse(text));
    return this._json;
  }
  /**
   * 返回objectURL
   * @returns {Promise<string>} Promise包装过的URL字符串
   */
  async objectURL() {
    if (this._objectURL) {
      return this._objectURL;
    }
    const blob = await this.blob();
    this._objectURL = Promise.resolve(URL.createObjectURL(blob));
    return this._objectURL;
  }
  /**
   * 返回文本数据
   * @returns {Promise<string>} Promise包装过的文本数据
   */
  async text() {
    if (this._text) {
      return this._text;
    }
    const blob = await this.blob();
    this._text = blob.text();
    return this._text;
  }
  _arrayBuffer;
  _blob;
  _dataURL;
  _json;
  _objectURL;
  _text;
}
export default BlobHelper;
