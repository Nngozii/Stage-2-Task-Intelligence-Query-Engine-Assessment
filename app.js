const express = require("express");
var cors = require("cors");
require("dotenv").config();
const { uuidv7 } = require("uuidv7");

const pool = require("./db");

const port = 9200;
const app = express();

// Get All Profiles Endpoint
app.get("/api/profiles", async (req, res) => {
  const {
    gender,
    age_group,
    country_id,
    min_age,
    max_age,
    min_gender_probability,
    min_country_probability,
    sort_by,
    order,
    page = 1,
    limit = 10,
  } = req.query;

  // Sorting
  const allowedSortBy = ["age", "created_at", "gender_probability"];
  const allowedOrder = ["asc", "desc"];

  if (sort_by && !allowedSortBy.includes(sort_by)) {
    return res
      .status(400)
      .json({ status: "error", message: "Invalid query parameters" });
  }

  if (order && !allowedOrder.includes(order)) {
    return res
      .status(400)
      .json({ status: "error", message: "Invalid query parameters" });
  }

  const conditions = [];
  const params = [];
  let i = 1;

  if (gender) {
    conditions.push(`LOWER(gender) = $${i++}`);
    params.push(gender.toLowerCase());
  }
  if (age_group) {
    conditions.push(`LOWER(age_group) = $${i++}`);
    params.push(age_group.toLowerCase());
  }
  if (country_id) {
    conditions.push(`LOWER(country_id) = $${i++}`);
    params.push(country_id.toLowerCase());
  }
  if (min_age) {
    conditions.push(`age >= $${i++}`);
    params.push(parseInt(min_age));
  }
  if (max_age) {
    conditions.push(`age <= $${i++}`);
    params.push(parseInt(max_age));
  }
  if (min_gender_probability) {
    conditions.push(`gender_probability >= $${i++}`);
    params.push(parseFloat(min_gender_probability));
  }
  if (min_country_probability) {
    conditions.push(`country_probability >= $${i++}`);
    params.push(parseFloat(min_country_probability));
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortCol = allowedSortBy.includes(sort_by) ? sort_by : "created_at";
  const sortOrder = allowedOrder.includes(order) ? order.toUpperCase() : "DESC";

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM profiles ${where}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT * FROM profiles ${where} ORDER BY ${sortCol} ${sortOrder} LIMIT $${i++} OFFSET $${i++}`,
      [...params, limitNum, offset],
    );
    const profiles = result.rows;

    if (!profiles) {
      return res.status(404).json({ status: "error", message: "Not found" });
    };

    res.status(200).json({
      status: "success",
      page: pageNum,
      limit: limitNum,
      total,
      data: profiles,
    });
  } catch (err) {
    if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
      return res.status(502).json({
        status: "error",
        message: "Upstream API timed out",
      });
    } else {
      res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  }
});

app.listen(port, () => {
  console.log("Server listen on port", port);
});
