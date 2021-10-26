import { fraction } from './utils';

function isValidNumber(num: number) {
  return !(isNaN(num) || num === Infinity || num === -Infinity || num === 0);
}

class FractionNumber {
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
      this.numerator = _numerator;
      this.denominator = _denominator;
    } else {
      this.numerator = _numerator / _denominator;
      this.denominator = 1;
    }
  }

  /**
   * 加法运算
   * @param num 加数
   */
  public add(num: FractionNumber | number): FractionNumber {
    if (typeof num === 'number') {
      return this.add(fraction(num));
    }
    const numerator =
      this.numerator * num.denominator + num.numerator * this.denominator;
    const denominator = this.denominator * num.denominator;
    return new FractionNumber(numerator, denominator);
  }

  /**
   * 除法运算
   * @param num 除数
   */
  public div(num: FractionNumber | number): FractionNumber {
    if (typeof num === 'number') {
      return this.div(fraction(num));
    }
    const numerator = this.numerator * num.denominator;
    const denominator = this.denominator * num.numerator;
    return new FractionNumber(numerator, denominator);
  }

  /**
   * 判断是否与某个值相等
   * @param num 数值
   */
  public equals(num: FractionNumber | number): boolean {
    if (typeof num === 'number') {
      return this.value() === num;
    }
    return (
      this.numerator === num.numerator && this.denominator === num.denominator
    );
  }

  /**
   * 乘法运算
   * @param num 乘数
   */
  public mul(num: FractionNumber | number): FractionNumber {
    if (typeof num === 'number') {
      return this.mul(fraction(num));
    }
    const numerator = this.numerator * num.numerator;
    const denominator = this.denominator * num.denominator;
    return new FractionNumber(numerator, denominator);
  }

  /**
   * 幂运算
   * @param num 指数
   */
  public power(num: number): FractionNumber {
    if (num % 1 !== 0) {
      throw Error(
        `You can't power floating-point numbers, but the number is ${num}`,
      );
    }
    const numerator = this.numerator ** num;
    const denominator = this.denominator ** num;
    return new FractionNumber(numerator, denominator);
  }

  /**
   * 减法运算
   * @param num 加数
   */
  public sub(num: FractionNumber | number): FractionNumber {
    if (typeof num === 'number') {
      return this.sub(fraction(num));
    }
    const numerator =
      this.numerator * num.denominator - num.numerator * this.denominator;
    const denominator = this.denominator * num.denominator;
    return new FractionNumber(numerator, denominator);
  }

  public toString(): string {
    return `${this.value()}`;
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
}

export default FractionNumber;
