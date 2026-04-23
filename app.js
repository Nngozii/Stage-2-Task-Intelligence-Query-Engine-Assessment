const express = require("express");
var cors = require("cors");
require("dotenv").config();
const { uuidv7 } = require("uuidv7");

const pool = require("./db");

const port = 9200;
const app = express();

// Get All Profiles Endpoint
app.get("/api/profiles", async (req, res) => {
  const {name, age, gender, } = req.query
  try {
    const result = await pool.query("SELECT * FROM profiles");
    const profiles = result.rows;

    if (!profiles) {
      return res.status(404).json({ status: "error", message: "Not found" });
    }

    res.status(200).json({
      status: "success",
      page: 1,
      limit: 10,
      total: 2026,
      data: profiles
    });
  } catch (err) {
    console.log(err.message);
  }
});

app.listen(port, () => {
  console.log("Server listen on port", port);
});
