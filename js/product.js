document.addEventListener("DOMContentLoaded", function () {
  const categoryButtons = document.querySelectorAll(".category-card");

  const productCards = document.querySelectorAll(".product-card");

  const productCount = document.getElementById("productCount");

  const noProducts = document.getElementById("noProducts");

  categoryButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const selectedCategory = button.getAttribute("data-category");

      /* Active category */

      categoryButtons.forEach(function (item) {
        item.classList.remove("active");
      });

      button.classList.add("active");

      /* Filter products */

      let visibleCount = 0;

      productCards.forEach(function (card) {
        const cardCategory = card.getAttribute("data-category");

        if (selectedCategory === "all" || cardCategory === selectedCategory) {
          card.style.display = "block";

          visibleCount++;
        } else {
          card.style.display = "none";
        }
      });

      /* Update count */

      productCount.textContent = visibleCount;

      /* No products message */

      if (visibleCount === 0) {
        noProducts.style.display = "block";
      } else {
        noProducts.style.display = "none";
      }
    });
  });
});
