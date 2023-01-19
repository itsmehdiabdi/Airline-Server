import db from "../../database/db.js";
import APIError from "../../utils/api-error.js";
import xor from "../../utils/xor.js";

export const getAirports = {
  endpoint: "airports",
  method: "GET",
  private: false,
  handler: async (req, res) => {
    let { city, country } = req.query;
    let queryText,
      queryResult,
      airports,
      values = [];

    if (!xor(city, country))
      throw new APIError("you should specify city, or country", 400);

    queryText = "SELECT * FROM airport WHERE";
    if (country) {
      queryText += " country_name=$1";
      values.push(country);
    }
    if (city) {
      queryText += " city_name=$1";
      values.push(city);
    }

    queryResult = await db.query(queryText, values);
    airports = queryResult.rows;

    res.status(200).json(airports);
  },
};
