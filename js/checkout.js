document.addEventListener("DOMContentLoaded", async () => {
  const checkoutItems = document.getElementById("checkoutItems");
  const checkoutItemCount = document.getElementById("checkoutItemCount");
  const checkoutSubtotal = document.getElementById("checkoutSubtotal");
  const checkoutDelivery = document.getElementById("checkoutDelivery");
  const checkoutTotal = document.getElementById("checkoutTotal");
  const payNowBtn = document.getElementById("payNowBtn");

  // ---------------------------------------------------------
  // Load cart
  // ---------------------------------------------------------

  async function loadCheckoutCart() {
    try {
      const response = await fetch("/api/cart", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "login.html";
        return;
      }

      if (!response.ok || !data.success || !data.cart) {
        throw new Error(
          data.message || "Unable to load your cart."
        );
      }

      renderCheckout(data.cart);
    } catch (error) {
      console.error("Checkout cart error:", error);

      if (checkoutItems) {
        checkoutItems.innerHTML = `
          <div class="checkout-loading">
            <p>Unable to load your cart.</p>
            <p>${error.message || "Please try again."}</p>
          </div>
        `;
      }
    }
  }

  // ---------------------------------------------------------
  // Render checkout
  // ---------------------------------------------------------

  function renderCheckout(cart) {
    const items = cart.items || [];

    if (!checkoutItems) {
      return;
    }

    if (items.length === 0) {
      checkoutItems.innerHTML = `
        <div class="checkout-loading">
          <h3>Your cart is empty</h3>
          <p>Add some learning products before checkout.</p>
          <a href="products.html">Browse Products</a>
        </div>
      `;

      if (checkoutItemCount) {
        checkoutItemCount.textContent = "0 items";
      }

      if (checkoutSubtotal) {
        checkoutSubtotal.textContent = "₹0";
      }

      if (checkoutDelivery) {
        checkoutDelivery.textContent = "FREE";
      }

      if (checkoutTotal) {
        checkoutTotal.textContent = "₹0";
      }

      if (payNowBtn) {
        payNowBtn.disabled = true;
      }

      return;
    }

    checkoutItems.innerHTML = "";

    items.forEach((item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const itemTotal = price * quantity;

      const itemElement = document.createElement("div");

      itemElement.className = "checkout-item";

      itemElement.innerHTML = `
        <div class="checkout-item-image">
          <img
            src="${item.image || ""}"
            alt="${item.name}"
          />
        </div>

        <div class="checkout-item-info">
          <h3>${item.name}</h3>
          <p>
            ₹${price.toFixed(0)} × ${quantity}
          </p>
        </div>

        <div class="checkout-item-price">
          ₹${itemTotal.toFixed(0)}
        </div>
      `;

      checkoutItems.appendChild(itemElement);
    });

    const itemCount = Number(cart.item_count) || 0;
    const subtotal = Number(cart.subtotal) || 0;
    const delivery = Number(cart.delivery) || 0;
    const total = Number(cart.total) || 0;

    if (checkoutItemCount) {
      checkoutItemCount.textContent =
        `${itemCount} ${itemCount === 1 ? "item" : "items"}`;
    }

    if (checkoutSubtotal) {
      checkoutSubtotal.textContent =
        `₹${subtotal.toFixed(0)}`;
    }

    if (checkoutDelivery) {
      checkoutDelivery.textContent =
        delivery === 0
          ? "FREE"
          : `₹${delivery.toFixed(0)}`;
    }

    if (checkoutTotal) {
      checkoutTotal.textContent =
        `₹${total.toFixed(0)}`;
    }

    if (payNowBtn) {
      payNowBtn.disabled = false;
    }
  }

  // ---------------------------------------------------------
// Proceed to Razorpay payment
// ---------------------------------------------------------

payNowBtn?.addEventListener("click", async () => {
  try {
    payNowBtn.disabled = true;
    payNowBtn.textContent = "Preparing Payment...";

    const cartResponse = await fetch("/api/cart", {
      method: "GET",
      credentials: "include",
    });

    const cartData = await cartResponse.json();

    if (cartResponse.status === 401) {
      window.location.href = "login.html";
      return;
    }

    if (
      !cartResponse.ok ||
      !cartData.success ||
      !cartData.cart ||
      !Array.isArray(cartData.cart.items) ||
      cartData.cart.items.length === 0
    ) {
      throw new Error("Your cart is empty.");
    }

    const items = cartData.cart.items.map((item) => ({
      id: Number(item.product_id),
      quantity: Number(item.quantity),
    }));

    const paymentResponse = await fetch("/api/create-payment", {
      method: "POST",

      credentials: "include",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        items: items,
      }),
    });

   const paymentText = await paymentResponse.text();

    console.log("Create Payment HTTP Status:", paymentResponse.status);
    console.log("Create Payment Raw Response:", paymentText);

    let paymentData;

    try {
    paymentData = JSON.parse(paymentText);
    } catch (parseError) {
    throw new Error(
        `Payment server returned an invalid response. HTTP ${paymentResponse.status}: ${paymentText}`
    );
    }

    if (paymentResponse.status === 401) {
    window.location.href = "login.html";
    return;
    }

    if (!paymentResponse.ok || !paymentData.success) {
    throw new Error(
        paymentData.message || "Unable to start payment."
    );
    }

    if (paymentResponse.status === 401) {
      window.location.href = "login.html";
      return;
    }

    if (!paymentResponse.ok || !paymentData.success) {
      throw new Error(
        paymentData.message || "Unable to start payment."
      );
    }

    console.log("Razorpay order created:", paymentData);

    const options = {
        key: paymentData.key_id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: "LearningRoom",
        description: "LearningRoom Learning Products",
        order_id: paymentData.order_id,

        prefill: {
            name: paymentData.customer?.name || "",
            email: paymentData.customer?.email || "",
            contact: paymentData.customer?.phone || "",
        },

        theme: {
            color: "#2563eb",
        },

        handler: async function (response) {
        console.log("Razorpay payment response:", response);

        try {
            payNowBtn.disabled = true;
            payNowBtn.textContent = "Verifying Payment...";

            const verifyResponse = await fetch("/api/verify-payment", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
            }),
            });

            const verifyText = await verifyResponse.text();

            console.log(
            "Payment verification HTTP status:",
            verifyResponse.status
            );

            console.log(
            "Payment verification response:",
            verifyText
            );

            let verifyData;

            try {
            verifyData = JSON.parse(verifyText);
            } catch (parseError) {
            throw new Error(
                `Invalid verification response. HTTP ${verifyResponse.status}`
            );
            }

            if (!verifyResponse.ok || !verifyData.success) {
            throw new Error(
                verifyData.message ||
                "Payment verification failed."
            );
            }

            // Update navbar cart count
            window.dispatchEvent(new Event("cartUpdated"));

            alert(
            "Payment successful!\n\n" +
            "Order ID: " +
            verifyData.order_id +
            "\n" +
            "Payment ID: " +
            verifyData.payment_id
            );

            // Go to dashboard after successful payment
            window.location.href = "dashboard.html";

        } catch (error) {
            console.error(
            "Payment verification error:",
            error
            );

            alert(
            error.message ||
                "Payment was completed, but verification failed. Please contact support."
            );

            payNowBtn.disabled = false;
            payNowBtn.textContent = "Proceed to Payment";
        }
        },

        modal: {
            ondismiss: function () {
            console.log("Razorpay checkout closed.");

            payNowBtn.disabled = false;
            payNowBtn.textContent = "Proceed to Payment";
            },
        },
        };

        const razorpay = new Razorpay(options);

        razorpay.open();

            payNowBtn.disabled = false;
            payNowBtn.textContent = "Proceed to Payment";

        } catch (error) {
            console.error("Payment initialization error:", error);

            alert(
            error.message ||
                "Unable to start payment. Please try again."
            );

            payNowBtn.disabled = false;
            payNowBtn.textContent = "Proceed to Payment";
        }
    });



  // ---------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------

  await loadCheckoutCart();
});