const { loginUser } = require("../services/auth.service");
const { signAccessToken } = require("../utils/jwt");

const login = async (req, res) => {
  const user = await loginUser(req.body);
  const token = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(200).json({
    message: "Login successful",
    token,
    user,
  });
};

module.exports = {
  login,
};
