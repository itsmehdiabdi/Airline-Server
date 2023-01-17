export const buyTicket = {
  endpoint: "tickets/buy",
  method: "POST",
  private: false,
  handler: async (req, res) => {
    res.status(200).json("buy ticket");
  },
};
