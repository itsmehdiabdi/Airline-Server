import APIError from "../../utils/api-error.js";

export const errorHandlerMiddleware = (error, req, res, next) => {
  if (error) {
    if (error instanceof APIError) {
      return res
        .status(error.errorCode || 500)
        .json({ error: true, message: error.message });
    }
    return res
      .status(500)
      .json({ error: true, message: "Internal Server Error" });
  }
};

export const handleAsyncErrors = (expressHandler) => {
  try {
    if (expressHandler.constructor.name === "AsyncFunction") {
      return (req, res, next) => {
        expressHandler(req, res, next).catch(next);
      };
    }
  } catch {}
  if (expressHandler.constructor.name === "Function") {
    return (req, res, next) => {
      expressHandler(req, res, next);
    };
  }
  return (req, res, next) => {};
};
