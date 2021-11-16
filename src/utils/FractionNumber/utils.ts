import FractionNumber from './FractionNumber';
import parseTokens, { Token, TOKEN_TYPE } from './Lexer';
import parser, { AstNode, NODE_TYPE } from './Parser';

type Num = string | number | FractionNumber;

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
 * 递归计算抽象语法树
 * @param astNode 抽象语法树
 */
function astTreeCompute(astNode: AstNode): FractionNumber {
  switch (astNode.type) {
    case NODE_TYPE.NUMBER:
      return fraction(astNode.value);
    case NODE_TYPE.ADD:
      return astTreeCompute(astNode.children[0]).add(
        astTreeCompute(astNode.children[1]),
      );
    case NODE_TYPE.SUB:
      return astTreeCompute(astNode.children[0]).sub(
        astTreeCompute(astNode.children[1]),
      );
    case NODE_TYPE.MUL:
      return astTreeCompute(astNode.children[0]).mul(
        astTreeCompute(astNode.children[1]),
      );
    case NODE_TYPE.DIV:
      return astTreeCompute(astNode.children[0]).div(
        astTreeCompute(astNode.children[1]),
      );
  }
  throw Error(`unknown operation: ${astNode.type}`);
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
  const templateArr = typeof template === 'string' ? [template] : template;
  const tokens: Token[] = [];
  for (let i = 0; i < templateArr.length; i++) {
    tokens.push(...parseTokens(templateArr[i]));
    if (args[i] !== undefined) {
      tokens.push({
        type: TOKEN_TYPE.NUMBER,
        token: args[i] as any,
      });
    }
  }
  const astTree = parser(tokens);
  return astTreeCompute(astTree);
}

export { fraction, fractionCompute };
