const { uuidv7 } = require("uuidv7");

const pool = require("./db");
const data = require("./seed_profiles.json");

async function seed() {
    const toSeed = data.profiles.slice(0, 2026)
    for (const profile of toSeed){
  await pool.query(
    `INSERT INTO profiles (id, name, gender, gender_probability, age, age_group, country_id, country_name, country_probability)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (name) DO NOTHING`,
    [
      uuidv7(),
      profile.name,
      profile.gender,
      profile.gender_probability,
      profile.age,
      profile.age_group,
      profile.country_id,
      profile.country_name,
      profile.country_probability,
    ],
  )}
  console.log("seeding done")
  await pool.end();
}

seed()
