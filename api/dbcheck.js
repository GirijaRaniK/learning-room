const sql = require("./db");

module.exports = async function handler(req, res) {
  try {
    const result = await sql`
      SELECT
        current_database() AS database_name,
        current_schema() AS schema_name
    `;

    return res.status(200).json({
      success: true,
      connection: result[0]
    });
  } catch (error) {
    console.error("LearningRoom DB check error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};