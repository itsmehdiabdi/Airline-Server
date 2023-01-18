// TODO: get flight_serial, flight_class and list of passengers.
export const buyTicket = {
  endpoint: "ticket",
  method: "POST",
  private: true,
  handler: async (req, res) => {
    res.status(200).json("buy ticket");
  },
};
