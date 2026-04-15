const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const errorMiddleware = require("./middlewares/error.middleware");
const env = require("./config/env");

const app = express();

const corsOrigin =
  env.clientOrigins === "*"
    ? true
    : (origin, cb) => {
        if (!origin) {
          cb(null, true);
          return;
        }
        const o = origin.replace(/\/$/, "");
        if (Array.isArray(env.clientOrigins) && env.clientOrigins.includes(o)) {
          cb(null, true);
          return;
        }
        cb(null, false);
      };

app.use(
  cors({
    origin: corsOrigin,
  })
);
app.use(express.json());

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorMiddleware);

module.exports = app;
