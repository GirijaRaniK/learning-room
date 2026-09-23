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

    // Check password
    let passwordValid = false;

    if (customer.password_hash && customer.password_hash.startsWith("$2")) {
      // bcrypt password
      passwordValid = await bcrypt.compare(password, customer.password_hash);
    } else {
      // Existing SHA-256 password
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

    // Create secure random session token
    const sessionToken = crypto.randomBytes(32).toString("hex");

    // Session expires in 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Save session in database
    await sql`
      INSERT INTO sessions (
        customer_id,
        session_token,
        expires_at
      )
      VALUES (
        ${customer.id},
        ${sessionToken},
        ${expiresAt}
      )
    `;

    // Set HttpOnly session cookie
    res.setHeader(
      "Set-Cookie",
      `learningroom_session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
    );

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
