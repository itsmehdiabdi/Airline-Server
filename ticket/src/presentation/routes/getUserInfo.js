import db from "../../database/db.js";

// response user info (details on auth server and their tickets)
export const getUserInfo = {
  endpoint: "user",
  method: "GET",
  private: true,
  handler: async (req, res) => {
    let queryText,
      queryResult,
      info,
      values = [];
    info = {
      user: req.userinfo,
      purchases: [],
    };
    queryText = "SELECT * FROM purchase WHERE corresponding_user_id = $1";
    values.push(req.userinfo.id);
    queryResult = await db.query(queryText, values);
    info.purchases = queryResult.rows;
    res.status(200).json(info);
  },
};
