import db from "../../database/db.js";

//no params, just respond all countries.
export const getCountries = {
  endpoint: "countries",
  method: "GET",
  private: false,
  handler: async (req, res) => {
    let queryText,
      queryResult,
      countries,
      values = [],
      response = [];
    queryText = "SELECT * FROM country ORDER BY country_name ASC";
    queryResult = await db.query(queryText, values);
    countries = queryResult.rows;
    countries.forEach((country) => {
      response.push(country.country_name);
    });

    res.status(200).json(response);
  },
};
