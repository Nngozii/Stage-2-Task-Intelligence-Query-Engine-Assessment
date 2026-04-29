// This is a sign up with github functionality - documentation at https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps

const express = require("express");
require("dotenv").config();
const { uuidv7 } = require("uuidv7");

const pool = require("../db");

const router = express.Router();

// Defining the query parameters to be passed in the github oauth endpoints.
const clientID = process.env.CLIENT_ID;
const redirectURI = "http://localhost:9200/api/auth/github/callback"; // my callback url (second endpoint)

// state is used to prevent csrf attack
const stateStore = new Map();
const crypto = require("crypto");
function generateState() {
  const state = crypto.randomBytes(16).toString("hex");
  return state;
}

//code_challenge is used to secure the authentication flow with PKCE
function generatePKCE() {
  const code_verifier = crypto.randomBytes(32).toString("hex");
  const code_challenge = crypto
    .createHash("sha256")
    .update(code_verifier)
    .digest("base64url");
  return { code_verifier, code_challenge };
}

// Github OAuth
router.get("/github", async (req, res) => {
  const state = generateState(); // calling the generateState function
  const { code_verifier, code_challenge } = generatePKCE(); // calling generatePKCE function

  stateStore.set(state, { code_verifier }); // store them in memory
try{
  await res.redirect(
    `https://github.com/login/oauth/authorize?client_id=${clientID}&redirect_uri=${redirectURI}$state=${state}&code_challenge=${code_challenge}&code_challenge_method=S256`,
  );
  console.log("redirected")
}catch(err){
    console.error(err.message)
}
});

router.get("/github/callback", async (req, res) => {

});

router.get("/refresh", async (req, res) => {});

module.exports = router;
