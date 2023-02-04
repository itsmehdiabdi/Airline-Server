import db from "../../database/db.js";
import APIError from "../../utils/api-error.js";
// DONE: get a country in params and returns its cities in response.

export const getCities = {
  endpoint: "cities",
  method: "GET",
  private: false,
  handler: async (req, res) => {
    let { country } = req.query;
    let queryText,
      queryResult,
      cities,
      values = [],
      response = [];

    if (!country) {
      throw new APIError("you should specify country", 400);
    }

    queryText = "SELECT city_name FROM city WHERE country_name=$1";
    values.push(country);

    queryResult = await db.query(queryText, values);
    cities = queryResult.rows;
    cities.forEach((city) => {
      response.push(city.city_name);
    });

    res.status(200).json(cities);
  },
};
