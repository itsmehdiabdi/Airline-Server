// TODO: get a country in params and returns its cities in response.
export const getCities = {
  endpoint: "cities",
  method: "GET",
  private: false,
  handler: async (req, res) => {
    res.status(200).json("get cities of a country");
  },
};
