export type CHAR = string | Symbol;

export interface State {
  (char: CHAR): State;
}

export interface Token {
  type: TOKEN_TYPE;
  token: string;
}

export enum TOKEN_TYPE {
  NUMBER = 'NUMBER',
  SIGN = 'SIGN',
}
