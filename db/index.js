const { Client } = require("pg");
require("dotenv").config();
const DATABASE_URL = process.env.DATABASE_URL;

const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

client.connect();

module.exports = client;