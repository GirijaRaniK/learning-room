const sql = require("./db");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed",
      });
    }

    // Read cookies
    const cookieHeader = req.headers.cookie || "";

    const cookies = {};

    cookieHeader.split(";").forEach((cookie) => {
      const [name, ...valueParts] = cookie.trim().split("=");

      if (name) {
        cookies[name] = valueParts.join("=");
      }
    });

    const sessionToken = cookies.learningroom_session;

    // If there is no session cookie, still clear the cookie
    if (!sessionToken) {
      res.setHeader(
        "Set-Cookie",
        "learningroom_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
      );

      return res.status(200).json({
        success: true,
        message: "Logged out successfully.",
      });
    }

    // Delete the session from Neon
    await sql`
      DELETE FROM sessions
      WHERE session_token = ${sessionToken}
    `;

    // Clear the browser cookie
    res.setHeader(
      "Set-Cookie",
      "learningroom_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
    );

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout API error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to logout. Please try again.",
    });
  }
};