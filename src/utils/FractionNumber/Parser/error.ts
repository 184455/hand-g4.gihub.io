export class TokenError extends Error {
  constructor(token: string) {
    super(`Unexpected token '${token}'`);
  }
}
