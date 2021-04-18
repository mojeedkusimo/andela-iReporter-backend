require("dotenv").config();

const node_geocoder = require("node-geocoder");

const options = {
    provider: "google",
    apiKey: process.env.GOOGLE_MAP_API_KEY
}

const geocoder = node_geocoder(options);

module.exports = geocoder;
