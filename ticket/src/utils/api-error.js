export default class APIError extends Error {
  constructor(message, errorCode = 500) {
    super(message);
    this.errorCode = errorCode;
  }
}
