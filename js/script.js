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

      checkNavbarSession();
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
   NAVBAR SESSION
========================================================= */

function checkNavbarSession() {
  const dashboardLink = document.getElementById("dashboardNavLink");

  const logoutLink = document.getElementById("logoutNavLink");

  const mobileDashboardLink = document.getElementById(
    "mobileDashboardNavLink"
  );

  const mobileLogoutLink = document.getElementById(
    "mobileLogoutNavLink"
  );

  const mobileLoginLink = document.getElementById(
    "mobileLoginNavLink"
  );

  const userNavLink = document.getElementById("userNavLink");

  fetch("/api/session", {
    method: "GET",
    credentials: "include",
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.success && data.customer) {
        /* Logged in */

        if (dashboardLink) {
          dashboardLink.style.display = "inline-block";
        }

        if (logoutLink) {
          logoutLink.style.display = "inline-block";
        }

        if (mobileDashboardLink) {
          mobileDashboardLink.style.display = "block";
        }

        if (mobileLogoutLink) {
          mobileLogoutLink.style.display = "block";
        }

        if (mobileLoginLink) {
          mobileLoginLink.style.display = "none";
        }

        if (userNavLink) {
          userNavLink.href = "dashboard.html";
          userNavLink.setAttribute("aria-label", "My Dashboard");
        }

        /* Logout */

        if (logoutLink) {
          logoutLink.addEventListener("click", handleLogout);
        }

        if (mobileLogoutLink) {
          mobileLogoutLink.addEventListener("click", handleLogout);
        }
      }
    })
    .catch(function (error) {
      console.error("Navbar session check error:", error);
    });
}

async function handleLogout(event) {
  event.preventDefault();

  try {
    const response = await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to logout.");
    }

    window.location.href = "login.html";
  } catch (error) {
    console.error("Logout error:", error);

    alert(error.message || "Unable to logout. Please try again.");
  }
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
