const sql = require("./db");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed",
      });
    }

    // ---------------------------------------------------------
    // Get logged-in customer from session
    // ---------------------------------------------------------

    const cookieHeader = req.headers.cookie || "";

    const cookies = {};

    cookieHeader.split(";").forEach((cookie) => {
      const [name, ...valueParts] = cookie.trim().split("=");

      if (name) {
        cookies[name] = valueParts.join("=");
      }
    });

    const sessionToken = cookies.learningroom_session;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Please login to view your orders.",
      });
    }

    const sessions = await sql`
      SELECT customer_id
      FROM sessions
      WHERE session_token = ${sessionToken}
        AND expires_at > NOW()
      LIMIT 1
    `;

    if (sessions.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Your login session has expired.",
      });
    }

    const customerId = sessions[0].customer_id;

    // ---------------------------------------------------------
    // Get customer's orders
    // ---------------------------------------------------------

    const orders = await sql`
      SELECT
        o.id,
        o.total_amount,
        o.status,
        o.created_at,
        p.payment_id,
        p.razorpay_order_id,
        p.status AS payment_status
      FROM orders o
      LEFT JOIN payments p
        ON p.order_id = o.id
      WHERE o.customer_id = ${customerId}
      ORDER BY o.created_at DESC
    `;

    // ---------------------------------------------------------
    // Get order items
    // ---------------------------------------------------------

    const orderIds = orders.map((order) => order.id);

    let items = [];

    if (orderIds.length > 0) {
      items = await sql`
        SELECT
          oi.order_id,
          oi.product_id,
          oi.quantity,
          oi.price,
          pr.name,
          pr.image
        FROM order_items oi
        INNER JOIN products pr
          ON pr.id = oi.product_id
        WHERE oi.order_id = ANY(${orderIds})
        ORDER BY oi.id ASC
      `;
    }

    // ---------------------------------------------------------
    // Attach items to orders
    // ---------------------------------------------------------

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      total_amount: Number(order.total_amount),
      status: order.status,
      created_at: order.created_at,
      payment_id: order.payment_id,
      razorpay_order_id: order.razorpay_order_id,
      payment_status: order.payment_status,
      items: items
        .filter((item) => item.order_id === order.id)
        .map((item) => ({
          product_id: item.product_id,
          name: item.name,
          image: item.image,
          quantity: Number(item.quantity),
          price: Number(item.price),
        })),
    }));

    return res.status(200).json({
      success: true,
      orders: formattedOrders,
    });

  } catch (error) {
    console.error("LearningRoom Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load orders.",
    });
  }
};