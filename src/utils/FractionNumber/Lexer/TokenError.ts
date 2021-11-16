import { CHAR } from './interface';

class TokenError extends Error {
  constructor(token: CHAR) {
    super(`Unexpected token '${token}'`);
  }
}

export default TokenError;
