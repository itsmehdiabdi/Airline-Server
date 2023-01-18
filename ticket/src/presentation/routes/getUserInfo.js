// TODO: response user info (details on auth server and their tickets)
export const getUserInfo = {
  endpoint: "user",
  method: "GET",
  private: true,
  handler: async (req, res) => {
    res.status(200).json("buy ticket");
  },
};
