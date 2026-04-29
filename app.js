const express = require("express");
var cors = require("cors");
require("dotenv").config();
const { uuidv7 } = require("uuidv7");

const pool = require("./db");
const profileRouter = require("./routers/profiles.route");
const authRouter = require("./routers/auth.route");

const port = 9200;
const app = express();

app.use("/api", profileRouter);
app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
  res.send("Welcome to Insighta Labs+");
});

app.listen(port, () => {
  console.log("Server listen on port", port);
});
