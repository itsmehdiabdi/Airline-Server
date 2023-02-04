import db from "../../database/db.js";
import APIError from "../../utils/api-error.js";

// get dep, des, from, to?, passengers? and give available flights in respond.
export const getFlights = {
  endpoint: "flights",
  method: "GET",
  private: false,
  handler: async (req, res) => {
    let {dep, des, from, to, passengers} = req.query;
    let queryText,
      queryResult,
      flights1, flights2,
      values = [];

    if (!dep || !des || !from) {
      throw new APIError("parameters \'start city (dep)\', \'destination (des)\' and \'begining time (from)\' are neede!");
    }

    if (! from.match("20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]$")) {
      throw new APIError("parameter \'begining time (from)\' should be a date like \'2023-01-01\'");
    }

    if (to && ! to.match("20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]$")) {
      throw new APIError("parameter \'ending time (to)\' should be a date like \'2023-01-01\'");
    }

    if (passengers && isNaN(Number(passengers))) {
      throw new APIError("the parameter \'passengers\' should be a number!");
    }

    if (to && to <= from) {
      throw new APIError("the \'to\' time should be greater than the \'from\' time!");
    }

    if (passengers && passengers <= 0) {
      throw new APIError("the \'passengers\' parameter cannot be less than 1!");
    }

    queryText = `SELECT flight_id, origin, destination, aircraft, 
    departure_utc, duration, y_price, j_price, f_price,
    y_class_capacity + j_class_capacity + f_class_capacity AS capacity
    FROM aircraft INNER JOIN aircraft_layout ON 
    aircraft.layout_id = aircraft_layout.layout_id INNER JOIN flight
    ON registration = flight.aircraft
    WHERE origin = $1 AND destination = $2 AND date(departure_utc) = $3`;
    values.push(dep, des, from);
   
     if (passengers) {
      queryText += ` AND y_class_capacity + j_class_capacity + f_class_capacity >= $4`;
      values.push(passengers);
    }

    queryResult = await db.query(queryText, values);
    flights1 = queryResult.rows;


    if (to) {
      queryText = `SELECT flight_id, origin, destination, aircraft, 
    departure_utc, duration, y_price, j_price, f_price,
    y_class_capacity + j_class_capacity + f_class_capacity AS capacity
    FROM aircraft INNER JOIN aircraft_layout ON 
    aircraft.layout_id = aircraft_layout.layout_id INNER JOIN flight
    ON registration = flight.aircraft
    WHERE origin = $1 AND destination = $2 AND date(departure_utc) = $3`;
    values = [];
    values.push(des, dep, to);
    

    if (passengers) {
      queryText += ` AND y_class_capacity + j_class_capacity + f_class_capacity >= $4`;
      values.push(passengers);
    }

    queryResult = await db.query(queryText, values);
    flights2 = queryResult.rows;
    res.status(200).json({outband: flights1, return: flights2});
  } else {
    res.status(200).json({outband: flights1});
  }
  },
};
