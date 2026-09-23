document.addEventListener("DOMContentLoaded", () => {
  const customerId = 1;

  const cartItemsContainer = document.getElementById("cartItems");

  const cartContent = document.getElementById("cartContent");

  const emptyCart = document.getElementById("emptyCart");

  const cartItemCount = document.getElementById("cartItemCount");

  const cartSubtotal = document.getElementById("cartSubtotal");

  const cartDelivery = document.getElementById("cartDelivery");

  const cartTotal = document.getElementById("cartTotal");

  const clearCartBtn = document.getElementById("clearCartBtn");

  const checkoutBtn = document.getElementById("checkoutBtn");

  // ---------------------------------------------------------
  // Load cart from database
  // ---------------------------------------------------------

  async function loadCart() {
    try {
      const response = await fetch(`/api/cart?customer_id=${customerId}`);

      if (!response.ok) {
        throw new Error(`Cart API failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.cart) {
        throw new Error(data.message || "Unable to load cart.");
      }

      renderCart(data.cart);
    } catch (error) {
      console.error("Cart loading error:", error);

      if (cartItemsContainer) {
        cartItemsContainer.innerHTML = `
          <div class="cart-error">
            <h3>Unable to load your cart</h3>
            <p>Please refresh the page and try again.</p>
          </div>
        `;
      }
    }
  }

  // ---------------------------------------------------------
  // Render cart
  // ---------------------------------------------------------

  function renderCart(cart) {
    if (!cartItemsContainer) {
      return;
    }

    const items = cart.items || [];

    // Empty cart
    if (items.length === 0) {
      if (cartContent) {
        cartContent.style.display = "none";
      }

      if (emptyCart) {
        emptyCart.style.display = "block";
      }

      return;
    }

    // Cart has products
    if (cartContent) {
      cartContent.style.display = "grid";
    }

    if (emptyCart) {
      emptyCart.style.display = "none";
    }

    cartItemsContainer.innerHTML = "";

    items.forEach((item) => {
      const itemTotal = Number(item.price) * Number(item.quantity);

      const cartItem = document.createElement("article");

      cartItem.className = "cart-item";

      cartItem.innerHTML = `
        <div class="cart-item-image">
          <img
            src="${item.image}"
            alt="${item.name}"
          />
        </div>


        <div class="cart-item-details">

          <span class="cart-item-category">
            ${item.category || "Learning"}
          </span>

          <h3>${item.name}</h3>

          <p class="cart-item-price">
            ₹${Number(item.price).toFixed(0)} each
          </p>


          <div class="cart-item-actions">

            <div class="quantity-control">

              <button
                type="button"
                class="quantity-btn decrease-btn"
                data-product-id="${item.product_id}"
                data-quantity="${item.quantity}"
              >
                −
              </button>

              <span class="quantity-value">
                ${item.quantity}
              </span>

              <button
                type="button"
                class="quantity-btn increase-btn"
                data-product-id="${item.product_id}"
                data-quantity="${item.quantity}"
              >
                +
              </button>

            </div>


            <button
              type="button"
              class="remove-item-btn"
              data-product-id="${item.product_id}"
            >
              Remove
            </button>

          </div>

        </div>


        <div class="cart-item-total">
          <strong>
            ₹${itemTotal.toFixed(0)}
          </strong>
        </div>
      `;

      cartItemsContainer.appendChild(cartItem);
    });

    // Update summary

    if (cartItemCount) {
      cartItemCount.textContent = cart.item_count || 0;
    }

    if (cartSubtotal) {
      cartSubtotal.textContent = `₹${Number(cart.subtotal).toFixed(0)}`;
    }

    if (cartDelivery) {
      cartDelivery.textContent =
        Number(cart.delivery) === 0
          ? "FREE"
          : `₹${Number(cart.delivery).toFixed(0)}`;
    }

    if (cartTotal) {
      cartTotal.textContent = `₹${Number(cart.total).toFixed(0)}`;
    }

    attachCartEvents();
  }

  // ---------------------------------------------------------
  // Quantity buttons and remove
  // ---------------------------------------------------------

  function attachCartEvents() {
    document.querySelectorAll(".increase-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const productId = Number(button.dataset.productId);

        const currentQuantity = Number(button.dataset.quantity);

        await updateQuantity(productId, currentQuantity + 1);
      });
    });

    document.querySelectorAll(".decrease-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const productId = Number(button.dataset.productId);

        const currentQuantity = Number(button.dataset.quantity);

        if (currentQuantity <= 1) {
          return;
        }

        await updateQuantity(productId, currentQuantity - 1);
      });
    });

    document.querySelectorAll(".remove-item-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const productId = Number(button.dataset.productId);

        await removeItem(productId);
      });
    });
  }

  // ---------------------------------------------------------
  // Update quantity
  // ---------------------------------------------------------

  async function updateQuantity(productId, quantity) {
    try {
      const response = await fetch("/api/cart", {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          customer_id: customerId,
          product_id: productId,
          quantity: quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update quantity.");
      }

      await loadCart();
    } catch (error) {
      console.error("Quantity update error:", error);

      alert(error.message || "Unable to update quantity.");
    }
  }

  // ---------------------------------------------------------
  // Remove product
  // ---------------------------------------------------------

  async function removeItem(productId) {
    try {
      const response = await fetch(`/api/cart?customer_id=${customerId}`, {
        method: "DELETE",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          customer_id: customerId,
          product_id: productId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to remove product.");
      }

      await loadCart();
    } catch (error) {
      console.error("Remove item error:", error);

      alert(error.message || "Unable to remove product.");
    }
  }

  // ---------------------------------------------------------
  // Clear entire cart
  // ---------------------------------------------------------

  clearCartBtn?.addEventListener("click", async () => {
    const confirmed = confirm("Are you sure you want to clear your cart?");

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/cart?customer_id=${customerId}`, {
        method: "DELETE",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          customer_id: customerId,
          clear: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to clear cart.");
      }

      await loadCart();
    } catch (error) {
      console.error("Clear cart error:", error);

      alert(error.message || "Unable to clear cart.");
    }
  });

  // ---------------------------------------------------------
  // Checkout
  // ---------------------------------------------------------

  checkoutBtn?.addEventListener("click", () => {
    alert("Checkout will be connected in the next step.");
  });

  // ---------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------

  loadCart();
});
