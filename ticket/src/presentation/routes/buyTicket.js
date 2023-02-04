import axios from "axios";
import db from "../../database/db.js";
import APIError from "../../utils/api-error.js";
import envVars from "../../utils/env.js";

export const buyTicket = {
  endpoint: "ticket",
  method: "POST",
  private: true,
  handler: async (req, res) => {
    let { flight_serial, flight_class, passengers, transaction_id } = req.body;
    let { id, firstName, lastName } = req.userinfo;
    if (!flight_serial || !flight_class || !passengers)
      throw new APIError("undefined input", 400);

    passengers.push({
      first_name: firstName,
      last_name: lastName,
      title: req.userinfo.male ? "mr" : "ms",
    });
    const passengersCount = passengers.length;
    flight_class = getFlightClass(flight_class);
    const [flight_price, capacity, layout_id] = await getFlightInfo(
      flight_serial,
      flight_class
    );
    await validateTransactionId(transaction_id);
    if (capacity < passengersCount) throw new APIError("low capacity", 410);

    const client = await db.connect();
    try {
      await client.query("BEGIN");
      for (const passenger of passengers) {
        if (
          !(
            !!passenger.first_name &&
            !!passenger.last_name &&
            !!passenger.title
          )
        )
          throw new APIError("invalid passenger", 400);

        const title = passenger.title.toLowerCase();
        if (!["mr", "ms"].includes(title))
          throw new APIError("invalid passenger", 400);
        const insertPurchaseQueryText = `
          INSERT INTO purchase
          (corresponding_user_id, first_name, last_name, flight_serial, offer_price, offer_class, transaction_id, title)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        const insertPurchaseQueryValues = [
          id,
          passenger.first_name,
          passenger.last_name,
          flight_serial,
          flight_price,
          flight_class,
          transaction_id,
          title,
        ];
        const insertPurchaseQueryResult = await client.query(
          insertPurchaseQueryText,
          insertPurchaseQueryValues
        );
      }
      await updateCapacity(layout_id, flight_class, capacity - passengersCount);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    res.status(200).json({ success: true });
  },
};

const getFlightClass = (flightClass) => {
  flightClass = flightClass.toLowerCase();
  if (!["y", "f", "j"].includes(flightClass))
    throw new APIError("invalid flight_class", 400);
  return flightClass;
};

const getFlightInfo = async (flightSerial, flightClass) => {
  if (!+flightSerial) throw new APIError("invalid flight serial", 400);
  const getFlightPriceQueryText = `
      SELECT ${flightClass}_price, ${flightClass}_class_capacity, aircraft.layout_id
      FROM flight
      JOIN aircraft ON flight.aircraft=aircraft.registration
      JOIN aircraft_layout ON aircraft.layout_id=aircraft_layout.layout_id
      WHERE flight_serial=$1
    `;
  const getFlightPriceValues = [flightSerial];
  const getFlightPriceResult = await db.query(
    getFlightPriceQueryText,
    getFlightPriceValues
  );
  const result = Object.values(getFlightPriceResult.rows[0]);
  if (result.length === 0) throw new APIError("flight not found", 400);
  return result;
};

const validateTransactionId = async (transaction_id) => {
  if (!+transaction_id) throw new APIError("invalid transaction id", 400);

  const countOfTransactionUse = (
    await db.query("SELECT COUNT(*) FROM purchase WHERE transaction_id=$1", [
      transaction_id,
    ])
  ).rows[0].count;
  if (countOfTransactionUse > 0)
    throw new APIError("invalid transaction id", 400);

  let result;
  try {
    result = await axios.get(`${envVars.BANK_URL}/payment/${transaction_id}`);
  } catch (error) {
    throw new APIError("invalid transaction id", 400);
  }
  if (result.status != 200) throw new APIError("invalid transaction id", 400);
};

const updateCapacity = async (layoutId, flightClass, newCapacity) => {
  const decreaseCapacityQueryText = `UPDATE aircraft_layout SET ${flightClass}_class_capacity=$1 WHERE layout_id=$2`;
  const decreaseCapacityQueryValues = [newCapacity, layoutId];
  await db.query(decreaseCapacityQueryText, decreaseCapacityQueryValues);
};
