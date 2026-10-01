const sql = require("./db");

module.exports = async function handler(req, res) {
  try {
    const result = await sql`
      SELECT
        current_database() AS database_name,
        current_schema() AS schema_name,
        EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'customers'
        ) AS customers_exists,
        EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'sessions'
        ) AS sessions_exists,
        EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'products'
        ) AS products_exists,
        EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'orders'
        ) AS orders_exists,
        EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'order_items'
        ) AS order_items_exists,
        EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'payments'
        ) AS payments_exists
    `;

    return res.status(200).json({
      success: true,
      connection: result[0]
    });
  } catch (error) {
    console.error("DB check error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};