const sql = require("./db");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed",
      });
    }

    const { slug } = req.query;

    // --------------------------------------------------
    // Get a single product by slug
    // Example:
    // /api/products?slug=creative-story-builder
    // --------------------------------------------------
    if (slug) {
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
          recommended_age,
          active
        FROM products
        WHERE slug = ${slug}
          AND active = true
        LIMIT 1
      `;

      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      return res.status(200).json({
        success: true,
        product: products[0],
      });
    }

    // --------------------------------------------------
    // Get all active products
    // Example:
    // /api/products
    // --------------------------------------------------
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
