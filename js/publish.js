// This file controls the Publish Options page.
//
// AngularJS manages the form state, submission history, and service calls.
// jQuery loads saved articles from localStorage into the article dropdown.
// JavaScript performs client-side field validation before submission.
// jQuery's $.ajax() sends the JSON payload to the Node.js RESTful API endpoint.

// ANGULARJS APPLICATION
const publishApp = angular.module("publishApp", []);

publishApp.controller("PublishController", function($scope, $http) {

  // STATE - AngularJS keeps track of all page data here.

  // The list of articles available to publish.
  // jQuery will populate this from localStorage after the page loads.
  $scope.availableArticles = [];

  // The current form values, bound to inputs via ng-model.
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

  // Validation error flags - set to true by validateForm() when a field is missing.
  $scope.fieldErrors = {};

  // Whether to show the green success banner.
  $scope.submitSuccess = false;

  // The list of completed submissions shown in the sidebar.
  $scope.submissions = [];

  // JQUERY - load saved articles from localStorage into the dropdown.
  // This connects the Publish page to the Content & Products page.
  $(document).ready(function() {
    const savedData = localStorage.getItem("simpleMagazineArticles");

    if (savedData !== null) {
      try {
        const parsed = JSON.parse(savedData);

        if (Array.isArray(parsed) && parsed.length > 0) {
          // Use $scope.$apply so AngularJS picks up the jQuery change.
          $scope.$apply(function() {
            $scope.availableArticles = parsed;
          });
        }
      } catch (error) {
        console.error("Could not load articles from localStorage.", error);
      }
    }

    // If no articles exist in localStorage, add placeholder options
    // so the dropdown is not completely empty during a demo.
    if ($scope.availableArticles.length === 0) {
      $scope.$apply(function() {
        $scope.availableArticles = [
          { articleCode: "ART-001", title: "5 Digital Tools That Actually Save You Time" },
          { articleCode: "ART-002", title: "How to Build a Study Habit That Sticks" },
          { articleCode: "ART-003", title: "Meet the Neighbors Cleaning Up Riverside Park" }
        ];
      });
    }
  });

  // JAVASCRIPT VALIDATION - checks all required fields before submit.
  // Returns true if valid, false if any required field is missing.
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

    // At least one channel must be checked.
    const ch = $scope.formData.channels;
    if (!ch.web && !ch.email && !ch.social && !ch.print) {
      $scope.fieldErrors.channels = true;
      valid = false;
    }

    if (!$scope.formData.reviewStatus) {
      $scope.fieldErrors.reviewStatus = true;
      valid = false;
    }

    if (!$scope.formData.editorName || $scope.formData.editorName.trim() === "") {
      $scope.fieldErrors.editorName = true;
      valid = false;
    }

    // Simple email format check using a regular expression.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!$scope.formData.editorEmail || !emailPattern.test($scope.formData.editorEmail)) {
      $scope.fieldErrors.editorEmail = true;
      valid = false;
    }

    return valid;
  }

  // SUBMIT FORM - called by ng-click on the Submit button.
  // Validates, builds a JSON object, adds it to the submissions list.
  $scope.submitForm = function() {
    $scope.submitSuccess = false;

    // Run JavaScript validation first.
    if (!validateForm()) {
      showMessage("Please fill in all required fields.", "danger");
      return;
    }

    // Build the JSON submission object.
    const submission = {
      submissionId: Date.now(),
      articleId: $scope.formData.articleId,
      publicationDate: $scope.formData.publicationDate ? String($scope.formData.publicationDate).split("T")[0] : "",
      channels: angular.copy($scope.formData.channels),
      reviewStatus: $scope.formData.reviewStatus,
      editorName: $scope.formData.editorName.trim(),
      editorEmail: $scope.formData.editorEmail.trim(),
      editorialNotes: $scope.formData.editorialNotes.trim(),
      submittedAt: new Date().toISOString()
    };

    // Add the submission to the AngularJS state array.
    $scope.submissions.push(submission);

    // Show success banner and clear the form.
    $scope.submitSuccess = true;
    showMessage("Article submitted for publication successfully.", "success");
    $scope.resetForm();
  };

  // RESET FORM - clears all fields and error flags.
  $scope.resetForm = function() {
    $scope.formData = {
      articleId: "",
      publicationDate: "",
      channels: { web: false, email: false, social: false, print: false },
      reviewStatus: "",
      editorName: "",
      editorEmail: "",
      editorialNotes: ""
    };
    $scope.fieldErrors = {};
  };

  // REMOVE SUBMISSION - removes one entry from the sidebar list.
  $scope.removeSubmission = function(index) {
    $scope.submissions.splice(index, 1);
  };

  // AJAX - sends all submissions to the real Node.js RESTful API
  // built in editorial.js, using jQuery's $.ajax().
  // Each submission is sent as its own POST request to /api/submissions
  // so it lands in the Editorial Review queue as a Pending item.
  // jQuery owns the AJAX call itself; AngularJS still owns the page state,
  // so $scope.$apply() is used to bring jQuery's async result back into Angular.
  $scope.sendToApi = function() {
    if ($scope.submissions.length === 0) {
      showMessage("No submissions to send.", "warning");
      return;
    }

    // Build one AJAX request per submission, shaped to match what the
    // Node.js backend's normalizeSubmission() function expects.
    const sendPromises = $scope.submissions.map(function(submission) {
      const payload = {
        articleId: submission.articleId,
        articleCode: submission.articleId,
        articleTitle: submission.articleId,
        publicationDate: submission.publicationDate,
        channels: submission.channels,
        editorName: submission.editorName,
        editorEmail: submission.editorEmail,
        editorialNotes: submission.editorialNotes,
        status: "Pending"
      };

      // jQuery $.ajax() POST - sends the JSON payload to the Node.js
      // REST endpoint created in editorial.js.
      return $.ajax({
        url: "/api/submissions",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload)
      });
    });

    // Wait for every submission to finish sending before updating the page.
    $.when.apply($, sendPromises)
      .done(function() {
        $scope.$apply(function() {
          showMessage(
            "All submissions were sent to the editorial review queue successfully!",
            "success"
          );
          $scope.submissions = [];
        });
      })
      .fail(function(jqXHR) {
        $scope.$apply(function() {
          let message = "Some submissions could not be sent. Make sure the Node.js server is running (node js/editorial.js).";

          if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
            message = jqXHR.responseJSON.message;
          }

          showMessage(message, "danger");
        });
      });
  };

  // SHOW MESSAGE - displays an alert banner using jQuery.
  function showMessage(message, color) {
    const $box = $("#messageBox");
    $box.text(message);
    $box.removeClass("d-none alert-success alert-warning alert-danger alert-info");
    $box.addClass("alert alert-" + color);

    setTimeout(function() {
      $box.addClass("d-none");
    }, 4000);
  }

});
