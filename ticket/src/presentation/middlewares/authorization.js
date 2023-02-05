import axios from "axios";
import envVars from "../../utils/env.js";
import APIError from "../../utils/api-error.js";

export const authorizationMiddleware = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) throw new APIError("unauthorized", 401);
  const token = authorization.replace("Bearer ", "");
  let result;
  try {
    result = await axios.get(`${envVars.AUTH_URL}/user`, {
      headers: {
        Authorization: token,
      },
    });
  } catch (e) {
    throw new APIError("unauthorized", 401);
  }

  req.userinfo = result.data.user;

  next();
};
