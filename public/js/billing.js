// THE CURRENT MAGAZINE - MONGODB BILLING PAGE
// AngularJS loads the active shopping cart from MongoDB, creates a Shipping
// document, and then creates a Billing document through the Express REST API.

var app = angular.module("billingApp", []);

app.controller("BillingController", function ($scope, $http) {
  var cartIdStorageName = "simpleMagazineCartId";
  var legacyCartStorageName = "simpleMagazineCart";

  $scope.cart = [];
  $scope.cartRecord = { items: [], subtotal: 0 };
  $scope.loadingCart = true;
  $scope.subtotal = 0;
  $scope.shippingCost = 0;
  $scope.total = 0;

  $scope.billing = {
    fullName: "",
    email: "",
    address: {
      street: "",
      city: "",
      state: "",
      zip: ""
    },
    payment: {
      cardNumber: "",
      expiration: "",
      securityCode: ""
    },
    shippingMethod: ""
  };

  $scope.errors = {};
  $scope.attempted = false;
  $scope.submitting = false;

  function createCartId() {
    return (
      "CART-" +
      Date.now() +
      "-" +
      Math.random().toString(16).slice(2, 6).toUpperCase()
    );
  }

  function getCartId() {
    var cartId = localStorage.getItem(cartIdStorageName);

    if (!cartId) {
      cartId = createCartId();
      localStorage.setItem(cartIdStorageName, cartId);
    }

    return cartId;
  }

  var cartId = getCartId();

  function calculate() {
    $scope.subtotal = Number($scope.cartRecord.subtotal || 0);

    if ($scope.billing.shippingMethod === "Standard shipping") {
      $scope.shippingCost = 4.99;
    } else if ($scope.billing.shippingMethod === "Express shipping") {
      $scope.shippingCost = 9.99;
    } else {
      $scope.shippingCost = 0;
    }

    $scope.total = Number(
      ($scope.subtotal + $scope.shippingCost).toFixed(2)
    );
  }

  function loadCart() {
    $scope.loadingCart = true;

    $http
      .get("/api/shopping-carts/" + encodeURIComponent(cartId))
      .then(function (response) {
        $scope.cartRecord = response.data || { items: [], subtotal: 0 };
        $scope.cart = $scope.cartRecord.items || [];

        // Keep the old browser key only so older pages in the project still
        // display the same cart. MongoDB remains the source of truth.
        localStorage.setItem(
          legacyCartStorageName,
          JSON.stringify($scope.cart)
        );

        calculate();
      })
      .catch(function (error) {
        $scope.cart = [];
        $scope.cartRecord = { items: [], subtotal: 0 };
        calculate();
        message(
          (error.data && error.data.message) ||
            "The database shopping cart could not be loaded.",
          "danger"
        );
      })
      .finally(function () {
        $scope.loadingCart = false;
      });
  }

  $scope.$watch("billing.shippingMethod", calculate);

  $scope.formatCardNumber = function () {
    var digits = ($scope.billing.payment.cardNumber || "")
      .replace(/\D/g, "")
      .slice(0, 19);

    $scope.billing.payment.cardNumber = digits
      .replace(/(.{4})/g, "$1 ")
      .trim();
  };

  function validExpiration(value) {
    var match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value || "");

    if (!match) {
      return false;
    }

    var month = Number(match[1]);
    var year = 2000 + Number(match[2]);
    var expirationDate = new Date(year, month, 0, 23, 59, 59);

    return expirationDate >= new Date();
  }

  function validate() {
    var billing = $scope.billing;
    var cardDigits = (billing.payment.cardNumber || "").replace(/\D/g, "");

    $scope.errors = {
      fullName: !(billing.fullName || "").trim(),
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billing.email || ""),
      street: !(billing.address.street || "").trim(),
      city: !(billing.address.city || "").trim(),
      state: !/^[A-Za-z]{2}$/.test(billing.address.state || ""),
      zip: !/^\d{5}(-\d{4})?$/.test(billing.address.zip || ""),
      cardNumber: !/^\d{13,19}$/.test(cardDigits),
      expiration: !validExpiration(billing.payment.expiration),
      securityCode: !/^\d{3,4}$/.test(
        billing.payment.securityCode || ""
      ),
      shippingMethod: !billing.shippingMethod
    };

    var hasErrors = Object.keys($scope.errors).some(function (key) {
      return $scope.errors[key];
    });

    return !hasErrors && $scope.cart.length > 0;
  }

  function safePaymentMethod() {
    var cardDigits = ($scope.billing.payment.cardNumber || "").replace(/\D/g, "");

    return {
      type: "Credit card",
      lastFour: cardDigits.slice(-4),
      expiration: $scope.billing.payment.expiration
    };
  }

  $scope.safeBillingPreview = function () {
    return {
      cartId: cartId,
      fullName: $scope.billing.fullName,
      email: $scope.billing.email,
      address: $scope.billing.address,
      paymentMethod: safePaymentMethod(),
      shippingMethod: $scope.billing.shippingMethod,
      items: $scope.cart,
      subtotal: Number(($scope.subtotal || 0).toFixed(2)),
      shippingCost: Number(($scope.shippingCost || 0).toFixed(2)),
      total: Number(($scope.total || 0).toFixed(2))
    };
  };

  function message(text, type) {
    $("#billingMessage")
      .removeClass(
        "d-none alert-success alert-danger alert-warning alert-info"
      )
      .addClass("alert-" + type)
      .text(text);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $scope.submitBilling = function () {
    $scope.attempted = true;

    if (!validate()) {
      message(
        $scope.cart.length > 0
          ? "Please correct the highlighted billing fields."
          : "Your MongoDB shopping cart is empty.",
        "danger"
      );
      return;
    }

    $scope.submitting = true;

    var shippingPayload = {
      cartId: cartId,
      fullName: $scope.billing.fullName,
      email: $scope.billing.email,
      address: angular.copy($scope.billing.address),
      method: $scope.billing.shippingMethod
    };

    // First persist the Shipping entity. Its generated shippingId is then
    // referenced by the Billing entity, demonstrating two related collections.
    $http
      .post("/api/shipping", shippingPayload)
      .then(function (shippingResponse) {
        var billingPayload = {
          cartId: cartId,
          shippingId: shippingResponse.data.shippingId,
          fullName: $scope.billing.fullName,
          email: $scope.billing.email,
          address: angular.copy($scope.billing.address),
          paymentMethod: safePaymentMethod()
        };

        return $http.post("/api/billing", billingPayload);
      })
      .then(function (billingResponse) {
        message(
          "Order saved in MongoDB. Confirmation: " +
            billingResponse.data.confirmationNumber,
          "success"
        );

        localStorage.setItem(
          "simpleMagazineLastOrder",
          JSON.stringify(billingResponse.data)
        );

        // Preserve the checked-out cart in MongoDB for screenshots/history,
        // while giving the browser a fresh cart for the next order.
        localStorage.removeItem(cartIdStorageName);
        localStorage.setItem(legacyCartStorageName, "[]");
        $scope.cart = [];
        $scope.cartRecord = { items: [], subtotal: 0 };
        calculate();
      })
      .catch(function (error) {
        message(
          (error.data && error.data.message) ||
            "The order could not be saved to MongoDB.",
          "danger"
        );
      })
      .finally(function () {
        $scope.submitting = false;
      });
  };

  loadCart();
});
