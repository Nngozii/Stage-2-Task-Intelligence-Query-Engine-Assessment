const express = require("express");
require("dotenv").config();
const { uuidv7 } = require("uuidv7");

const pool = require("../db");

const router = express.Router();

// Get All Profiles Endpoint
router.get("/profiles", async (req, res) => {
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
    }

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

// /api/profiles/search
router.get("/profiles/search", async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  if (!q || q.trim() === "") {
    return res
      .status(400)
      .json({ status: "error", message: "Missing or empty query" });
  }

  const query = q.toLowerCase();
  const filters = {};

  // Gender
  if (/\bmales?\b/.test(query) && !/\bfemales?\b/.test(query))
    filters.gender = "male";
  if (/\bfemales?\b/.test(query) && !/\bmales?\b/.test(query))
    filters.gender = "female";

  // Age groups
  if (/\bchildren\b|\bchild\b/.test(query)) filters.age_group = "child";
  else if (/\bteenagers?\b/.test(query)) filters.age_group = "teenager";
  else if (/\badults?\b/.test(query)) filters.age_group = "adult";
  else if (/\bseniors?\b/.test(query)) filters.age_group = "senior";
  else if (/\byoung\b/.test(query)) {
    filters.min_age = 16;
    filters.max_age = 24;
  }

  // Age comparisons
  const aboveMatch = query.match(/above\s+(\d+)/);
  const belowMatch = query.match(/below\s+(\d+)/);
  const olderMatch = query.match(/older\s+than\s+(\d+)/);
  const youngerMatch = query.match(/younger\s+than\s+(\d+)/);
  const betweenMatch = query.match(/between\s+(\d+)\s+and\s+(\d+)/);

  if (aboveMatch) filters.min_age = parseInt(aboveMatch[1]);
  if (belowMatch) filters.max_age = parseInt(belowMatch[1]);
  if (olderMatch) filters.min_age = parseInt(olderMatch[1]);
  if (youngerMatch) filters.max_age = parseInt(youngerMatch[1]);
  if (betweenMatch) {
    filters.min_age = parseInt(betweenMatch[1]);
    filters.max_age = parseInt(betweenMatch[2]);
  }

  // Country mapping
  const countryMap = {
    nigeria: "NG",
    ghana: "GH",
    kenya: "KE",
    angola: "AO",
    tanzania: "TZ",
    ethiopia: "ET",
    uganda: "UG",
    senegal: "SN",
    cameroon: "CM",
    zimbabwe: "ZW",
    zambia: "ZM",
    mali: "ML",
    niger: "NE",
    chad: "TD",
    sudan: "SD",
    somalia: "SO",
    rwanda: "RW",
    benin: "BJ",
    togo: "TG",
    guinea: "GN",
    mozambique: "MZ",
    madagascar: "MG",
    "ivory coast": "CI",
    "south africa": "ZA",
    egypt: "EG",
    morocco: "MA",
    algeria: "DZ",
    tunisia: "TN",
    libya: "LY",
    congo: "CG",
    drc: "CD",
    "burkina faso": "BF",
    malawi: "MW",
    namibia: "NA",
    botswana: "BW",
    usa: "US",
    "united states": "US",
    uk: "GB",
    "united kingdom": "GB",
    france: "FR",
    germany: "DE",
    india: "IN",
    china: "CN",
    brazil: "BR",
    canada: "CA",
    australia: "AU",
    japan: "JP",
  };

  const fromMatch = query.match(
    /from\s+([a-z\s]+?)(?:\s+(?:above|below|older|younger|between|who|aged|$))/,
  );
  const fromEnd = query.match(/from\s+([a-z\s]+)$/);
  const countryQuery = (fromMatch?.[1] || fromEnd?.[1] || "").trim();

  if (countryQuery) {
    const mapped = countryMap[countryQuery];
    if (mapped) filters.country_id = mapped;
  }

  // If no filters were parsed at all, query is uninterpretable
  if (Object.keys(filters).length === 0) {
    return res
      .status(200)
      .json({ status: "error", message: "Unable to interpret query" });
  }

  // Build SQL
  const conditions = [];
  const params = [];
  let i = 1;

  if (filters.gender) {
    conditions.push(`gender = $${i++}`);
    params.push(filters.gender);
  }
  if (filters.age_group) {
    conditions.push(`age_group = $${i++}`);
    params.push(filters.age_group);
  }
  if (filters.country_id) {
    conditions.push(`country_id = $${i++}`);
    params.push(filters.country_id);
  }
  if (filters.min_age !== undefined) {
    conditions.push(`age >= $${i++}`);
    params.push(filters.min_age);
  }
  if (filters.max_age !== undefined) {
    conditions.push(`age <= $${i++}`);
    params.push(filters.max_age);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM profiles ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count);

  const dataResult = await pool.query(
    `SELECT * FROM profiles ${where} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,
    [...params, limitNum, offset],
  );

  return res.status(200).json({
    status: "success",
    page: pageNum,
    limit: limitNum,
    total,
    data: dataResult.rows,
  });
});

module.exports = router;
