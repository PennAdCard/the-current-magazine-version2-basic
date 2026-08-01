// THE CURRENT MAGAZINE - MONGODB STOREFRONT
// Products and shopping carts are now loaded from and saved to MongoDB
// through the Express REST API. jQuery handles the page interactions.

const cartIdStorageName = "simpleMagazineCartId";
const legacyCartStorageName = "simpleMagazineCart";

let products = [];
let cart = { items: [], subtotal: 0 };

function getCartId() {
  let cartId = localStorage.getItem(cartIdStorageName);
  if (!cartId) {
    cartId = "CART-" + Date.now() + "-" + Math.random().toString(16).slice(2, 6).toUpperCase();
    localStorage.setItem(cartIdStorageName, cartId);
  }
  return cartId;
}

const cartId = getCartId();

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function syncLegacyCart() {
  localStorage.setItem(legacyCartStorageName, JSON.stringify(cart.items || []));
}

async function apiRequest(url, options) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const data = await response.json().catch(function() { return {}; });
  if (!response.ok) {
    throw new Error(data.message || "The database request failed.");
  }
  return data;
}

async function loadProducts() {
  products = await apiRequest("/api/products");
  renderProducts($("#searchInput").val());
}

async function loadCart() {
  cart = await apiRequest("/api/shopping-carts/" + encodeURIComponent(cartId));
  syncLegacyCart();
  renderCart();
}

function renderProducts(filter) {
  const search = filter ? filter.toLowerCase().trim() : "";
  const filtered = $.grep(products, function(product) {
    return product.title.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search) ||
      product.productId.toLowerCase().includes(search) ||
      product.format.toLowerCase().includes(search);
  });

  const $grid = $("#productGrid");
  $grid.empty();

  if (filtered.length === 0) {
    $grid.html('<p class="text-muted">No products match your search.</p>');
    return;
  }

  $.each(filtered, function(index, product) {
    const priceLabel = Number(product.price) === 0 ? "Free" : "$" + Number(product.price).toFixed(2);
    const card = `
      <div class="col-md-6">
        <article class="product-card h-100">
          <div class="product-badge">${escapeHtml(product.category)}</div>
          <h3>${escapeHtml(product.title)}</h3>
          <p>${escapeHtml(product.description)}</p>
          <div class="small text-muted mb-2">${escapeHtml(product.productId)} · ${escapeHtml(product.format)}</div>
          <div class="d-flex justify-content-between align-items-center mt-3">
            <span class="price-tag">${priceLabel}</span>
            <button class="btn btn-primary add-to-cart-btn"
              data-id="${escapeHtml(product.productId)}"
              type="button">Add to Cart</button>
          </div>
        </article>
      </div>`;
    $grid.append(card);
  });
}

function renderCart() {
  const items = cart.items || [];
  const $cartList = $("#cartList");
  $cartList.empty();

  if (items.length === 0) {
    $cartList.html('<li class="list-group-item text-muted">Your cart is empty.</li>');
    $("#cartSubtotal").text("$0.00");
    $("#cartTotal").text("$0.00");
    $("#jsonDisplay").text(JSON.stringify(cart, null, 2));
    return;
  }

  $.each(items, function(index, item) {
    const lineTotal = Number(item.price) * Number(item.quantity || 1);
    const priceLabel = lineTotal === 0 ? "Free" : "$" + lineTotal.toFixed(2);
    const row = `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-danger remove-item-btn"
            data-id="${escapeHtml(item.productId)}"
            type="button" aria-label="Remove item">−</button>
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <div class="small text-muted">${escapeHtml(item.format)} · Quantity ${item.quantity || 1}</div>
          </div>
        </div>
        <span>${priceLabel}</span>
      </li>`;
    $cartList.append(row);
  });

  const subtotal = Number(cart.subtotal || 0);
  $("#cartSubtotal").text("$" + subtotal.toFixed(2));
  $("#cartTotal").text("$" + subtotal.toFixed(2));
  $("#jsonDisplay").text(JSON.stringify(cart, null, 2));
}

$(document).on("click", ".add-to-cart-btn", async function() {
  const productId = $(this).data("id");
  try {
    cart = await apiRequest(
      "/api/shopping-carts/" + encodeURIComponent(cartId) + "/items",
      { method: "POST", body: JSON.stringify({ productId: productId, quantity: 1 }) }
    );
    syncLegacyCart();
    renderCart();
    showMessage("Product added to the MongoDB shopping cart.", "success");
  } catch (error) {
    showMessage(error.message, "danger");
  }
});

$(document).on("click", ".remove-item-btn", async function() {
  const productId = $(this).data("id");
  try {
    cart = await apiRequest(
      "/api/shopping-carts/" + encodeURIComponent(cartId) + "/items/" + encodeURIComponent(productId),
      { method: "DELETE" }
    );
    syncLegacyCart();
    renderCart();
    showMessage("Product removed from the database cart.", "warning");
  } catch (error) {
    showMessage(error.message, "danger");
  }
});

$("#searchInput").on("input", function() {
  renderProducts($(this).val());
});

$("#searchButton").on("click", function() {
  renderProducts($("#searchInput").val());
});

$("#productForm").on("submit", async function(event) {
  event.preventDefault();

  if (this.checkValidity() === false) {
    $(this).addClass("was-validated");
    return;
  }

  const payload = {
    productId: $("#productId").val().trim(),
    title: $("#productName").val().trim(),
    category: $("#productCategory").val(),
    format: $("#productFormat").val(),
    price: Number($("#productPrice").val()),
    description: $("#productDescription").val().trim(),
    image: "images/oracle-ai-erp.svg"
  };

  try {
    const savedProduct = await apiRequest("/api/products", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    products.push(savedProduct);
    products.sort(function(a, b) { return a.productId.localeCompare(b.productId); });
    renderProducts("");
    this.reset();
    $(this).removeClass("was-validated");
    showMessage("Product saved to the MongoDB Products collection.", "success");
  } catch (error) {
    showMessage(error.message, "danger");
  }
});

$("#checkoutButton").on("click", function() {
  if (!cart.items || cart.items.length === 0) {
    showMessage("Your cart is empty. Add items before checking out.", "danger");
    return;
  }
  window.location.href = "billing.html";
});

function showMessage(message, color) {
  const $box = $("#messageBox");
  $box.text(message);
  $box.removeClass("d-none alert-success alert-warning alert-danger alert-info");
  $box.addClass("alert alert-" + color);
  setTimeout(function() { $box.addClass("d-none"); }, 4000);
}

$(document).on("click", ".filter-badge", function() {
  $(".filter-badge").removeClass("bg-primary-subtle text-primary-emphasis").addClass("bg-light text-dark border");
  $(this).removeClass("bg-light text-dark border").addClass("bg-primary-subtle text-primary-emphasis");
  const category = $(this).data("category");
  renderProducts(category === "all" ? "" : category);
});

$(document).ready(async function() {
  try {
    await Promise.all([loadProducts(), loadCart()]);
  } catch (error) {
    showMessage(error.message + " Make sure node server.js is running and MongoDB is connected.", "danger");
  }
});
