var app = angular.module("billingApp", []);

app.controller(
  "BillingController",
  function ($scope, $http) {
    var cartKey = "simpleMagazineCart";

    $scope.cart = [];

    try {
      $scope.cart = JSON.parse(
        localStorage.getItem(cartKey) || "[]"
      );
    } catch (error) {
      $scope.cart = [];
    }

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

    /*
      Calculates the order subtotal, shipping charge,
      and total amount.
    */
    function calculate() {
      $scope.subtotal = $scope.cart.reduce(
        function (sum, item) {
          return sum + Number(item.price || 0);
        },
        0
      );

      if (
        $scope.billing.shippingMethod ===
        "Standard shipping"
      ) {
        $scope.shippingCost = 4.99;
      } else if (
        $scope.billing.shippingMethod ===
        "Express shipping"
      ) {
        $scope.shippingCost = 9.99;
      } else {
        $scope.shippingCost = 0;
      }

      $scope.total =
        $scope.subtotal +
        $scope.shippingCost;
    }

    /*
      Recalculates the total when the shipping
      method changes.
    */
    $scope.$watch(
      "billing.shippingMethod",
      calculate
    );

    calculate();

    /*
      Formats the card number into groups of four.
    */
    $scope.formatCardNumber = function () {
      var digits = (
        $scope.billing.payment.cardNumber || ""
      )
        .replace(/\D/g, "")
        .slice(0, 19);

      $scope.billing.payment.cardNumber =
        digits
          .replace(/(.{4})/g, "$1 ")
          .trim();
    };

    /*
      Checks that the expiration date uses MM/YY
      and has not expired.
    */
    function validExpiration(value) {
      var match =
        /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(
          value || ""
        );

      if (!match) {
        return false;
      }

      var month = Number(match[1]);
      var year = 2000 + Number(match[2]);

      var expirationDate = new Date(
        year,
        month,
        0,
        23,
        59,
        59
      );

      return expirationDate >= new Date();
    }

    /*
      Validates all billing fields.
    */
    function validate() {
      var billing = $scope.billing;

      var cardDigits = (
        billing.payment.cardNumber || ""
      ).replace(/\D/g, "");

      $scope.errors = {
        fullName:
          !(billing.fullName || "").trim(),

        email:
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            billing.email || ""
          ),

        street:
          !(billing.address.street || "").trim(),

        city:
          !(billing.address.city || "").trim(),

        state:
          !/^[A-Za-z]{2}$/.test(
            billing.address.state || ""
          ),

        zip:
          !/^\d{5}(-\d{4})?$/.test(
            billing.address.zip || ""
          ),

        cardNumber:
          !/^\d{13,19}$/.test(cardDigits),

        expiration:
          !validExpiration(
            billing.payment.expiration
          ),

        securityCode:
          !/^\d{3,4}$/.test(
            billing.payment.securityCode || ""
          ),

        shippingMethod:
          !billing.shippingMethod
      };

      var hasErrors =
        Object.keys($scope.errors).some(
          function (key) {
            return $scope.errors[key];
          }
        );

      return !hasErrors &&
             $scope.cart.length > 0;
    }

    /*
      Creates the JSON object sent to the backend.

      The full card number and security code are
      intentionally excluded.
    */
    $scope.safeBillingPreview = function () {
      var cardDigits = (
        $scope.billing.payment.cardNumber || ""
      ).replace(/\D/g, "");

      return {
        fullName:
          $scope.billing.fullName,

        email:
          $scope.billing.email,

        address:
          $scope.billing.address,

        paymentMethod: {
          type: "Credit card",

          lastFour:
            cardDigits.slice(-4) || "",

          expiration:
            $scope.billing.payment.expiration
        },

        shippingMethod:
          $scope.billing.shippingMethod,

        items:
          $scope.cart,

        total:
          Number(
            ($scope.total || 0).toFixed(2)
          )
      };
    };

    /*
      Displays a Bootstrap alert using jQuery.
    */
    function message(text, type) {
      $("#billingMessage")
        .removeClass(
          "d-none " +
          "alert-success " +
          "alert-danger " +
          "alert-warning"
        )
        .addClass("alert-" + type)
        .text(text);

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }

    /*
      Validates and submits the billing JSON
      using an AngularJS AJAX request.
    */
    $scope.submitBilling = function () {
      $scope.attempted = true;

      if (!validate()) {
        if ($scope.cart.length > 0) {
          message(
            "Please correct the highlighted billing fields.",
            "danger"
          );
        } else {
          message(
            "Your cart is empty.",
            "danger"
          );
        }

        return;
      }

      $scope.submitting = true;

      var payload = angular.copy(
        $scope.safeBillingPreview()
      );

      $http
        .post("/api/billing", payload)

        .then(function (response) {
          message(
            "Billing details processed successfully. " +
            "Confirmation: " +
            response.data.confirmationNumber,
            "success"
          );

          localStorage.setItem(
            "simpleMagazineLastOrder",
            JSON.stringify(response.data)
          );
        })

        .catch(function (error) {
          var errorMessage =
            error.data &&
            error.data.message
              ? error.data.message
              : "Billing details could not be processed.";

          message(
            errorMessage,
            "danger"
          );
        })

        .finally(function () {
          $scope.submitting = false;
        });
    };
  }
);