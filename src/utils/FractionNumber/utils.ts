import FractionNumber from './FractionNumber';

type Num = string | number | FractionNumber;

const tokenReg = /[+\-*/()]|[.\d]+/g;
const tokenValidReg = /^([+\-*/()]|\d*\.?\d+)$/;
const ErrorNumberReg = /\d+\.?\s+\.?\d+/;

/**
 * 将一个数值包装为分数
 * @param num
 * @constructor
 */
function fraction(num: Num): FractionNumber {
  if (num instanceof FractionNumber) {
    return num;
  }
  const number = typeof num === 'string' ? Number(num) : num;
  if (
    isNaN(number) ||
    number === 0 ||
    number === Infinity ||
    number === -Infinity
  ) {
    return new FractionNumber(number, 1);
  }
  let denominator = 1;
  while ((number * denominator) % 1) {
    denominator *= 10;
  }
  return new FractionNumber(number * denominator, denominator);
}

/**
 * 原子计算
 * @param num1 算子
 * @param operation 运算符
 * @param num2 算子
 */
function atomicCompute(num1: Num, operation: string, num2: Num) {
  const x = fraction(num1);
  const y = fraction(num2);
  switch (operation) {
    case '+':
      return x.add(y);
    case '-':
      return x.sub(y);
    case '*':
      return x.mul(y);
    case '/':
      return x.div(y);
  }
  throw Error(`unknown operation: ${operation}`);
}

/**
 * 对一个表达式进行计算
 * @param tokens 表达式词法数组
 */
function computeExpression(
  tokens: Array<string | number | FractionNumber>,
): FractionNumber {
  let lastComputeNumber;
  let lastOperation;
  const bracketStack: Array<number> = [];
  const curTokens = tokens.slice();
  for (let i = 0; i < curTokens.length; i++) {
    const token = curTokens[i];
    if (
      bracketStack.length > 0 &&
      (typeof token !== 'string' || !/[()]/.test(token))
    ) {
      continue;
    }
    switch (token) {
      case '(':
        bracketStack.push(i);
        break;
      case ')':
        if (bracketStack.length === 0) {
          throw Error('Unexpected token: )');
        }
        const lastBracket = bracketStack.pop();
        if (bracketStack.length === 0 && typeof lastBracket === 'number') {
          curTokens.splice(
            lastBracket,
            i - lastBracket + 1,
            computeExpression(curTokens.slice(lastBracket + 1, i)),
          );
          i = lastBracket - 1;
        }
        break;
      case '*':
        if (!!lastOperation || lastComputeNumber === undefined) {
          throw Error('Unexpected token: *');
        }
        lastOperation = '*';
        break;
      case '/':
        if (!!lastOperation || lastComputeNumber === undefined) {
          throw Error('Unexpected token: /');
        }
        lastOperation = '/';
        break;
      case '+':
        if (!!lastOperation || (!lastOperation && !lastComputeNumber)) {
          curTokens.splice(i, 1, fraction(1), '*');
          i -= 1;
          break;
        }
        if (!!lastOperation || lastComputeNumber === undefined) {
          throw Error('Unexpected token: +');
        }
        lastOperation = '+';
        curTokens.splice(
          i + 1,
          curTokens.length - i,
          computeExpression(curTokens.slice(i + 1, curTokens.length)),
        );
        break;
      case '-':
        if (!!lastOperation || (!lastOperation && !lastComputeNumber)) {
          curTokens.splice(i, 1, fraction(-1), '*');
          i -= 1;
          break;
        }
        if (!!lastOperation || lastComputeNumber === undefined) {
          throw Error('Unexpected token: -');
        }
        lastOperation = '+';
        curTokens.splice(
          i,
          curTokens.length - i,
          '+',
          computeExpression(curTokens.slice(i, curTokens.length)),
        );
        break;
      default:
        if (!!lastOperation && lastComputeNumber !== undefined) {
          curTokens.splice(
            i - 2,
            3,
            atomicCompute(lastComputeNumber, lastOperation, token),
          );
          i -= 3;
          lastOperation = undefined;
          lastComputeNumber = undefined;
        } else if (lastComputeNumber !== undefined) {
          throw Error(`Unexpected token: ${lastComputeNumber}`);
        } else if (lastOperation !== undefined) {
          throw Error(`Unexpected token: ${lastOperation}`);
        } else {
          lastComputeNumber = token;
        }
        break;
    }
  }
  if (bracketStack.length > 0) {
    throw Error('Missing close bracket');
  }
  const result = curTokens[0];
  if (typeof result === 'string') {
    return fraction(Number(result));
  }
  if (typeof result === 'number') {
    return fraction(result);
  }
  return result;
}

/**
 * 计算
 * @param template 计算表达式
 * @param args 插值
 */
function fractionCompute(
  template: TemplateStringsArray | string,
  ...args: Array<number | FractionNumber>
): FractionNumber {
  const strings = typeof template === 'string' ? [template] : template;
  const tokens: Array<string | number | FractionNumber> = [];
  for (let i = 0; i < strings.length; i++) {
    const templateString = strings[i];
    if (ErrorNumberReg.test(templateString)) {
      throw Error(
        `Unexpected token: ${templateString.match(ErrorNumberReg)?.[0]}`,
      );
    }
    const otherChars = templateString
      .replace(/\s/g, '')
      .replace(tokenReg, (value) => {
        tokens.push(value);
        return '';
      });
    if (args[i] !== undefined) {
      tokens.push(args[i]);
    }
    if (otherChars !== '') {
      throw Error(`Unexpected token: ${otherChars}`);
    }
  }
  tokens.forEach((token) => {
    if (typeof token === 'string' && !tokenValidReg.test(token)) {
      throw Error(`Unexpected token: ${token}`);
    }
  });
  return computeExpression(tokens);
}

export { fraction, fractionCompute };
