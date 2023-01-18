// TODO: get dep, des, from, to?, passengers? and give available flights in respond.
export const getFlights = {
  endpoint: "flights",
  method: "GET",
  private: false,
  handler: async (req, res) => {
    res.status(200).json("get all flights");
  },
};
