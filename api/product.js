const sql = require("./db");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed",
      });
    }

    const products = await sql`
      SELECT
        id,
        name,
        slug,
        category,
        description,
        price,
        image,
        stock,
        recommended_age
      FROM products
      WHERE active = true
      ORDER BY id
    `;

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Products API error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load products",
    });
  }
};
