document.addEventListener("DOMContentLoaded", async () => {
  const productsGrid = document.getElementById("productsGrid");
  const productCount = document.getElementById("productCount");
  const noProducts = document.getElementById("noProducts");
  const filterButtons = document.querySelectorAll(".filter-btn");

  let allProducts = [];

  async function loadProducts() {
    try {
      const response = await fetch("/api/products");

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !Array.isArray(data.products)) {
        throw new Error("Invalid products API response");
      }

      allProducts = data.products;

      renderProducts(allProducts);
    } catch (error) {
      console.error("Products loading error:", error);

      if (productsGrid) {
        productsGrid.innerHTML = `
          <div class="products-error">
            <p>Unable to load products.</p>
            <button type="button" onclick="location.reload()">
              Try Again
            </button>
          </div>
        `;
      }

      if (productCount) {
        productCount.textContent = "0";
      }

      if (noProducts) {
        noProducts.style.display = "none";
      }
    }
  }

  function renderProducts(products) {
    if (!productsGrid) return;

    productsGrid.innerHTML = "";

    if (productCount) {
      productCount.textContent = products.length;
    }

    if (products.length === 0) {
      if (noProducts) {
        noProducts.style.display = "block";
      }
      return;
    }

    if (noProducts) {
      noProducts.style.display = "none";
    }

    products.forEach((product) => {
      const card = document.createElement("article");

      card.className = "product-card";
      card.dataset.category = product.category || "";

      const price = Number(product.price || 0).toFixed(0);

      card.innerHTML = `
        <div class="product-image-wrap">
          <img
            src="${product.image}"
            alt="${product.name}"
            class="product-image"
          />
        </div>

        <div class="product-info">
          <span class="product-category">
            ${product.category || "Learning"}
          </span>

          <h3>${product.name}</h3>

          <p>
            ${product.description || ""}
          </p>

          <div class="product-bottom">
            <span class="product-price">₹${price}</span>

            <button
              type="button"
              class="add-cart-btn"
              data-name="${product.name}"
              data-price="${price}"
            >
              Add to Cart
            </button>
          </div>

          <a
            href="product-details.html?slug=${encodeURIComponent(product.slug)}"
            class="view-product"
          >
            View Product
          </a>
        </div>
      `;

      productsGrid.appendChild(card);

      const addButton = card.querySelector(".add-cart-btn");

      addButton?.addEventListener("click", () => {
        if (typeof window.addToCart === "function") {
          window.addToCart(product.name, Number(product.price));
        } else {
          console.error("addToCart function is not available.");
        }
      });
    });
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");

      const category = button.dataset.category;

      if (!category || category === "all") {
        renderProducts(allProducts);
        return;
      }

      const filteredProducts = allProducts.filter(
        (product) => product.category === category,
      );

      renderProducts(filteredProducts);
    });
  });

  await loadProducts();
});
