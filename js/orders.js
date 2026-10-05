document.addEventListener("DOMContentLoaded", async () => {
  const ordersLoading = document.getElementById("ordersLoading");
  const ordersEmpty = document.getElementById("ordersEmpty");
  const ordersList = document.getElementById("ordersList");

  try {
    const response = await fetch("/api/orders", {
      method: "GET",
      credentials: "include",
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error(
        `Invalid server response. HTTP ${response.status}`
      );
    }

    if (response.status === 401) {
      window.location.href = "login.html";
      return;
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Unable to load orders."
      );
    }

    ordersLoading.style.display = "none";

    if (!Array.isArray(data.orders) || data.orders.length === 0) {
      ordersEmpty.style.display = "block";
      return;
    }

    ordersList.style.display = "grid";

    ordersList.innerHTML = data.orders
      .map((order) => {
        const orderDate = new Date(order.created_at);

        const formattedDate = orderDate.toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        });

        const itemsHtml = order.items
          .map((item) => {
            const itemTotal =
              Number(item.price) * Number(item.quantity);

            return `
              <div class="order-item">

                <div class="order-item-image">
                  <img
                    src="${item.image || ""}"
                    alt="${item.name}"
                  />
                </div>

                <div class="order-item-info">
                  <h3>${item.name}</h3>
                  <p>
                    ₹${Number(item.price).toFixed(0)}
                    × ${item.quantity}
                  </p>
                </div>

                <div class="order-item-total">
                  ₹${itemTotal.toFixed(0)}
                </div>

              </div>
            `;
          })
          .join("");

        return `
          <article class="order-card">

            <div class="order-header">

              <div>
                <div class="order-number">
                  Order #${order.id}
                </div>

                <div class="order-date">
                  ${formattedDate}
                </div>
              </div>

              <div class="order-status">
                ${order.status || "paid"}
              </div>

            </div>

            <div class="order-items">
              ${itemsHtml}
            </div>

            <div class="order-footer">

              <div class="order-total-label">
                Total Amount
              </div>

              <div class="order-total">
                ₹${Number(order.total_amount).toFixed(0)}
              </div>

            </div>

            ${
              order.payment_id
                ? `
                  <div class="payment-info">
                    Payment ID: ${order.payment_id}
                  </div>
                `
                : ""
            }

          </article>
        `;
      })
      .join("");

  } catch (error) {
    console.error("Orders page error:", error);

    ordersLoading.style.display = "none";

    ordersList.style.display = "block";

    ordersList.innerHTML = `
      <div class="orders-message">
        <h2>Unable to load orders</h2>
        <p>${error.message}</p>
      </div>
    `;
  }
});