import TokenError from './TokenError';
import { NUMBER_REGEX, POINTER_REGEX, SIGN_REGEX, BLANK_REGEX } from './regexp';
import { State, Token, CHAR, TOKEN_TYPE } from './interface';

const EOF = Symbol('EOF');

class Lexer {
  private state: State = this.start;
  private tokenChars: string[] = [];
  private tokens: Token[] = [];

  clear() {
    this.tokenChars = [];
    this.tokens = [];
    this.state = this.start;
  }

  end() {
    this.state(EOF);
  }

  getTokens() {
    return this.tokens;
  }

  push(char: string) {
    this.state = this.state(char);
  }

  private emmitToken(type: TOKEN_TYPE, token: string) {
    this.tokens.push({
      type,
      token,
    });
  }

  private inFloat(char: CHAR): State {
    if (typeof char === 'string') {
      if (NUMBER_REGEX.test(char)) {
        this.tokenChars.push(char);
        return this.inFloat;
      }
      if (POINTER_REGEX.test(char)) {
        throw new TokenError(char);
      }
      if (this.tokenChars.length === 0) {
        throw new TokenError('.');
      }
    }
    this.emmitToken(TOKEN_TYPE.NUMBER, this.tokenChars.join(''));
    this.tokenChars = [];
    return this.start(char);
  }

  private inInt(char: CHAR): State {
    if (typeof char === 'string') {
      if (NUMBER_REGEX.test(char)) {
        this.tokenChars.push(char);
        return this.inInt;
      }
      if (POINTER_REGEX.test(char)) {
        this.tokenChars.push(char);
        return this.inFloat;
      }
    }
    this.emmitToken(TOKEN_TYPE.NUMBER, this.tokenChars.join(''));
    this.tokenChars = [];
    return this.start(char);
  }

  private start(char: CHAR): State {
    if (typeof char === 'string') {
      if (NUMBER_REGEX.test(char)) {
        this.tokenChars.push(char);
        return this.inInt;
      }
      if (POINTER_REGEX.test(char)) {
        this.tokenChars.push(char);
        return this.inFloat;
      }
      if (SIGN_REGEX.test(char)) {
        this.emmitToken(TOKEN_TYPE.SIGN, char);
        return this.start;
      }
      if (BLANK_REGEX.test(char)) {
        return this.start;
      }
    }
    if (char === EOF) {
      return this.start;
    }
    throw new TokenError(char);
  }
}

const lexer = new Lexer();

export function parseTokens(input: string) {
  for (const char of input) {
    lexer.push(char);
  }
  lexer.end();
  const tokens = lexer.getTokens();
  lexer.clear();
  return tokens;
}
