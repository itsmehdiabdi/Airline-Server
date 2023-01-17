export const getFlights = {
  endpoint: "flights",
  method: "GET",
  private: false,
  handler: async (req, res) => {
    res.status(200).json("get all flights");
  },
};
