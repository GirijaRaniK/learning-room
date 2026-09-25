const sql = require("./db");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed",
      });
    }

    // Read session cookie
    const cookieHeader = req.headers.cookie || "";

    const cookies = {};

    cookieHeader.split(";").forEach((cookie) => {
      const [name, ...valueParts] = cookie.trim().split("=");

      if (name) {
        cookies[name] = valueParts.join("=");
      }
    });

    const sessionToken = cookies.learningroom_session;

    // No session cookie
    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Not logged in.",
      });
    }

    // Find valid session + customer
    const sessions = await sql`
      SELECT
        s.id AS session_id,
        s.customer_id,
        s.expires_at,
        c.name,
        c.email,
        c.phone
      FROM sessions s
      INNER JOIN customers c
        ON c.id = s.customer_id
      WHERE s.session_token = ${sessionToken}
        AND s.expires_at > NOW()
      LIMIT 1
    `;

    if (sessions.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Session expired or invalid.",
      });
    }

    const session = sessions[0];

    return res.status(200).json({
      success: true,
      message: "Session is valid.",
      customer: {
        id: session.customer_id,
        name: session.name,
        email: session.email,
        phone: session.phone,
      },
      session: {
        id: session.session_id,
        expiresAt: session.expires_at,
      },
    });
  } catch (error) {
    console.error("Session API error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to validate session.",
    });
  }
};
