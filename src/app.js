const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const errorMiddleware = require("./middlewares/error.middleware");
const env = require("./config/env");

const app = express();

app.use(
  cors({
    origin: env.clientUrl === "*" ? true : env.clientUrl,
  })
);
app.use(express.json());

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorMiddleware);

module.exports = app;
