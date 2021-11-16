import { Token, TOKEN_TYPE, AstNode, NODE_TYPE } from './interface';

function NumberNode(num: number): AstNode {
  return {
    type: NODE_TYPE.NUMBER,
    children: [null as any],
    value: num,
  };
}

function AddNode(): AstNode {
  return {
    type: NODE_TYPE.ADD,
    children: [],
  };
}

function SubNode(): AstNode {
  return {
    type: NODE_TYPE.SUB,
    children: [],
  };
}

function MulNode(): AstNode {
  return {
    type: NODE_TYPE.MUL,
    children: [],
  };
}

function DivNode(): AstNode {
  return {
    type: NODE_TYPE.DIV,
    children: [],
  };
}

function ParNode(): AstNode {
  return {
    type: NODE_TYPE.PAR,
    children: null as any,
  };
}

function RParNode(): AstNode {
  return {
    type: NODE_TYPE.RPAR,
    children: [],
  };
}

export function createNode(token: Token): AstNode {
  if (token.type === TOKEN_TYPE.NUMBER) {
    return NumberNode(Number(token.token));
  }
  if (token.type === TOKEN_TYPE.SIGN) {
    switch (token.token) {
      case '+':
        return AddNode();
      case '-':
        return SubNode();
      case '*':
        return MulNode();
      case '/':
        return DivNode();
      case '(':
        return ParNode();
      case ')':
        return RParNode();
    }
  }
  throw new Error('unknown token: ' + token.token);
}
