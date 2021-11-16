export interface Token {
  type: TOKEN_TYPE;
  token: string;
}

export enum TOKEN_TYPE {
  NUMBER = 'NUMBER',
  SIGN = 'SIGN',
}

export enum NODE_TYPE {
  NEGATE = 'NEGATE', // 负号
  NUMBER = 'NUMBER', // 数字
  ADD = 'ADD', // 加
  SUB = 'SUB', // 减
  MUL = 'MUL', // 乘
  DIV = 'DIV', // 除
  PAR = 'PAR', // 正括号
  RPAR = 'RPAR', // 反括号
}

export interface AstNode {
  type: NODE_TYPE;
  children: AstNode[];
  value?: any;
}
