import { security } from './utils';

function isValidNumber(num: number) {
  return !(isNaN(num) || num === Infinity || num === -Infinity || num === 0);
}

class SecurityNumber {
  // 分子
  private readonly numerator;
  // 分母
  private readonly denominator;

  constructor(numerator: number, denominator: number) {
    let _numerator = numerator;
    let _denominator = denominator;
    if (isValidNumber(_numerator) && isValidNumber(_denominator)) {
      let temp1 = _denominator,
        temp2 = _numerator;
      while (temp1 % temp2 !== 0) {
        let temp = temp2;
        temp2 = temp1 % temp2;
        temp1 = temp;
      }
      _numerator /= temp2;
      _denominator /= temp2;
    }
    this.numerator = _numerator;
    this.denominator = _denominator;
  }

  public equals(num: SecurityNumber | number): boolean {
    if (typeof num === 'number') {
      return this.value() === num;
    }
    return this.numerator === num.numerator;
  }

  /**
   * 加法运算
   * @param num 加数
   */
  public add(num: SecurityNumber | number): SecurityNumber {
    if (typeof num === 'number') {
      return this.add(security(num));
    }
    const numerator =
      this.numerator * num.denominator + num.numerator * this.denominator;
    const denominator = this.denominator * num.denominator;
    return new SecurityNumber(numerator, denominator);
  }

  /**
   * 减法运算
   * @param num 加数
   */
  public subtract(num: SecurityNumber | number): SecurityNumber {
    if (typeof num === 'number') {
      return this.subtract(security(num));
    }
    const numerator =
      this.numerator * num.denominator - num.numerator * this.denominator;
    const denominator = this.denominator * num.denominator;
    return new SecurityNumber(numerator, denominator);
  }

  /**
   * 乘法运算
   * @param num 乘数
   */
  public multiply(num: SecurityNumber | number): SecurityNumber {
    if (typeof num === 'number') {
      return this.multiply(security(num));
    }
    const numerator = this.numerator * num.numerator;
    const denominator = this.denominator * num.denominator;
    return new SecurityNumber(numerator, denominator);
  }

  /**
   * 除法运算
   * @param num 除数
   */
  public divide(num: SecurityNumber | number): SecurityNumber {
    if (typeof num === 'number') {
      return this.divide(security(num));
    }
    const numerator = this.numerator * num.denominator;
    const denominator = this.denominator * num.numerator;
    return new SecurityNumber(numerator, denominator);
  }

  /**
   * 幂运算
   * @param num 指数
   */
  public power(num: number): SecurityNumber {
    if (num % 1 !== 0) {
      throw Error(`Cannot run power with float while the number is ${num}`);
    }
    const numerator = this.numerator ** num;
    const denominator = this.denominator ** num;
    return new SecurityNumber(numerator, denominator);
  }

  /**
   * 求值
   */
  public value(): number {
    return this.numerator / this.denominator;
  }

  public valueOf(): number {
    return this.value();
  }

  public toString(): string {
    return `${this.value()}`;
  }
}

export default SecurityNumber;
