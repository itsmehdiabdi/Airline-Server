import db from "../../database/db.js";
import APIError from "../../utils/api-error.js";

export const buyTicket = {
  endpoint: "ticket",
  method: "POST",
  private: true,
  handler: async (req, res) => {
    let { flight_serial, flight_class, passengers } = req.body;
    let { id, firstName, lastName } = req.userinfo;
    if (!flight_serial || !flight_class || !passengers)
      throw new APIError("undefined input");

    passengers.push({ first_name: firstName, last_name: lastName });
    const passengersCount = passengers.length;
    flight_class = getFlightClass(flight_class);
    const [flight_price, capacity, layout_id] = await getFlightInfo(
      flight_serial,
      flight_class
    );
    if (capacity < passengersCount) throw new APIError("low capacity", 410);

    const client = await db.connect();
    try {
      await client.query("BEGIN");
      for (const passenger of passengers) {
        if (!(!!passenger.first_name && !!passenger.last_name))
          throw new APIError("invalid passenger");
        const insertPurchaseQueryText = `
          INSERT INTO purchase
          (corresponding_user_id, first_name, last_name, flight_serial, offer_price, offer_class)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        const insertPurchaseQueryValues = [
          id,
          passenger.first_name,
          passenger.last_name,
          flight_serial,
          flight_price,
          flight_class,
        ];
        const insertPurchaseQueryResult = await client.query(
          insertPurchaseQueryText,
          insertPurchaseQueryValues
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    await updateCapacity(layout_id, flight_class, capacity - passengersCount);

    res.status(200).json({ success: true });
  },
};

const getFlightClass = (flightClass) => {
  flightClass = flightClass.toLowerCase();
  if (!["y", "f", "j"].includes(flightClass))
    throw new APIError("invalid flight_class");
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

const updateCapacity = async (layoutId, flightClass, newCapacity) => {
  const decreaseCapacityQueryText = `UPDATE aircraft_layout SET ${flightClass}_class_capacity=$1 WHERE layout_id=$2`;
  const decreaseCapacityQueryValues = [newCapacity, layoutId];
  await db.query(decreaseCapacityQueryText, decreaseCapacityQueryValues);
};
