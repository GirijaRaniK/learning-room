const sql = require("./db");
const crypto = require("crypto");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed",
      });
    }

    const { name, email, password, phone } = req.body || {};

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = phone ? String(phone).trim() : null;

    if (cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid name.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    // Check whether email already exists
    const existingCustomer = await sql`
      SELECT id
      FROM customers
      WHERE email = ${cleanEmail}
      LIMIT 1
    `;

    if (existingCustomer.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Hash password using SHA-256 for this initial implementation
    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    // Create customer
    const customers = await sql`
      INSERT INTO customers (
        name,
        email,
        password_hash,
        phone
      )
      VALUES (
        ${cleanName},
        ${cleanEmail},
        ${passwordHash},
        ${cleanPhone}
      )
      RETURNING
        id,
        name,
        email,
        phone,
        created_at
    `;

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      customer: customers[0],
    });
  } catch (error) {
    console.error("Registration API error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to register. Please try again.",
    });
  }
};
