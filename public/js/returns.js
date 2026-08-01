var app = angular.module("returnsApp", []);

app.controller(
  "ReturnsController",
  function ($scope, $http) {
    /*
      Starting page data
    */
    $scope.products = [];
    $scope.selectedProduct = null;

    $scope.request = {
      orderNumber: "",
      customerEmail: "",
      reason: "",
      condition: "",
      details: ""
    };

    $scope.errors = {};
    $scope.attempted = false;
    $scope.submitting = false;

    /*
      Filters the products and displays matching
      product cards on the page.
    */
    function renderProducts(filter) {
      var search = (filter || "")
        .toLowerCase()
        .trim();

      var matches = $scope.products.filter(
        function (product) {
          var searchableText = [
            product.id,
            product.title,
            product.category
          ]
            .join(" ")
            .toLowerCase();

          return searchableText.includes(search);
        }
      );

      var html = "";

      matches.forEach(function (product) {
        html +=
          '<div class="col-12">' +
            '<article class="return-search-card">' +
              '<img src="' +
                product.image +
                '" alt="">' +

              '<div class="flex-grow-1">' +
                "<strong>" +
                  product.title +
                "</strong>" +

                '<div class="small text-muted">' +
                  product.id +
                  " · " +
                  product.category +
                  " · $" +
                  Number(product.price).toFixed(2) +
                "</div>" +
              "</div>" +

              '<button ' +
                'class="btn btn-outline-primary select-return-product" ' +
                'data-id="' +
                  product.id +
                '" ' +
                'type="button">' +
                "Select" +
              "</button>" +
            "</article>" +
          "</div>";
      });

      $("#returnProductList").html(
        html ||
        '<p class="text-muted">' +
          "No products found." +
        "</p>"
      );
    }

    /*
      Loads products from the Node.js server.
    */
    $http
      .get("/api/products")
      .then(function (response) {
        $scope.products = response.data;

        /*
          Wait until AngularJS finishes updating
          before displaying the products.
        */
        setTimeout(function () {
          renderProducts("");
        }, 0);
      })
      .catch(function () {
        $("#returnProductList").html(
          '<div class="alert alert-danger">' +
            "Products could not be loaded. " +
            "Start server.js." +
          "</div>"
        );
      });

    /*
      Filters products while the user types.
    */
    $(document).on(
      "input",
      "#returnSearch",
      function () {
        renderProducts(
          $(this).val()
        );
      }
    );

    /*
      Clears the search box and shows all products.
    */
    $(document).on(
      "click",
      "#clearReturnSearch",
      function () {
        $("#returnSearch").val("");
        renderProducts("");
      }
    );

    /*
      Selects a product from the search results.
    */
    $(document).on(
      "click",
      ".select-return-product",
      function () {
        var productId = $(this).data("id");

        /*
          Because this click event is handled by
          jQuery, $apply tells AngularJS to update
          the page after the selected product changes.
        */
        $scope.$apply(function () {
          $scope.selectedProduct =
            $scope.products.find(
              function (product) {
                return product.id === productId;
              }
            );
        });
      }
    );

    /*
      Validates the return form.
    */
    function validate() {
      var request = $scope.request;

      $scope.errors = {
        orderNumber:
          !(request.orderNumber || "").trim(),

        customerEmail:
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            request.customerEmail || ""
          ),

        reason:
          !request.reason,

        condition:
          !request.condition,

        details:
          (request.details || "")
            .trim()
            .length < 10,

        product:
          !$scope.selectedProduct
      };

      var hasErrors =
        Object.keys($scope.errors).some(
          function (key) {
            return $scope.errors[key];
          }
        );

      return !hasErrors;
    }

    /*
      Creates the JSON object displayed in the
      preview and sent to the server.
    */
    $scope.returnPreview = function () {
      return {
        orderNumber:
          $scope.request.orderNumber,

        customerEmail:
          $scope.request.customerEmail,

        product:
          $scope.selectedProduct
            ? {
                id:
                  $scope.selectedProduct.id,

                name:
                  $scope.selectedProduct.title,

                image:
                  $scope.selectedProduct.image,

                price:
                  $scope.selectedProduct.price
              }
            : null,

        reason:
          $scope.request.reason,

        condition:
          $scope.request.condition,

        details:
          $scope.request.details
      };
    };

    /*
      Displays a Bootstrap message using jQuery.
    */
    function message(text, type) {
      $("#returnMessage")
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
      Validates and submits the return request.
    */
    $scope.submitReturn = function () {
      $scope.attempted = true;

      if (!validate()) {
        if (!$scope.selectedProduct) {
          message(
            "Select a product and complete all return fields.",
            "danger"
          );
        } else {
          message(
            "Please correct the highlighted return fields.",
            "danger"
          );
        }

        return;
      }

      $scope.submitting = true;

      $http
        .post(
          "/api/returns",
          $scope.returnPreview()
        )
        .then(function (response) {
          message(
            "Return request submitted. Return ID: " +
              response.data.returnId,
            "success"
          );
        })
        .catch(function (error) {
          var errorMessage =
            error.data &&
            error.data.message
              ? error.data.message
              : "Return request could not be submitted.";

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