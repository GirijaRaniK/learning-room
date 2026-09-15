document.addEventListener("DOMContentLoaded", () => {
  const mainImage = document.getElementById("mainProductImage");
  const thumbs = document.querySelectorAll(".gallery-thumb");
  const qtyValue = document.getElementById("quantityValue");
  const qtyMinus = document.getElementById("qtyMinus");
  const qtyPlus = document.getElementById("qtyPlus");
  const mainAddCart = document.getElementById("mainAddCart");

  let quantity = 1;

  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const imagePath = thumb.dataset.image;
      if (mainImage && imagePath) {
        mainImage.src = imagePath;
      }

      thumbs.forEach((item) => item.classList.remove("active"));
      thumb.classList.add("active");
    });
  });

  const updateQuantity = () => {
    if (qtyValue) qtyValue.textContent = quantity;
  };

  qtyMinus?.addEventListener("click", () => {
    quantity = Math.max(1, quantity - 1);
    updateQuantity();
  });

  qtyPlus?.addEventListener("click", () => {
    quantity += 1;
    updateQuantity();
  });

  function addProductToCart() {
    const productName = "Creative Story Builder";
    const price = 699;

    // Use the existing LearningRoom cart function when available.
    if (typeof window.addToCart === "function") {
      for (let i = 0; i < quantity; i += 1) {
        window.addToCart(productName, price);
      }
    } else {
      // Safe fallback so the page remains usable before cart.js is loaded/configured.
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
          id: "creative-story-builder",
          name: productName,
          price,
          quantity,
          image: "images/products/learning-kit.jpg",
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

  document.querySelectorAll(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".faq-item");
      if (!item) return;

      document.querySelectorAll(".faq-item").forEach((other) => {
        if (other !== item) other.classList.remove("open");
      });

      item.classList.toggle("open");
    });
  });
});
