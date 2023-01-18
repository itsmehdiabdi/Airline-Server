// TODO: get a city in params and returns its airports in response.
export const getAirports = {
  endpoint: "airports",
  method: "GET",
  private: false,
  handler: async (req, res) => {
    res.status(200).json("get airports of a city");
  },
};
