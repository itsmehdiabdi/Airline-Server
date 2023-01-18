// TODO: no params, just respond all countries.
export const getCountries = {
  endpoint: "countries",
  method: "GET",
  private: false,
  handler: async (req, res) => {
    res.status(200).json("get all countries");
  },
};
