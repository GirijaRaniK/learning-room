const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.LEARNINGROOM_URL_DATABASE_URL);

module.exports = sql;
