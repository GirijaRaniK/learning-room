const sql = require("./db");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed",
      });
    }

    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Find customer
    const customers = await sql`
      SELECT
        id,
        name,
        email,
        password_hash,
        phone
      FROM customers
      WHERE email = ${cleanEmail}
      LIMIT 1
    `;

    if (customers.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const customer = customers[0];

    let passwordValid = false;

    /*
     * New bcrypt password
     */
    if (customer.password_hash && customer.password_hash.startsWith("$2")) {
      passwordValid = await bcrypt.compare(password, customer.password_hash);
    } else {
      /*
       * Existing SHA-256 password
       * Used only for customers created before bcrypt.
       */
      const sha256Password = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");

      passwordValid = sha256Password === customer.password_hash;
    }

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    console.error("Login API error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login. Please try again.",
    });
  }
};
