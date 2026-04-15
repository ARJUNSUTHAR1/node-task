const dotenv = require("dotenv");

dotenv.config();

const required = ["DATABASE_URL", "JWT_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const env = {
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || "*",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  userTable: process.env.USER_TABLE || "users",
  userIdColumn: process.env.USER_ID_COLUMN || "id",
  userEmailColumn: process.env.USER_EMAIL_COLUMN || "email",
  userPasswordColumn: process.env.USER_PASSWORD_COLUMN || "password",
  userNameColumn: process.env.USER_NAME_COLUMN || "",
  userRoleColumn: process.env.USER_ROLE_COLUMN || "",
  allowPlainTextPasswords:
    String(process.env.ALLOW_PLAIN_TEXT_PASSWORDS).toLowerCase() === "true",
};

module.exports = env;
