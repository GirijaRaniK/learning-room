document.addEventListener("DOMContentLoaded", async () => {
  const mainImage = document.getElementById("mainProductImage");
  const thumbs = document.querySelectorAll(".gallery-thumb");
  const qtyValue = document.getElementById("quantityValue");
  const qtyMinus = document.getElementById("qtyMinus");
  const qtyPlus = document.getElementById("qtyPlus");
  const mainAddCart = document.getElementById("mainAddCart");

  let quantity = 1;
  let currentProduct = null;

  // --------------------------------------------------
  // Read product slug from URL
  // Example:
  // product-details.html?slug=creative-story-builder
  // --------------------------------------------------
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  // --------------------------------------------------
  // Load product from API
  // --------------------------------------------------
  async function loadProduct() {
    if (!slug) {
      console.error("Product slug is missing from URL.");
      return;
    }

    try {
      const response = await fetch(
        `/api/products?slug=${encodeURIComponent(slug)}`,
      );

      if (!response.ok) {
        throw new Error(`Product API failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.product) {
        throw new Error("Product not found.");
      }

      currentProduct = data.product;

      updateProductPage(currentProduct);
    } catch (error) {
      console.error("Product loading error:", error);
    }
  }

  // --------------------------------------------------
  // Update product information on page
  // --------------------------------------------------
  function updateProductPage(product) {
    const productName = document.querySelector(".product-purchase-panel h1");

    const productSubtitle = document.querySelector(
      ".product-purchase-panel h2",
    );

    const productDescription = document.querySelector(
      ".product-purchase-panel .lead-copy",
    );

    const priceElement = document.querySelector(
      ".product-purchase-panel .product-price",
    );

    const ageBadge = document.querySelector(
      ".product-purchase-panel .age-badge",
    );

    const stockStatus = document.querySelector(
      ".product-purchase-panel .stock-status",
    );

    const breadcrumbProduct = document.querySelector(".breadcrumb strong");

    // Product name
    if (productName) {
      productName.textContent = product.name;
    }

    // Breadcrumb
    if (breadcrumbProduct) {
      breadcrumbProduct.textContent = product.name;
    }

    // Page title
    document.title = `${product.name} | LearningRoom`;

    // Description
    if (productDescription) {
      productDescription.textContent = product.description || "";
    }

    // Price
    if (priceElement) {
      priceElement.textContent = `₹${Number(product.price).toFixed(0)}/-`;
    }

    // Recommended age
    if (ageBadge && product.recommended_age) {
      ageBadge.textContent = `Ages ${product.recommended_age}`;
    }

    // Stock
    if (stockStatus) {
      if (Number(product.stock) > 0) {
        stockStatus.textContent = "● In Stock";
      } else {
        stockStatus.textContent = "● Out of Stock";
      }
    }

    // Main product image
    if (mainImage && product.image) {
      mainImage.src = product.image;
      mainImage.alt = product.name;
    }
  }

  // --------------------------------------------------
  // Quantity controls
  // --------------------------------------------------
  const updateQuantity = () => {
    if (qtyValue) {
      qtyValue.textContent = quantity;
    }
  };

  qtyMinus?.addEventListener("click", () => {
    quantity = Math.max(1, quantity - 1);
    updateQuantity();
  });

  qtyPlus?.addEventListener("click", () => {
    quantity += 1;
    updateQuantity();
  });

  // --------------------------------------------------
  // Add product to cart
  // --------------------------------------------------
  function addProductToCart() {
    if (!currentProduct) {
      console.error("Product information is not loaded.");
      return;
    }

    const productName = currentProduct.name;
    const price = Number(currentProduct.price);

    // Prevent adding an out-of-stock product
    if (Number(currentProduct.stock) <= 0) {
      alert("Sorry, this product is currently out of stock.");
      return;
    }

    // Use existing LearningRoom cart function
    if (typeof window.addToCart === "function") {
      for (let i = 0; i < quantity; i += 1) {
        window.addToCart(productName, price);
      }
    } else {
      // Safe fallback
      const key = "learningroom_cart";
      let cart = [];

      try {
        cart = JSON.parse(localStorage.getItem(key)) || [];
      } catch {
        cart = [];
      }

      const existing = cart.find((item) => item.name === productName);

      if (existing) {
        existing.quantity = (existing.quantity || 1) + quantity;
      } else {
        cart.push({
          id: currentProduct.slug,
          name: productName,
          price,
          quantity,
          image: currentProduct.image,
        });
      }

      localStorage.setItem(key, JSON.stringify(cart));
    }

    if (mainAddCart) {
      const originalText = mainAddCart.innerHTML;

      mainAddCart.innerHTML = "✓ Added to Cart";
      mainAddCart.disabled = true;

      setTimeout(() => {
        mainAddCart.innerHTML = originalText;
        mainAddCart.disabled = false;
      }, 1400);
    }
  }

  mainAddCart?.addEventListener("click", addProductToCart);

  // --------------------------------------------------
  // FAQ accordion
  // --------------------------------------------------
  document.querySelectorAll(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".faq-item");

      if (!item) return;

      document.querySelectorAll(".faq-item").forEach((other) => {
        if (other !== item) {
          other.classList.remove("open");
        }
      });

      item.classList.toggle("open");
    });
  });

  // Load product
  await loadProduct();
});
