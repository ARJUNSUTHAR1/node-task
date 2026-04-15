const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const env = require("../config/env");
const ApiError = require("../utils/apiError");

const comparePassword = async (plainPassword, storedPassword) => {
  if (!storedPassword) {
    return false;
  }

  const looksHashed =
    storedPassword.startsWith("$2a$") ||
    storedPassword.startsWith("$2b$") ||
    storedPassword.startsWith("$2y$");

  if (looksHashed) {
    return bcrypt.compare(plainPassword, storedPassword);
  }

  if (env.allowPlainTextPasswords) {
    return plainPassword === storedPassword;
  }

  return false;
};

const loginUser = async ({ email, password }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "");

  if (!normalizedEmail || !normalizedPassword) {
    throw new ApiError(400, "Email and password are required");
  }

  const result = await pool.query(
    `
      SELECT
        id::text AS "id",
        email::text AS "email",
        password::text AS "password",
        name::text AS "name",
        role::text AS "role"
      FROM users
      WHERE LOWER(email::text) = LOWER($1)
      LIMIT 1
    `,
    [normalizedEmail]
  );
  const user = result.rows[0];

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await comparePassword(
    normalizedPassword,
    user.password
  );

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || "user",
  };
};

module.exports = {
  loginUser,
};
