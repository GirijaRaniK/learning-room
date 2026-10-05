const crypto = require("crypto");
const sql = require("./db");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
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
        message: "Please login before completing payment.",
      });
    }

    const sessions = await sql`
      SELECT
        s.customer_id,
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
        message: "Your login session has expired.",
      });
    }

    const customer = sessions[0];

    // ---------------------------------------------------------
    // Read Razorpay response
    // ---------------------------------------------------------

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Incomplete payment information.",
      });
    }

    // ---------------------------------------------------------
    // Verify Razorpay signature
    // ---------------------------------------------------------

    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        razorpay_order_id + "|" + razorpay_payment_id
      )
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error("Invalid Razorpay signature");

      return res.status(400).json({
        success: false,
        message: "Payment verification failed.",
      });
    }

    // ---------------------------------------------------------
    // Get current customer cart
    // ---------------------------------------------------------

    const carts = await sql`
      SELECT id
      FROM cart
      WHERE customer_id = ${customer.customer_id}
      LIMIT 1
    `;

    if (carts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart not found.",
      });
    }

    const cartId = carts[0].id;

    const cartItems = await sql`
      SELECT
        ci.product_id,
        ci.quantity,
        p.name,
        p.price,
        p.stock,
        p.active
      FROM cart_items ci
      INNER JOIN products p
        ON p.id = ci.product_id
      WHERE ci.cart_id = ${cartId}
    `;

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty.",
      });
    }

    // ---------------------------------------------------------
    // Recalculate total from database
    // ---------------------------------------------------------

    let totalAmount = 0;

    for (const item of cartItems) {
      if (!item.active) {
        return res.status(400).json({
          success: false,
          message: `${item.name} is no longer available.`,
        });
      }

      if (
        item.stock !== null &&
        Number(item.stock) < Number(item.quantity)
      ) {
        return res.status(400).json({
          success: false,
          message: `${item.name} does not have enough stock.`,
        });
      }

      totalAmount +=
        Number(item.price) * Number(item.quantity);
    }

    totalAmount = Math.round(totalAmount * 100) / 100;

    // ---------------------------------------------------------
    // Create local order
    // ---------------------------------------------------------

    const orders = await sql`
      INSERT INTO orders (
        customer_id,
        total_amount,
        status
      )
      VALUES (
        ${customer.customer_id},
        ${totalAmount},
        'paid'
      )
      RETURNING id
    `;

    const orderId = orders[0].id;

    // ---------------------------------------------------------
    // Create order items
    // ---------------------------------------------------------

    for (const item of cartItems) {
      await sql`
        INSERT INTO order_items (
          order_id,
          product_id,
          quantity,
          price
        )
        VALUES (
          ${orderId},
          ${item.product_id},
          ${item.quantity},
          ${item.price}
        )
      `;
    }

    // ---------------------------------------------------------
    // Save payment
    // ---------------------------------------------------------

    await sql`
      INSERT INTO payments (
        order_id,
        customer_id,
        payment_id,
        razorpay_order_id,
        amount,
        status
      )
      VALUES (
        ${orderId},
        ${customer.customer_id},
        ${razorpay_payment_id},
        ${razorpay_order_id},
        ${totalAmount},
        'paid'
      )
    `;

    // ---------------------------------------------------------
    // Clear cart
    // ---------------------------------------------------------

    await sql`
      DELETE FROM cart_items
      WHERE cart_id = ${cartId}
    `;

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      order_id: orderId,
      payment_id: razorpay_payment_id,
      amount: totalAmount,
    });

  } catch (error) {
    console.error(
      "LearningRoom Payment Verification Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment.",
    });
  }
};