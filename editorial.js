/*
  ============================================================
  SIMPLE MAGAZINE EDITORIAL REVIEW
  ============================================================

  Save this file as:

  js/editorial.js

  Run the project from the main project folder with:

  node js/editorial.js

  Then open:

  http://localhost:3000/editorial.html

  This file contains two sections:

  1. Browser-side AngularJS editorial review application
  2. Node.js RESTful backend and static website server
*/


/*
  ============================================================
  BROWSER-SIDE ANGULARJS APPLICATION
  ============================================================

  This section runs only when editorial.js is loaded by a
  browser through editorial.html.
*/

if (typeof window !== "undefined") {
  const editorialApp = angular.module("editorialApp", []);

  editorialApp.controller(
    "EditorialController",
    function($scope, $http) {

      /*
        REST endpoint used for retrieving and updating
        article submissions.
      */
      const apiUrl = "/api/submissions";

      /*
        Page state.
      */
      $scope.submissions = [];
      $scope.searchText = "";
      $scope.statusFilter = "";
      $scope.isLoading = false;
      $scope.loadError = "";
      $scope.selectedSubmission = {};

      /*
        LOAD SUBMISSIONS

        Sends an AJAX GET request to the Node.js backend.

        The returned JSON list is stored in the AngularJS
        submissions array. AngularJS then dynamically renders
        the submission cards in editorial.html.
      */
      $scope.loadSubmissions = function() {
        $scope.isLoading = true;
        $scope.loadError = "";

        $http.get(apiUrl)
          .then(function(response) {
            /*
              Make sure the server returned an array.
            */
            if (Array.isArray(response.data)) {
              $scope.submissions = response.data.map(
                function(submission) {

                  /*
                    Normalize older or missing values so the
                    page can work with different submission
                    object formats.
                  */
                  submission.status =
                    submission.status || "Pending";

                  submission.channels =
                    submission.channels || {};

                  submission.reviewInput =
                    submission.reviewNotes ||
                    submission.editorNotes ||
                    "";

                  submission.isUpdating = false;

                  return submission;
                }
              );
            } else {
              $scope.submissions = [];
            }
          })
          .catch(function(error) {
            $scope.submissions = [];

            if (
              error.data &&
              error.data.message
            ) {
              $scope.loadError =
                error.data.message;
            } else {
              $scope.loadError =
                "The editorial submissions could not be loaded. " +
                "Make sure the Node.js server is running.";
            }
          })
          .finally(function() {
            $scope.isLoading = false;
          });
      };

      /*
        UPDATE STATUS

        Sends an AJAX PATCH request to update one submission.

        Valid status values:

        Approved
        Rejected
        Revision Requested
      */
      $scope.updateStatus = function(
        submission,
        newStatus
      ) {
        const reviewNotes = (
          submission.reviewInput || ""
        ).trim();

        /*
          Editorial notes are required when the editor rejects
          an article or requests revisions.
        */
        if (
          (
            newStatus === "Rejected" ||
            newStatus === "Revision Requested"
          ) &&
          reviewNotes === ""
        ) {
          showMessage(
            "Please enter editorial notes before choosing " +
            newStatus.toLowerCase() + ".",
            "warning"
          );

          return;
        }

        submission.isUpdating = true;

        /*
          JSON object sent to the Node.js REST endpoint.
        */
        const updateData = {
          status: newStatus,
          reviewNotes: reviewNotes,
          editorNotes: reviewNotes
        };

        /*
          Store the selected submission so its JSON appears
          in the technical information section.
        */
        $scope.selectedSubmission = {
          id: submission.id,
          status: newStatus,
          reviewNotes: reviewNotes
        };

        /*
          AngularJS $http performs the AJAX PATCH request.
        */
        $http.patch(
          apiUrl + "/" + encodeURIComponent(submission.id),
          updateData
        )
          .then(function(response) {
            const updatedSubmission = response.data;

            /*
              Update the visible card without refreshing
              the entire page.
            */
            submission.status =
              updatedSubmission.status;

            submission.reviewNotes =
              updatedSubmission.reviewNotes ||
              updatedSubmission.editorNotes ||
              "";

            submission.editorNotes =
              updatedSubmission.editorNotes ||
              updatedSubmission.reviewNotes ||
              "";

            submission.reviewedAt =
              updatedSubmission.reviewedAt;

            submission.reviewInput =
              submission.reviewNotes;

            $scope.selectedSubmission =
              updatedSubmission;

            showMessage(
              "The submission was updated to " +
              newStatus + ".",
              "success"
            );
          })
          .catch(function(error) {
            let message =
              "The editorial update could not be saved.";

            if (
              error.data &&
              error.data.message
            ) {
              message = error.data.message;
            }

            showMessage(message, "danger");
          })
          .finally(function() {
            submission.isUpdating = false;
          });
      };

      /*
        FILTER SUBMISSIONS

        AngularJS calls this function whenever the page updates.

        It filters by:

        - Article title
        - Article ID
        - Editor name
        - Editor email
        - Submission status
      */
      $scope.getFilteredSubmissions = function() {
        const searchValue = (
          $scope.searchText || ""
        ).trim().toLowerCase();

        return $scope.submissions.filter(
          function(submission) {
            const submissionStatus =
              submission.status || "Pending";

            const matchesStatus =
              !$scope.statusFilter ||
              submissionStatus ===
              $scope.statusFilter;

            const searchableText = [
              submission.id,
              submission.articleId,
              submission.articleCode,
              submission.articleTitle,
              submission.title,
              submission.editorName,
              submission.editorEmail,
              submission.author,
              submission.authorEmail,
              submission.category,
              submission.status
            ]
              .filter(function(value) {
                return value !== undefined &&
                       value !== null;
              })
              .join(" ")
              .toLowerCase();

            const matchesSearch =
              searchValue === "" ||
              searchableText.includes(searchValue);

            return matchesStatus && matchesSearch;
          }
        );
      };

      /*
        CLEAR FILTERS
      */
      $scope.clearFilters = function() {
        $scope.searchText = "";
        $scope.statusFilter = "";

        /*
          jQuery clears the visible search field.
        */
        $("#searchInput").val("");
      };

      /*
        COUNT SUBMISSIONS BY STATUS

        Used by the four summary boxes.
      */
      $scope.getStatusCount = function(status) {
        return $scope.submissions.filter(
          function(submission) {
            return submission.status === status;
          }
        ).length;
      };

      /*
        BOOTSTRAP STATUS BADGE CLASS
      */
      $scope.getStatusClass = function(status) {
        switch (status) {
          case "Approved":
          case "Ready to Publish":
            return "bg-success";

          case "Rejected":
            return "bg-danger";

          case "Revision Requested":
            return "bg-warning text-dark";

          case "In Review":
            return "bg-info text-dark";

          case "Pending":
          default:
            return "bg-primary";
        }
      };

      /*
        CHECK DISTRIBUTION CHANNELS

        Prevents the HTML from displaying an empty channel area.
      */
      $scope.hasChannels = function(submission) {
        if (!submission.channels) {
          return false;
        }

        return Boolean(
          submission.channels.web ||
          submission.channels.email ||
          submission.channels.social ||
          submission.channels.print
        );
      };

      /*
        FORMAT SUBMISSION DATE
      */
      $scope.formatDate = function(dateValue) {
        if (!dateValue) {
          return "Not available";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
          return dateValue;
        }

        return date.toLocaleString();
      };

      /*
        FORMAT PUBLICATION DATE
      */
      $scope.formatPublicationDate = function(dateValue) {
        if (!dateValue) {
          return "Not scheduled";
        }

        /*
          Add a local time to date-only values to prevent
          timezone changes from displaying the previous day.
        */
        const normalizedDate =
          /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
            ? dateValue + "T12:00:00"
            : dateValue;

        const date = new Date(normalizedDate);

        if (Number.isNaN(date.getTime())) {
          return dateValue;
        }

        return date.toLocaleDateString();
      };

      /*
        SHOW BOOTSTRAP MESSAGE

        jQuery controls the message box and scrolling behavior.
      */
      function showMessage(message, alertType) {
        const messageBox = $("#messageBox");

        messageBox
          .removeClass(
            "d-none " +
            "alert-success " +
            "alert-danger " +
            "alert-warning " +
            "alert-info"
          )
          .addClass("alert-" + alertType)
          .text(message);

        $("html, body").animate(
          {
            scrollTop:
              messageBox.offset().top - 90
          },
          250
        );

        window.setTimeout(function() {
          messageBox.addClass("d-none");
        }, 5000);
      }

      /*
        OPTIONAL JQUERY SEARCH INTERACTION

        AngularJS already uses ng-model on the search field.
        This event also demonstrates direct jQuery interaction,
        as requested by the assignment.
      */
      $(document).on(
        "input",
        "#searchInput",
        function() {
          const searchValue = $(this).val();

          $scope.$applyAsync(function() {
            $scope.searchText = searchValue;
          });
        }
      );

      /*
        Automatically retrieve submissions when the editorial
        review page first opens.
      */
      $scope.loadSubmissions();
    }
  );
}


/*
  ============================================================
  NODE.JS RESTFUL BACKEND
  ============================================================

  This section runs only when the file is started with Node.js:

  node js/editorial.js
*/

if (
  typeof module !== "undefined" &&
  module.exports &&
  typeof window === "undefined"
) {
  const http = require("http");
  const fs = require("fs");
  const path = require("path");
  const url = require("url");

  /*
    The JavaScript file is inside the js folder.

    __dirname points to:

    project-folder/js

    The project root is therefore one folder above it.
  */
  const projectRoot = path.resolve(
    __dirname,
    ".."
  );

  const submissionsFile = path.join(
    projectRoot,
    "submissions.json"
  );

  const port = 3000;

  /*
    MIME types used when serving the website's static files.
  */
  const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".webp": "image/webp"
  };

  /*
    CREATE STORAGE FILE

    Creates submissions.json automatically if it does not
    already exist.
  */
  function createStorageFile() {
    if (!fs.existsSync(submissionsFile)) {
      fs.writeFileSync(
        submissionsFile,
        JSON.stringify([], null, 2),
        "utf8"
      );
    }
  }

  /*
    READ SUBMISSIONS

    Reads the JSON document from submissions.json.
  */
  function readSubmissions() {
    createStorageFile();

    try {
      const fileContents = fs.readFileSync(
        submissionsFile,
        "utf8"
      );

      const parsedData = JSON.parse(
        fileContents || "[]"
      );

      if (!Array.isArray(parsedData)) {
        return [];
      }

      return parsedData;
    } catch (error) {
      console.error(
        "Could not read submissions.json:",
        error.message
      );

      return [];
    }
  }

  /*
    SAVE SUBMISSIONS

    Stores the updated array as formatted JSON.
  */
  function saveSubmissions(submissions) {
    fs.writeFileSync(
      submissionsFile,
      JSON.stringify(submissions, null, 2),
      "utf8"
    );
  }

  /*
    SEND JSON RESPONSE
  */
  function sendJson(
    response,
    statusCode,
    data
  ) {
    response.writeHead(statusCode, {
      "Content-Type":
        "application/json; charset=utf-8",

      "Access-Control-Allow-Origin": "*",

      "Access-Control-Allow-Methods":
        "GET, POST, PATCH, OPTIONS",

      "Access-Control-Allow-Headers":
        "Content-Type"
    });

    response.end(
      JSON.stringify(data, null, 2)
    );
  }

  /*
    SEND TEXT RESPONSE
  */
  function sendText(
    response,
    statusCode,
    message
  ) {
    response.writeHead(statusCode, {
      "Content-Type":
        "text/plain; charset=utf-8"
    });

    response.end(message);
  }

  /*
    READ JSON REQUEST BODY
  */
  function readJsonBody(request) {
    return new Promise(
      function(resolve, reject) {
        let body = "";

        request.on(
          "data",
          function(chunk) {
            body += chunk.toString();

            /*
              Limit request size to approximately one megabyte.
            */
            if (body.length > 1000000) {
              reject(
                new Error(
                  "The request body is too large."
                )
              );

              request.destroy();
            }
          }
        );

        request.on(
          "end",
          function() {
            try {
              const data =
                body.trim() === ""
                  ? {}
                  : JSON.parse(body);

              resolve(data);
            } catch (error) {
              reject(
                new Error(
                  "The request contains invalid JSON."
                )
              );
            }
          }
        );

        request.on(
          "error",
          function(error) {
            reject(error);
          }
        );
      }
    );
  }

  /*
    GENERATE UNIQUE SUBMISSION ID
  */
  function createSubmissionId() {
    return (
      "SUB-" +
      Date.now().toString() +
      "-" +
      Math.floor(
        Math.random() * 10000
      ).toString().padStart(4, "0")
    );
  }

  /*
    EMAIL VALIDATION
  */
  function isValidEmail(email) {
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailPattern.test(email);
  }

  /*
    VALIDATE NEW SUBMISSION

    The server accepts fields from the existing Publish Options
    page as well as more traditional article submission fields.
  */
  function validateNewSubmission(data) {
    const errors = [];

    const articleIdentifier =
      data.articleId ||
      data.articleCode ||
      data.articleTitle ||
      data.title;

    if (
      typeof articleIdentifier !== "string" ||
      articleIdentifier.trim() === ""
    ) {
      errors.push(
        "An article ID or article title is required."
      );
    }

    /*
      Validate the email only when one was supplied.
    */
    const contactEmail =
      data.editorEmail ||
      data.authorEmail ||
      "";

    if (
      contactEmail &&
      !isValidEmail(contactEmail.trim())
    ) {
      errors.push(
        "The submitted email address is invalid."
      );
    }

    return errors;
  }

  /*
    NORMALIZE SUBMISSION

    Converts fields from the existing Publish Options form into
    one consistent JSON structure for the editorial page.
  */
  function normalizeSubmission(data) {
    const channels =
      data.channels &&
      typeof data.channels === "object"
        ? data.channels
        : {
            web: Boolean(data.web),
            email: Boolean(data.email),
            social: Boolean(data.social),
            print: Boolean(data.print)
          };

    return {
      id:
        data.id ||
        createSubmissionId(),

      articleId:
        data.articleId ||
        data.articleCode ||
        "",

      articleCode:
        data.articleCode ||
        data.articleId ||
        "",

      articleTitle:
        data.articleTitle ||
        data.title ||
        data.articleId ||
        "Magazine Article",

      title:
        data.title ||
        data.articleTitle ||
        data.articleId ||
        "Magazine Article",

      author:
        data.author || "",

      authorEmail:
        data.authorEmail || "",

      category:
        data.category || "",

      publicationDate:
        data.publicationDate || "",

      editorName:
        data.editorName ||
        data.author ||
        "",

      editorEmail:
        data.editorEmail ||
        data.authorEmail ||
        "",

      channels: {
        web: Boolean(channels.web),
        email: Boolean(channels.email),
        social: Boolean(channels.social),
        print: Boolean(channels.print)
      },

      content:
        data.content ||
        data.contentSnippet ||
        "",

      contentSnippet:
        data.contentSnippet ||
        data.content ||
        "",

      editorialNotes:
        data.editorialNotes ||
        data.notes ||
        "",

      status:
        data.status || "Pending",

      reviewNotes:
        data.reviewNotes ||
        data.editorNotes ||
        "",

      editorNotes:
        data.editorNotes ||
        data.reviewNotes ||
        "",

      submittedAt:
        data.submittedAt ||
        new Date().toISOString(),

      reviewedAt:
        data.reviewedAt || null
    };
  }

  /*
    STATIC FILE SERVER

    Serves all current project pages, stylesheets, JavaScript,
    and images so the existing website navigation continues
    to work.
  */
  function serveStaticFile(
    pathname,
    response
  ) {
    let requestedPath = pathname;

    /*
      Opening the root URL loads index.html.
    */
    if (
      requestedPath === "/" ||
      requestedPath === ""
    ) {
      requestedPath = "/index.html";
    }

    /*
      Decode spaces and other encoded URL characters.
    */
    try {
      requestedPath =
        decodeURIComponent(requestedPath);
    } catch (error) {
      sendText(
        response,
        400,
        "The requested file path is invalid."
      );

      return;
    }

    /*
      Prevent access outside the project folder.
    */
    const safeRelativePath =
      requestedPath.replace(
        /^[/\\]+/,
        ""
      );

    const filePath = path.resolve(
      projectRoot,
      safeRelativePath
    );

    if (
      !filePath.startsWith(projectRoot)
    ) {
      sendText(
        response,
        403,
        "Access to this file is forbidden."
      );

      return;
    }

    fs.stat(
      filePath,
      function(statError, fileStats) {
        if (
          statError ||
          !fileStats.isFile()
        ) {
          sendText(
            response,
            404,
            "The requested page or file was not found."
          );

          return;
        }

        const extension =
          path.extname(filePath).toLowerCase();

        const contentType =
          mimeTypes[extension] ||
          "application/octet-stream";

        fs.readFile(
          filePath,
          function(readError, fileData) {
            if (readError) {
              sendText(
                response,
                500,
                "The requested file could not be opened."
              );

              return;
            }

            response.writeHead(200, {
              "Content-Type": contentType
            });

            response.end(fileData);
          }
        );
      }
    );
  }

  /*
    CREATE NODE.JS SERVER
  */
  const server = http.createServer(
    async function(request, response) {

      const parsedUrl = url.parse(
        request.url,
        true
      );

      const pathname = parsedUrl.pathname;

      /*
        CORS PREFLIGHT
      */
      if (request.method === "OPTIONS") {
        response.writeHead(204, {
          "Access-Control-Allow-Origin": "*",

          "Access-Control-Allow-Methods":
            "GET, POST, PATCH, OPTIONS",

          "Access-Control-Allow-Headers":
            "Content-Type"
        });

        response.end();
        return;
      }

      /*
        ======================================================
        GET /api/submissions
        ======================================================

        Returns the complete submission list.
      */
      if (
        request.method === "GET" &&
        pathname === "/api/submissions"
      ) {
        const submissions =
          readSubmissions();

        /*
          Display the newest submissions first.
        */
        submissions.sort(
          function(first, second) {
            return (
              new Date(second.submittedAt) -
              new Date(first.submittedAt)
            );
          }
        );

        sendJson(
          response,
          200,
          submissions
        );

        return;
      }

      /*
        ======================================================
        POST /api/submissions
        ======================================================

        Receives JSON from the existing Publish Options page
        and creates a new pending editorial submission.
      */
      if (
        request.method === "POST" &&
        pathname === "/api/submissions"
      ) {
        try {
          const requestData =
            await readJsonBody(request);

          const validationErrors =
            validateNewSubmission(requestData);

          if (validationErrors.length > 0) {
            sendJson(response, 400, {
              message:
                validationErrors.join(" "),

              errors:
                validationErrors
            });

            return;
          }

          const submissions =
            readSubmissions();

          const newSubmission =
            normalizeSubmission(requestData);

          /*
            All newly created submissions begin as Pending.
          */
          newSubmission.status = "Pending";
          newSubmission.reviewNotes = "";
          newSubmission.editorNotes = "";
          newSubmission.reviewedAt = null;
          newSubmission.submittedAt =
            new Date().toISOString();

          submissions.push(newSubmission);

          saveSubmissions(submissions);

          sendJson(
            response,
            201,
            newSubmission
          );
        } catch (error) {
          sendJson(response, 400, {
            message: error.message
          });
        }

        return;
      }

      /*
        ======================================================
        PATCH /api/submissions/:id
        ======================================================

        Updates the editorial status and notes for a submission.
      */
      if (
        request.method === "PATCH" &&
        pathname.startsWith(
          "/api/submissions/"
        )
      ) {
        try {
          const submissionId =
            decodeURIComponent(
              pathname.substring(
                "/api/submissions/".length
              )
            );

          const requestData =
            await readJsonBody(request);

          const allowedStatuses = [
            "Pending",
            "In Review",
            "Approved",
            "Rejected",
            "Revision Requested",
            "Ready to Publish"
          ];

          if (
            !allowedStatuses.includes(
              requestData.status
            )
          ) {
            sendJson(response, 400, {
              message:
                "The selected editorial status is invalid."
            });

            return;
          }

          const reviewNotes = (
            requestData.reviewNotes ||
            requestData.editorNotes ||
            ""
          ).trim();

          /*
            Notes are mandatory for negative or revision actions.
          */
          if (
            (
              requestData.status === "Rejected" ||
              requestData.status ===
                "Revision Requested"
            ) &&
            reviewNotes === ""
          ) {
            sendJson(response, 400, {
              message:
                "Editorial notes are required when " +
                "rejecting an article or requesting revisions."
            });

            return;
          }

          const submissions =
            readSubmissions();

          const submissionIndex =
            submissions.findIndex(
              function(submission) {
                return (
                  String(submission.id) ===
                  String(submissionId)
                );
              }
            );

          if (submissionIndex === -1) {
            sendJson(response, 404, {
              message:
                "The requested submission was not found."
            });

            return;
          }

          submissions[submissionIndex].status =
            requestData.status;

          submissions[submissionIndex].reviewNotes =
            reviewNotes;

          submissions[submissionIndex].editorNotes =
            reviewNotes;

          submissions[submissionIndex].reviewedAt =
            new Date().toISOString();

          saveSubmissions(submissions);

          sendJson(
            response,
            200,
            submissions[submissionIndex]
          );
        } catch (error) {
          sendJson(response, 400, {
            message: error.message
          });
        }

        return;
      }

      /*
        Any request that is not an API request is handled
        as a normal website file request.
      */
      if (request.method === "GET") {
        serveStaticFile(
          pathname,
          response
        );

        return;
      }

      /*
        Unsupported request method.
      */
      sendJson(response, 405, {
        message:
          "This request method is not supported."
      });
    }
  );

  /*
    CREATE STORAGE AND START SERVER
  */
  createStorageFile();

  server.listen(
    port,
    function() {
      console.log(
        "Simple Magazine server is running."
      );

      console.log(
        "Home page: http://localhost:" +
        port +
        "/index.html"
      );

      console.log(
        "Editorial page: http://localhost:" +
        port +
        "/editorial.html"
      );

      console.log(
        "REST endpoint: http://localhost:" +
        port +
        "/api/submissions"
      );
    }
  );
}