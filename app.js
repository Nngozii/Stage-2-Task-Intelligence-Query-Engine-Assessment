const express = require("express");
var cors = require("cors");
require("dotenv").config();
const { uuidv7 } = require("uuidv7");

const pool = require("./db");

const port = 9200;
const app = express();



app.listen(port, () => {
  console.log("Server listen on port", port);
});
