const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.LEARNING_DB_URL);

module.exports = sql;
