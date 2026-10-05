const sql = require("./db");

module.exports = async function handler(req, res) {
  try {
    // =========================================================
    // GET CUSTOMER FROM LOGIN SESSION
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
        message: "Please login before using the cart.",
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

    const customerId = sessions[0].customer_id;

    // =========================================================
    // GET CART
    // =========================================================

    if (req.method === "GET") {
      let carts = await sql`
        SELECT id
        FROM cart
        WHERE customer_id = ${customerId}
        LIMIT 1
      `;

      if (carts.length === 0) {
        carts = await sql`
          INSERT INTO cart (customer_id)
          VALUES (${customerId})
          RETURNING id
        `;
      }

      const cartId = carts[0].id;

      const items = await sql`
        SELECT
          ci.id,
          ci.product_id,
          ci.quantity,
          p.name,
          p.slug,
          p.category,
          p.description,
          p.price,
          p.image,
          p.stock,
          p.recommended_age
        FROM cart_items ci
        INNER JOIN products p
          ON p.id = ci.product_id
        WHERE ci.cart_id = ${cartId}
        ORDER BY ci.id
      `;

      const subtotal = items.reduce((total, item) => {
        return total + Number(item.price) * Number(item.quantity);
      }, 0);

      return res.status(200).json({
        success: true,
        cart: {
          id: cartId,
          customer_id: customerId,
          items,
          item_count: items.reduce(
            (total, item) => total + Number(item.quantity),
            0,
          ),
          subtotal,
          delivery: 0,
          total: subtotal,
        },
      });
    }

    // =========================================================
    // POST - ADD PRODUCT TO CART
    // =========================================================

    if (req.method === "POST") {
      const { product_id, quantity = 1 } = req.body || {};

      const productId = Number(product_id);
      const requestedQuantity = Number(quantity);

      if (
        !Number.isInteger(productId) ||
        productId <= 0 ||
        !Number.isInteger(requestedQuantity) ||
        requestedQuantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid product_id and quantity are required.",
        });
      }

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
        LIMIT 1
      `;

      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }

      const product = products[0];

      if (!product.active) {
        return res.status(400).json({
          success: false,
          message: "This product is not available.",
        });
      }

      if (Number(product.stock) <= 0) {
        return res.status(400).json({
          success: false,
          message: "This product is out of stock.",
        });
      }

      let carts = await sql`
        SELECT id
        FROM cart
        WHERE customer_id = ${customerId}
        LIMIT 1
      `;

      if (carts.length === 0) {
        carts = await sql`
          INSERT INTO cart (customer_id)
          VALUES (${customerId})
          RETURNING id
        `;
      }

      const cartId = carts[0].id;

      const existingItems = await sql`
        SELECT id, quantity
        FROM cart_items
        WHERE cart_id = ${cartId}
          AND product_id = ${productId}
        LIMIT 1
      `;

      let cartItem;

      if (existingItems.length > 0) {
        const newQuantity =
          Number(existingItems[0].quantity) + requestedQuantity;

        if (newQuantity > Number(product.stock)) {
          return res.status(400).json({
            success: false,
            message: `Only ${product.stock} item(s) available in stock.`,
          });
        }

        const updatedItems = await sql`
          UPDATE cart_items
          SET
            quantity = ${newQuantity},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${existingItems[0].id}
          RETURNING *
        `;

        cartItem = updatedItems[0];
      } else {
        if (requestedQuantity > Number(product.stock)) {
          return res.status(400).json({
            success: false,
            message: `Only ${product.stock} item(s) available in stock.`,
          });
        }

        const newItems = await sql`
          INSERT INTO cart_items (
            cart_id,
            product_id,
            quantity
          )
          VALUES (
            ${cartId},
            ${productId},
            ${requestedQuantity}
          )
          RETURNING *
        `;

        cartItem = newItems[0];
      }

      await sql`
        UPDATE cart
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ${cartId}
      `;

      return res.status(200).json({
        success: true,
        message: "Product added to cart.",
        cart_item: cartItem,
      });
    }

    // =========================================================
    // PUT - UPDATE QUANTITY
    // =========================================================

    if (req.method === "PUT") {
      const { product_id, quantity } = req.body || {};

      const productId = Number(product_id);
      const newQuantity = Number(quantity);

      if (
        !Number.isInteger(productId) ||
        productId <= 0 ||
        !Number.isInteger(newQuantity) ||
        newQuantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid product_id and quantity are required.",
        });
      }

      const carts = await sql`
        SELECT id
        FROM cart
        WHERE customer_id = ${customerId}
        LIMIT 1
      `;

      if (carts.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Cart not found.",
        });
      }

      const cartId = carts[0].id;

      const products = await sql`
        SELECT stock
        FROM products
        WHERE id = ${productId}
        LIMIT 1
      `;

      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }

      if (newQuantity > Number(products[0].stock)) {
        return res.status(400).json({
          success: false,
          message: `Only ${products[0].stock} item(s) available in stock.`,
        });
      }

      const updatedItems = await sql`
        UPDATE cart_items
        SET
          quantity = ${newQuantity},
          updated_at = CURRENT_TIMESTAMP
        WHERE cart_id = ${cartId}
          AND product_id = ${productId}
        RETURNING *
      `;

      if (updatedItems.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Product is not in the cart.",
        });
      }

      await sql`
        UPDATE cart
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ${cartId}
      `;

      return res.status(200).json({
        success: true,
        message: "Cart quantity updated.",
        cart_item: updatedItems[0],
      });
    }

    // =========================================================
    // DELETE
    // =========================================================

    if (req.method === "DELETE") {
      const { product_id, clear } = req.body || {};

      const carts = await sql`
        SELECT id
        FROM cart
        WHERE customer_id = ${customerId}
        LIMIT 1
      `;

      if (carts.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Cart not found.",
        });
      }

      const cartId = carts[0].id;

      // Clear entire cart
      if (clear === true) {
        await sql`
          DELETE FROM cart_items
          WHERE cart_id = ${cartId}
        `;

        await sql`
          UPDATE cart
          SET updated_at = CURRENT_TIMESTAMP
          WHERE id = ${cartId}
        `;

        return res.status(200).json({
          success: true,
          message: "Cart cleared.",
        });
      }

      // Remove one product
      const productId = Number(product_id);

      if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid product_id is required.",
        });
      }

      const deletedItems = await sql`
        DELETE FROM cart_items
        WHERE cart_id = ${cartId}
          AND product_id = ${productId}
        RETURNING *
      `;

      if (deletedItems.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Product is not in the cart.",
        });
      }

      await sql`
        UPDATE cart
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ${cartId}
      `;

      return res.status(200).json({
        success: true,
        message: "Product removed from cart.",
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  } catch (error) {
    console.error("Cart API error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process cart request.",
    });
  }
};