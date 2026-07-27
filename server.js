const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const root = __dirname;
const port = 3000;

/*
  Product data used by the Returns page.
*/
const products = [
  {
    id: "PRD-001",
    title: "Technology Monthly — Digital Edition",
    category: "Technology",
    price: 2.99,
    image: "images/product-technology.svg"
  },
  {
    id: "PRD-002",
    title: "Learning Guide: Study Habits",
    category: "Learning",
    price: 0,
    image: "images/product-learning.svg"
  },
  {
    id: "PRD-003",
    title: "Community Spotlight Collection",
    category: "Community",
    price: 1.99,
    image: "images/product-community.svg"
  },
  {
    id: "PRD-004",
    title: "Understanding AI Without the Jargon",
    category: "Technology",
    price: 1.99,
    image: "images/product-ai.svg"
  },
  {
    id: "PRD-005",
    title: "Free Resources for Adult Learners",
    category: "Learning",
    price: 0,
    image: "images/product-resources.svg"
  },
  {
    id: "PRD-006",
    title: "Health & Wellness Feature Pack",
    category: "Health",
    price: 2.49,
    image: "images/product-health.svg"
  }
];

/*
  JSON files used for simple file-based storage.
*/
const billingFile = path.join(
  root,
  "billing-details.json"
);

const returnsFile = path.join(
  root,
  "returns.json"
);

/*
  Reads a JSON file.

  If the file does not exist or contains invalid JSON,
  an empty array is returned.
*/
function readJson(file) {
  try {
    const fileContents = fs.readFileSync(
      file,
      "utf8"
    );

    return JSON.parse(
      fileContents || "[]"
    );
  } catch (error) {
    return [];
  }
}

/*
  Saves data to a JSON file.
*/
function writeJson(file, data) {
  fs.writeFileSync(
    file,
    JSON.stringify(data, null, 2)
  );
}

/*
  Sends a JSON response.
*/
function send(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type":
      "application/json; charset=utf-8"
  });

  response.end(
    JSON.stringify(data, null, 2)
  );
}

/*
  Reads and parses the JSON request body.
*/
function body(request) {
  return new Promise(
    function (resolve, reject) {
      let requestBody = "";

      request.on(
        "data",
        function (chunk) {
          requestBody += chunk;

          /*
            Prevent excessively large requests.
          */
          if (requestBody.length > 1000000) {
            reject(
              new Error("Request too large")
            );
          }
        }
      );

      request.on(
        "end",
        function () {
          try {
            const parsedBody = JSON.parse(
              requestBody || "{}"
            );

            resolve(parsedBody);
          } catch (error) {
            reject(
              new Error("Invalid JSON")
            );
          }
        }
      );

      request.on(
        "error",
        reject
      );
    }
  );
}

/*
  Serves HTML, CSS, JavaScript, JSON, and image files
  from the project folder.
*/
function staticFile(requestPath, response) {
  let requestedPath =
    requestPath === "/"
      ? "/index.html"
      : decodeURIComponent(requestPath);

  const filePath = path.resolve(
    root,
    "." + requestedPath
  );

  /*
    Prevent users from accessing files outside
    the project folder.
  */
  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(
    filePath,
    function (error, fileData) {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      const extension =
        path.extname(filePath);

      const contentTypes = {
        ".html":
          "text/html; charset=utf-8",

        ".css":
          "text/css; charset=utf-8",

        ".js":
          "application/javascript; charset=utf-8",

        ".json":
          "application/json; charset=utf-8",

        ".svg":
          "image/svg+xml",

        ".png":
          "image/png",

        ".jpg":
          "image/jpeg"
      };

      const contentType =
        contentTypes[extension] ||
        "application/octet-stream";

      response.writeHead(200, {
        "Content-Type": contentType
      });

      response.end(fileData);
    }
  );
}

/*
  Creates the HTTP server.
*/
http
  .createServer(
    async function (request, response) {
      const pathname =
        url.parse(request.url).pathname;

      /*
        GET /api/products

        Returns the product list for the Returns page.
      */
      if (
        request.method === "GET" &&
        pathname === "/api/products"
      ) {
        send(
          response,
          200,
          products
        );

        return;
      }

      /*
        POST /api/billing

        Receives billing details from billing.js,
        validates required data, and saves the order.
      */
      if (
        request.method === "POST" &&
        pathname === "/api/billing"
      ) {
        try {
          const billingData =
            await body(request);

          if (
            !billingData.fullName ||
            !billingData.email ||
            !billingData.address ||
            !Array.isArray(billingData.items)
          ) {
            send(response, 400, {
              message:
                "Required billing data is missing."
            });

            return;
          }

          const billingRecords =
            readJson(billingFile);

          const savedBilling = {
            confirmationNumber:
              "ORD-" + Date.now(),

            receivedAt:
              new Date().toISOString(),

            ...billingData
          };

          billingRecords.push(
            savedBilling
          );

          writeJson(
            billingFile,
            billingRecords
          );

          send(
            response,
            201,
            savedBilling
          );

          return;
        } catch (error) {
          send(response, 400, {
            message: error.message
          });

          return;
        }
      }

      /*
        POST /api/returns

        Receives and saves a new return request.
      */
      if (
        request.method === "POST" &&
        pathname === "/api/returns"
      ) {
        try {
          const returnData =
            await body(request);

          if (
            !returnData.orderNumber ||
            !returnData.customerEmail ||
            !returnData.product ||
            !returnData.reason ||
            !returnData.condition
          ) {
            send(response, 400, {
              message:
                "Required return data is missing."
            });

            return;
          }

          const returnRecords =
            readJson(returnsFile);

          const savedReturn = {
            returnId:
              "RET-" + Date.now(),

            status:
              "Received",

            submittedAt:
              new Date().toISOString(),

            ...returnData
          };

          returnRecords.push(
            savedReturn
          );

          writeJson(
            returnsFile,
            returnRecords
          );

          send(
            response,
            201,
            savedReturn
          );

          return;
        } catch (error) {
          send(response, 400, {
            message: error.message
          });

          return;
        }
      }

      /*
        GET /api/returns

        Returns all saved return requests.
      */
      if (
        request.method === "GET" &&
        pathname === "/api/returns"
      ) {
        send(
          response,
          200,
          readJson(returnsFile)
        );

        return;
      }

      /*
        Normal website files.
      */
      if (request.method === "GET") {
        staticFile(
          pathname,
          response
        );

        return;
      }

      /*
        Unsupported request method.
      */
      send(response, 405, {
        message:
          "Method not allowed"
      });
    }
  )

  .listen(
    port,
    function () {
      console.log(
        "Simple Magazine storefront running at " +
        "http://localhost:" +
        port
      );

      console.log(
        "Billing: http://localhost:" +
        port +
        "/billing.html"
      );

      console.log(
        "Returns: http://localhost:" +
        port +
        "/returns.html"
      );
    }
  );