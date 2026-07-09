// SIMPLE MAGAZINE - VERSION 2
// This file controls the shopping cart page.
// jQuery is used for product search and cart manipulation.
// AJAX is used to send the cart data to a future RESTful API.

// This is the product data store.
const products = [
  {
    "id": "PRD-001",
    "title": "Technology Monthly — Digital Edition",
    "description": "A full month of technology articles in one download.",
    "category": "Technology",
    "format": "Digital Issue",
    "price": 2.99,
    "wordCount": 8000
  },
  {
    "id": "PRD-002",
    "title": "Learning Guide: Study Habits",
    "description": "A practical how-to guide for building better study habits.",
    "category": "Learning",
    "format": "How-To Guide",
    "price": 0.00,
    "wordCount": 950
  },
  {
    "id": "PRD-003",
    "title": "Community Spotlight Collection",
    "description": "Six inspiring profiles of people making a difference.",
    "category": "Community",
    "format": "Feature Article",
    "price": 1.99,
    "wordCount": 4800
  },
  {
    "id": "PRD-004",
    "title": "Understanding AI Without the Jargon",
    "description": "A plain-language explainer on artificial intelligence.",
    "category": "Technology",
    "format": "Explainer",
    "price": 1.99,
    "wordCount": 1500
  },
  {
    "id": "PRD-005",
    "title": "Free Resources for Adult Learners",
    "description": "A curated list of free tools and websites for lifelong learners.",
    "category": "Learning",
    "format": "Resource List",
    "price": 0.00,
    "wordCount": 600
  },
  {
    "id": "PRD-006",
    "title": "Health & Wellness Feature Pack",
    "description": "Three articles on everyday health tips and habits.",
    "category": "Health",
    "format": "Feature Article",
    "price": 2.49,
    "wordCount": 3600
  }
];

// Cart starts empty.
let cart = [];

// jQuery builds product cards from the catalog.
function renderProducts(filter) {
  const search = filter ? filter.toLowerCase().trim() : "";

  // jQuery: use the search text to filter the products array.
  const filtered = $.grep(products, function(product) {
    return product.title.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search) ||
      product.id.toLowerCase().includes(search) ||
      product.format.toLowerCase().includes(search);
  });

  const $grid = $("#productGrid");
  $grid.empty();

  if (filtered.length === 0) {
    $grid.html('<p class="text-muted">No products match your search.</p>');
    return;
  }

  // Build one product card per matching product.
  $.each(filtered, function(index, product) {
    const priceLabel = product.price === 0 ? "Free" : "$" + product.price.toFixed(2);

    const card = `
      <div class="col-md-6">
        <article class="product-card h-100">
          <div class="product-badge">${product.category}</div>
          <h3>${product.title}</h3>
          <p>${product.description}</p>
          <div class="d-flex justify-content-between align-items-center mt-3">
            <span class="price-tag">${priceLabel}</span>
            <button class="btn btn-primary add-to-cart-btn"
              data-id="${product.id}"
              data-title="${product.title}"
              data-price="${product.price}"
              type="button">Add to Cart</button>
          </div>
        </article>
      </div>`;

    $grid.append(card);
  });
}

// Updates the cart sidebar whenever the cart changes.
function renderCart() {
  const $cartList = $("#cartList");
  $cartList.empty();

  if (cart.length === 0) {
    $cartList.html('<li class="list-group-item text-muted">Your cart is empty.</li>');
    $("#cartSubtotal").text("$0.00");
    $("#cartTotal").text("$0.00");
    return;
  }

  let subtotal = 0;

  $.each(cart, function(index, item) {
    subtotal += item.price;
    const priceLabel = item.price === 0 ? "Free" : "$" + item.price.toFixed(2);

    const row = `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-danger remove-item-btn"
            data-index="${index}"
            type="button"
            aria-label="Remove item">−</button>
          <div>
            <strong>${item.title}</strong>
            <div class="small text-muted">${item.format}</div>
          </div>
        </div>
        <span>${priceLabel}</span>
      </li>`;

    $cartList.append(row);
  });

  const shipping = subtotal > 0 ? 0.00 : 0.00;
  const total = subtotal + shipping;

  $("#cartSubtotal").text("$" + subtotal.toFixed(2));
  $("#cartTotal").text("$" + total.toFixed(2));

  // Update the JSON display box.
  $("#jsonDisplay").text(JSON.stringify(cart, null, 2));
}

// ADD TO CART
$(document).on("click", ".add-to-cart-btn", function() {
  const id = $(this).data("id");
  const title = $(this).data("title");
  const price = parseFloat($(this).data("price"));

  // Find the full product object from the catalog.
  const product = $.grep(products, function(p) {
    return p.id === id;
  })[0];

  cart.push({
    id: product.id,
    title: product.title,
    description: product.description,
    category: product.category,
    format: product.format,
    price: product.price
  });

  renderCart();
  showMessage(title + " was added to your cart.", "success");
});

// REMOVE FROM CART
$(document).on("click", ".remove-item-btn", function() {
  const index = parseInt($(this).data("index"));
  const removed = cart[index].title;
  cart.splice(index, 1);
  renderCart();
  showMessage(removed + " was removed from your cart.", "warning");
});

// Filters the product grid as the user types.
$("#searchInput").on("input", function() {
  renderProducts($(this).val());
});

$("#searchButton").on("click", function() {
  renderProducts($("#searchInput").val());
});

// Product details form validation - JavaScript checks required fields.
$("#productForm").on("submit", function(event) {
  event.preventDefault();

  if (this.checkValidity() === false) {
    $(this).addClass("was-validated");
    return;
  }

  showMessage("Product details saved successfully.", "success");
  $(this).removeClass("was-validated")[0].reset();
});

// AJAX sends the cart JSON to a future RESTful API endpoint.
// This simulates the transport layer since the API does not exist yet.
$("#checkoutButton").on("click", function() {
  if (cart.length === 0) {
    showMessage("Your cart is empty. Add items before checking out.", "danger");
    return;
  }

  // Build the JSON payload.
  const payload = {
    timestamp: new Date().toISOString(),
    items: cart,
    total: cart.reduce(function(sum, item) { return sum + item.price; }, 0)
  };

  // AJAX call sends cart data to a placeholder API endpoint.
  $.ajax({
    url: "https://api.example.com/cart/checkout",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(payload),
    success: function(response) {
      showMessage("Order sent to the API successfully!", "success");
      cart = [];
      renderCart();
    },
    error: function(xhr, status, error) {
      // Expected to fail since the API does not exist yet.
      // We show a simulated success message to demonstrate the AJAX call.
      showMessage("Cart data prepared and sent to the API endpoint (API coming in a future assignment).", "info");
      $("#jsonDisplay").text(JSON.stringify(payload, null, 2));
    }
  });
});

// Displays a dismissible alert at the top of the page.
function showMessage(message, color) {
  const $box = $("#messageBox");
  $box.text(message);
  $box.removeClass("d-none alert-success alert-warning alert-danger alert-info");
  $box.addClass("alert alert-" + color);

  // Auto-hide after 3 seconds.
  setTimeout(function() {
    $box.addClass("d-none");
  }, 3000);
}

// Filter products by category on click.
$(document).on("click", ".filter-badge", function() {
  $(".filter-badge").removeClass("bg-primary-subtle text-primary-emphasis").addClass("bg-light text-dark border");
  $(this).removeClass("bg-light text-dark border").addClass("bg-primary-subtle text-primary-emphasis");

  const category = $(this).data("category");
  if (category === "all") {
    renderProducts("");
  } else {
    renderProducts(category);
  }
});

// Render products and empty cart when the page first loads.
$(document).ready(function() {
  renderProducts("");
  renderCart();
});
