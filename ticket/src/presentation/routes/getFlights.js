import db from "../../database/db.js";

// get dep, des, from, to?, passengers? and give available flights in respond.
export const getFlights = {
  endpoint: "flights",
  method: "GET",
  private: false,
  handler: async (req, res) => {
    let {dep, des, from, to, passengers} = req.query;
    let queryText,
      queryResult,
      flights,
      values = [];

    queryText = `SELECT flight_id, origin, destination, aircraft, 
    departure_utc, duration, y_price, j_price, f_price,
    y_class_capacity + j_class_capacity + f_class_capacity AS capacity
    FROM aircraft INNER JOIN aircraft_layout ON 
    aircraft.layout_id = aircraft_layout.layout_id INNER JOIN flight
    ON registration = flight.aircraft
    WHERE origin = $1 AND destination = $2 AND departure_utc >= $3`;
    if (to && passengers) {
      queryText += ` AND departure_utc+duration < $4`;
      queryText += ` AND y_class_capacity + j_class_capacity + f_class_capacity >= $5`;
      values.push(dep, des, from, to, passengers);
    }
    else if (to) {
      queryText += ` AND departure_utc+duration < $4`;
      values.push(dep, des, from, to);
    }
    else if (passengers) {
      queryText += ` AND y_class_capacity + j_class_capacity + f_class_capacity >= $4`;
      values.push(dep, des, from, passengers);
    }

    queryResult = await db.query(queryText, values);
    flights = queryResult.rows;

    res.status(200).json(flights);
  },
};
