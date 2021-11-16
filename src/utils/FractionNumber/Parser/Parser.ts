import { AstNode, NODE_TYPE, Token, TOKEN_TYPE } from './interface';
import { createNode } from './node';

type AstTree = false | AstNode;

export function parser(tokens: Token[]): AstNode {
  const result = getAddExp(tokens);
  if (!result) {
    throw new Error('expression error');
  }
  return result;
}

function getAddExp(tokens: Token[]): AstTree {
  for (let i = 1; i < tokens.length - 1; i++) {
    const addOpt = getAddOpt(tokens[i]);
    if (!addOpt) {
      continue;
    }
    const addExp = getAddExp(tokens.slice(0, i));
    if (!addExp) {
      continue;
    }
    const mulExp = getMulExp(tokens.slice(i + 1));
    if (!mulExp) {
      continue;
    }
    addOpt.children.push(addExp, mulExp);
    return addOpt;
  }
  return getMulExp(tokens);
}

function getMulExp(tokens: Token[]): AstTree {
  for (let i = 1; i < tokens.length - 1; i++) {
    const mulOpt = getMulOpt(tokens[i]);
    if (!mulOpt) {
      continue;
    }
    const mulExp = getMulExp(tokens.slice(0, i));
    if (!mulExp) {
      continue;
    }
    const atomicExp = getAtomicExp(tokens.slice(i + 1));
    if (!atomicExp) {
      continue;
    }
    mulOpt.children.push(mulExp, atomicExp);
    return mulOpt;
  }
  return getAtomicExp(tokens);
}

function getAddOpt(token: Token): AstTree {
  const node = createNode(token);
  return (node.type === NODE_TYPE.ADD || node.type === NODE_TYPE.SUB) && node;
}

function getMulOpt(token: Token): AstTree {
  const node = createNode(token);
  return (node.type === NODE_TYPE.MUL || node.type === NODE_TYPE.DIV) && node;
}

function getAtomicExp(tokens: Token[]): AstTree {
  if (tokens.length === 1) {
    return getNum(tokens[0]);
  }
  if (tokens.length > 2) {
    const firstNode = createNode(tokens[0]);
    const lastNode = createNode(tokens[tokens.length - 1]);
    if (firstNode.type === NODE_TYPE.PAR && lastNode.type === NODE_TYPE.RPAR) {
      return getAddExp(tokens.slice(1, tokens.length - 1));
    }
  }
  if (tokens.length >= 2) {
    const addOpt = getAddOpt(tokens[0]);
    const atomicExp = getAtomicExp(tokens.slice(1));
    if (addOpt && atomicExp) {
      const zero = createNode({
        type: TOKEN_TYPE.NUMBER,
        token: '0',
      });
      addOpt.children.push(zero, atomicExp);
      return addOpt;
    }
  }
  return false;
}

function getNum(token: Token): AstTree {
  const node = createNode(token);
  return node.type === NODE_TYPE.NUMBER && node;
}
