/* =========================================================
   LEARNINGROOM - COMMON SCRIPT
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  loadNavbar();
  loadFooter();
});

/* =========================================================
   LOAD COMMON NAVBAR
========================================================= */

function loadNavbar() {
  const navbarContainer = document.getElementById("navbar");

  if (!navbarContainer) {
    return;
  }

  fetch("navbar.html")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Unable to load navbar.html");
      }

      return response.text();
    })
    .then(function (html) {
      navbarContainer.innerHTML = html;

      initializeNavbar();

      updateCartCount();
    })
    .catch(function (error) {
      console.error("Navbar loading error:", error);
    });
}

/* =========================================================
   LOAD COMMON FOOTER
========================================================= */

function loadFooter() {
  const footerContainer = document.getElementById("footer");

  if (!footerContainer) {
    return;
  }

  fetch("footer.html")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Unable to load footer.html");
      }

      return response.text();
    })
    .then(function (html) {
      footerContainer.innerHTML = html;
    })
    .catch(function (error) {
      console.error("Footer loading error:", error);
    });
}

/* =========================================================
   NAVBAR INITIALIZATION
========================================================= */

function initializeNavbar() {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");

  const mobileNav = document.getElementById("mobileNav");

  /* Mobile Menu */

  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener("click", function () {
      mobileNav.classList.toggle("open");

      if (mobileNav.classList.contains("open")) {
        mobileMenuBtn.textContent = "✕";
      } else {
        mobileMenuBtn.textContent = "☰";
      }
    });
  }

  /* Active Navigation */

  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  const navLinks = document.querySelectorAll(".main-nav a[data-page]");

  navLinks.forEach(function (link) {
    const page = link.getAttribute("data-page");

    if (page === currentPage) {
      link.classList.add("active");
    }
  });
}

/* =========================================================
   CART COUNT
========================================================= */

function updateCartCount() {
  const cartCountElement = document.getElementById("cartCount");

  if (!cartCountElement) {
    return;
  }

  let cart = [];

  try {
    cart = JSON.parse(localStorage.getItem("learningroom_cart")) || [];
  } catch (error) {
    cart = [];
  }

  let totalQuantity = 0;

  cart.forEach(function (item) {
    totalQuantity += Number(item.quantity) || 0;
  });

  cartCountElement.textContent = totalQuantity;
}
