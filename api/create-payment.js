const Razorpay = require("razorpay");
const sql = require("./db");

module.exports = async function handler(req, res) {
  try {
    // =========================================================
    // ONLY POST
    // =========================================================

    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed",
      });
    }

    // =========================================================
    // CHECK RAZORPAY CONFIGURATION
    // =========================================================

    if (
      !process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      console.error("Razorpay environment variables are missing");

      return res.status(500).json({
        success: false,
        message: "Razorpay configuration is missing.",
      });
    }

    // =========================================================
    // GET SESSION COOKIE
    // =========================================================

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
        message: "Please login before making a payment.",
      });
    }

    // =========================================================
    // VALIDATE SESSION
    // =========================================================

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
        message: "Your login session has expired. Please login again.",
      });
    }

    const customer = sessions[0];

    // =========================================================
    // READ CART
    // =========================================================

    const { items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty.",
      });
    }

    // =========================================================
    // VALIDATE CART ITEMS
    // =========================================================

    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const productId = Number(item.id);
      const quantity = Number(item.quantity);

      if (
        !Number.isInteger(productId) ||
        productId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product.",
        });
      }

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        quantity > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product quantity.",
        });
      }

      // =======================================================
      // GET ACTUAL PRODUCT FROM DATABASE
      // =======================================================

      const products = await sql`
        SELECT
          id,
          name,
          price,
          image,
          stock,
          active
        FROM products
        WHERE id = ${productId}
          AND active = true
        LIMIT 1
      `;

      if (products.length === 0) {
        return res.status(400).json({
          success: false,
          message: "One of the products is no longer available.",
        });
      }

      const product = products[0];

      // =======================================================
      // STOCK CHECK
      // =======================================================

      if (
        product.stock !== null &&
        Number(product.stock) < quantity
      ) {
        return res.status(400).json({
          success: false,
          message:
            `${product.name} does not have enough stock.`,
        });
      }

      const price = Number(product.price);

      if (!Number.isFinite(price) || price <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid price for ${product.name}.`,
        });
      }

      const subtotal =
        Math.round(price * quantity * 100) / 100;

      calculatedTotal += subtotal;

      validatedItems.push({
        id: product.id,
        name: product.name,
        price: price,
        quantity: quantity,
        image: product.image || null,
        subtotal: subtotal,
      });
    }

    // =========================================================
    // ROUND TOTAL
    // =========================================================

    calculatedTotal =
      Math.round(calculatedTotal * 100) / 100;

    if (
      !Number.isFinite(calculatedTotal) ||
      calculatedTotal <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart amount.",
      });
    }

    // =========================================================
    // CREATE RAZORPAY INSTANCE
    // =========================================================

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // =========================================================
    // CREATE RAZORPAY ORDER
    // =========================================================

    const receipt =
      "LR_" +
      Date.now() +
      "_" +
      customer.customer_id;

    const razorpayOrder =
      await razorpay.orders.create({
        amount: Math.round(calculatedTotal * 100),
        currency: "INR",
        receipt: receipt,
      });

    // =========================================================
    // SUCCESS
    // =========================================================

    return res.status(200).json({
      success: true,
      key_id: process.env.RAZORPAY_KEY_ID,
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,

      customer: {
        id: customer.customer_id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },

      items: validatedItems,
    });

  } catch (error) {
    console.error(
      "LearningRoom Create Payment Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to create Razorpay order.",
    });
  }
};