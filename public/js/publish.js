// This file controls the Publish Options page.
//
// AngularJS manages the form state, submission history, and API calls.
// jQuery loads saved articles from localStorage and displays messages.
// Submissions are saved directly to MongoDB through the Express API.

const publishApp = angular.module("publishApp", []);

publishApp.controller(
  "PublishController",
  function ($scope, $http) {
    // Articles displayed in the article dropdown.
    $scope.availableArticles = [];

    // Form values connected to publish.html through ng-model.
    $scope.formData = {
      articleId: "",
      publicationDate: "",
      channels: {
        web: false,
        email: false,
        social: false,
        print: false
      },
      reviewStatus: "",
      editorName: "",
      editorEmail: "",
      editorialNotes: ""
    };

    // Validation and page state.
    $scope.fieldErrors = {};
    $scope.submitSuccess = false;
    $scope.submitting = false;

    // Submissions saved during the current browser session.
    $scope.submissions = [];

    /*
      Load articles from localStorage.

      The Content page stores articles using the
      simpleMagazineArticles key.
    */
    $(document).ready(function () {
      const savedData = localStorage.getItem(
        "simpleMagazineArticles"
      );

      if (savedData !== null) {
        try {
          const parsed = JSON.parse(savedData);

          if (
            Array.isArray(parsed) &&
            parsed.length > 0
          ) {
            $scope.$apply(function () {
              $scope.availableArticles = parsed;
            });
          }
        } catch (error) {
          console.error(
            "Could not load articles from localStorage.",
            error
          );
        }
      }

      /*
        Use sample articles when localStorage does not
        contain any saved articles.
      */
      if ($scope.availableArticles.length === 0) {
        $scope.$apply(function () {
          $scope.availableArticles = [
            {
              articleCode: "ART-001",
              title:
                "5 Digital Tools That Actually Save You Time"
            },
            {
              articleCode: "ART-002",
              title:
                "How to Build a Study Habit That Sticks"
            },
            {
              articleCode: "ART-003",
              title:
                "Meet the Neighbors Cleaning Up Riverside Park"
            }
          ];
        });
      }
    });

    /*
      Validate all required form fields.
    */
    function validateForm() {
      $scope.fieldErrors = {};

      let valid = true;

      if (!$scope.formData.articleId) {
        $scope.fieldErrors.articleId = true;
        valid = false;
      }

      if (!$scope.formData.publicationDate) {
        $scope.fieldErrors.publicationDate = true;
        valid = false;
      }

      const channels =
        $scope.formData.channels;

      if (
        !channels.web &&
        !channels.email &&
        !channels.social &&
        !channels.print
      ) {
        $scope.fieldErrors.channels = true;
        valid = false;
      }

      if (!$scope.formData.reviewStatus) {
        $scope.fieldErrors.reviewStatus = true;
        valid = false;
      }

      if (
        !$scope.formData.editorName ||
        $scope.formData.editorName.trim() === ""
      ) {
        $scope.fieldErrors.editorName = true;
        valid = false;
      }

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !$scope.formData.editorEmail ||
        !emailPattern.test(
          $scope.formData.editorEmail
        )
      ) {
        $scope.fieldErrors.editorEmail = true;
        valid = false;
      }

      return valid;
    }

    /*
      Return the selected article object.
    */
    function getSelectedArticle() {
      return $scope.availableArticles.find(
        function (article) {
          return (
            article.articleCode ===
            $scope.formData.articleId
          );
        }
      );
    }

    /*
      Convert the date input into YYYY-MM-DD.
    */
    function formatPublicationDate(dateValue) {
      if (!dateValue) {
        return "";
      }

      if (
        Object.prototype.toString.call(dateValue) ===
          "[object Date]" &&
        !Number.isNaN(dateValue.getTime())
      ) {
        const year = dateValue.getFullYear();

        const month = String(
          dateValue.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
          dateValue.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
      }

      return String(dateValue).split("T")[0];
    }

    /*
      The MongoDB schema does not include Draft as an
      editorial status.

      Draft submissions are therefore added to the
      editorial queue as Pending.
    */
    function getApiStatus(reviewStatus) {
      if (reviewStatus === "Draft") {
        return "Pending";
      }

      return reviewStatus || "Pending";
    }

    /*
      Submit the publication form.

      This now saves the submission immediately through
      POST /api/submissions.

      Previously, this function only added the submission
      to a browser array and did not save it to MongoDB.
    */
    $scope.submitForm = function () {
      $scope.submitSuccess = false;

      /*
        Prevent duplicate requests when the user clicks
        the button multiple times.
      */
      if ($scope.submitting) {
        return;
      }

      if (!validateForm()) {
        showMessage(
          "Please fill in all required fields.",
          "danger"
        );

        return;
      }

      const selectedArticle =
        getSelectedArticle();

      const payload = {
        articleId:
          $scope.formData.articleId,

        articleCode:
          $scope.formData.articleId,

        articleTitle:
          selectedArticle
            ? selectedArticle.title
            : $scope.formData.articleId,

        publicationDate:
          formatPublicationDate(
            $scope.formData.publicationDate
          ),

        channels:
          angular.copy(
            $scope.formData.channels
          ),

        editorName:
          $scope.formData.editorName.trim(),

        editorEmail:
          $scope.formData.editorEmail.trim(),

        editorialNotes:
          $scope.formData.editorialNotes.trim(),

        status:
          getApiStatus(
            $scope.formData.reviewStatus
          )
      };

      $scope.submitting = true;

      /*
        Save the submission through the Express API.
      */
      $http
        .post(
          "/api/submissions",
          payload
        )

        .then(function (response) {
          /*
            Use the object returned by MongoDB because it
            contains the generated submission ID and
            timestamps.
          */
          const savedSubmission =
            response.data;

          /*
            publish.html displays reviewStatus in the
            session history, while MongoDB stores status.
          */
          savedSubmission.reviewStatus =
            savedSubmission.status;

          $scope.submissions.push(
            savedSubmission
          );

          $scope.submitSuccess = true;

          showMessage(
            "Article saved to MongoDB and added to the editorial review queue.",
            "success"
          );

          /*
            Clear the form after the database confirms
            that the submission was saved.
          */
          $scope.resetForm(true);
        })

        .catch(function (error) {
          let message =
            "The submission could not be saved. Make sure the Node.js server and MongoDB are running.";

          if (
            error.data &&
            error.data.message
          ) {
            message =
              error.data.message;
          }

          showMessage(
            message,
            "danger"
          );
        })

        .finally(function () {
          $scope.submitting = false;
        });
    };

    /*
      Reset the publication form.

      keepSuccess remains true after a successful save so
      the green success banner stays visible.
    */
    $scope.resetForm = function (
      keepSuccess
    ) {
      $scope.formData = {
        articleId: "",
        publicationDate: "",
        channels: {
          web: false,
          email: false,
          social: false,
          print: false
        },
        reviewStatus: "",
        editorName: "",
        editorEmail: "",
        editorialNotes: ""
      };

      $scope.fieldErrors = {};

      if (keepSuccess !== true) {
        $scope.submitSuccess = false;
      }
    };

    /*
      Remove an entry from the browser session history.

      This does not delete the MongoDB submission.
    */
    $scope.removeSubmission = function (
      index
    ) {
      $scope.submissions.splice(
        index,
        1
      );
    };

    /*
      The old project required users to click
      "Send All to API" after submitting.

      Submissions are now saved immediately, so this
      function must not POST them again because doing so
      would create duplicate MongoDB records.
    */
    $scope.sendToApi = function () {
      if (
        $scope.submissions.length === 0
      ) {
        showMessage(
          "No submissions have been saved in this session.",
          "warning"
        );

        return;
      }

      showMessage(
        "All submissions shown here are already saved in MongoDB and available on the Editorial Review page.",
        "info"
      );
    };

    /*
      Display a Bootstrap alert using jQuery.
    */
    function showMessage(
      message,
      color
    ) {
      const messageBox =
        $("#messageBox");

      messageBox.text(message);

      messageBox.removeClass(
        "d-none " +
        "alert-success " +
        "alert-warning " +
        "alert-danger " +
        "alert-info"
      );

      messageBox.addClass(
        "alert alert-" + color
      );

      setTimeout(function () {
        messageBox.addClass(
          "d-none"
        );
      }, 5000);
    }
  }
);