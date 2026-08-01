require("dotenv").config();

const path = require("path");
const crypto = require("crypto");
const express = require("express");
const mongoose = require("mongoose");

const connectDatabase = require("./config/database");
const defaultProducts = require("./data/products");
const Product = require("./models/Product");
const ShoppingCart = require("./models/ShoppingCart");
const Shipping = require("./models/Shipping");
const Billing = require("./models/Billing");
const ReturnRequest = require("./models/ReturnRequest");
const Submission = require("./models/Submission");

const app = express();
const port = Number(process.env.PORT) || 3000;
const publicDirectory = path.join(__dirname, "public");

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

function createPublicId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

function asyncRoute(handler) {
  return function routeHandler(request, response, next) {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

function productJson(product) {
  const object = product.toObject ? product.toObject() : product;
  return {
    ...object,
    id: object.productId
  };
}

function cartJson(cart) {
  const object = cart.toObject ? cart.toObject() : cart;
  return {
    ...object,
    items: (object.items || []).map((item) => ({
      ...item,
      id: item.productId
    }))
  };
}

async function seedProducts() {
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany(defaultProducts);
    console.log(`Seeded ${defaultProducts.length} products into MongoDB.`);
  }
}

// ---------------------------------------------------------------------------
// PRODUCTS COLLECTION - complete CRUD
// ---------------------------------------------------------------------------
app.get(
  "/api/products",
  asyncRoute(async (request, response) => {
    const query = request.query.includeInactive === "true" ? {} : { active: true };
    const products = await Product.find(query).sort({ productId: 1 });
    response.json(products.map(productJson));
  })
);

app.get(
  "/api/products/:productId",
  asyncRoute(async (request, response) => {
    const product = await Product.findOne({
      productId: request.params.productId.toUpperCase()
    });

    if (!product) {
      return response.status(404).json({ message: "Product not found." });
    }

    response.json(productJson(product));
  })
);

app.post(
  "/api/products",
  asyncRoute(async (request, response) => {
    const product = await Product.create({
      productId: request.body.productId || request.body.id,
      title: request.body.title,
      description: request.body.description || "",
      category: request.body.category,
      format: request.body.format,
      price: request.body.price,
      wordCount: request.body.wordCount || 0,
      image: request.body.image || "images/oracle-ai-erp.svg",
      active: request.body.active !== false
    });

    response.status(201).json(productJson(product));
  })
);

app.patch(
  "/api/products/:productId",
  asyncRoute(async (request, response) => {
    const update = { ...request.body };
    delete update._id;
    delete update.id;
    delete update.productId;

    const product = await Product.findOneAndUpdate(
      { productId: request.params.productId.toUpperCase() },
      update,
      { new: true, runValidators: true }
    );

    if (!product) {
      return response.status(404).json({ message: "Product not found." });
    }

    response.json(productJson(product));
  })
);

app.put(
  "/api/products/:productId",
  asyncRoute(async (request, response) => {
    const product = await Product.findOneAndUpdate(
      { productId: request.params.productId.toUpperCase() },
      {
        productId: request.params.productId,
        title: request.body.title,
        description: request.body.description || "",
        category: request.body.category,
        format: request.body.format,
        price: request.body.price,
        wordCount: request.body.wordCount || 0,
        image: request.body.image || "images/oracle-ai-erp.svg",
        active: request.body.active !== false
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      return response.status(404).json({ message: "Product not found." });
    }

    response.json(productJson(product));
  })
);

app.delete(
  "/api/products/:productId",
  asyncRoute(async (request, response) => {
    const product = await Product.findOneAndDelete({
      productId: request.params.productId.toUpperCase()
    });

    if (!product) {
      return response.status(404).json({ message: "Product not found." });
    }

    response.json({ message: "Product deleted.", product: productJson(product) });
  })
);

// ---------------------------------------------------------------------------
// SHOPPING CART COLLECTION - complete CRUD plus item operations
// ---------------------------------------------------------------------------
app.get(
  "/api/shopping-carts",
  asyncRoute(async (request, response) => {
    const carts = await ShoppingCart.find().sort({ updatedAt: -1 });
    response.json(carts.map(cartJson));
  })
);

app.post(
  "/api/shopping-carts",
  asyncRoute(async (request, response) => {
    const cart = new ShoppingCart({
      cartId: request.body.cartId || createPublicId("CART"),
      items: request.body.items || [],
      status: request.body.status || "Active"
    });
    cart.recalculate();
    await cart.save();
    response.status(201).json(cartJson(cart));
  })
);

app.get(
  "/api/shopping-carts/:cartId",
  asyncRoute(async (request, response) => {
    const cart = await ShoppingCart.findOneAndUpdate(
      { cartId: request.params.cartId },
      { $setOnInsert: { cartId: request.params.cartId, items: [], subtotal: 0 } },
      { new: true, upsert: true, runValidators: true }
    );
    response.json(cartJson(cart));
  })
);

// Backward-compatible alias for older storefront code.
app.get("/api/cart/:cartId", (request, response) => {
  response.redirect(
    307,
    `/api/shopping-carts/${encodeURIComponent(request.params.cartId)}`
  );
});

app.patch(
  "/api/shopping-carts/:cartId",
  asyncRoute(async (request, response) => {
    const allowed = {};
    if (request.body.status !== undefined) allowed.status = request.body.status;
    if (request.body.items !== undefined) allowed.items = request.body.items;

    const cart = await ShoppingCart.findOne({ cartId: request.params.cartId });
    if (!cart) {
      return response.status(404).json({ message: "Shopping cart not found." });
    }

    Object.assign(cart, allowed);
    cart.recalculate();
    await cart.save();
    response.json(cartJson(cart));
  })
);

app.delete(
  "/api/shopping-carts/:cartId",
  asyncRoute(async (request, response) => {
    const cart = await ShoppingCart.findOneAndDelete({ cartId: request.params.cartId });
    if (!cart) {
      return response.status(404).json({ message: "Shopping cart not found." });
    }
    response.json({ message: "Shopping cart deleted.", cart: cartJson(cart) });
  })
);

app.post(
  "/api/shopping-carts/:cartId/items",
  asyncRoute(async (request, response) => {
    const productId = String(request.body.productId || request.body.id || "").toUpperCase();
    const quantity = Math.max(1, Number(request.body.quantity) || 1);
    const product = await Product.findOne({ productId, active: true });

    if (!product) {
      return response.status(404).json({ message: "Product not found." });
    }

    let cart = await ShoppingCart.findOne({ cartId: request.params.cartId });
    if (!cart) {
      cart = new ShoppingCart({ cartId: request.params.cartId, items: [] });
    }

    const existingItem = cart.items.find((item) => item.productId === product.productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId: product.productId,
        title: product.title,
        description: product.description,
        category: product.category,
        format: product.format,
        price: product.price,
        quantity
      });
    }

    cart.status = "Active";
    cart.recalculate();
    await cart.save();
    response.status(201).json(cartJson(cart));
  })
);

app.patch(
  "/api/shopping-carts/:cartId/items/:productId",
  asyncRoute(async (request, response) => {
    const cart = await ShoppingCart.findOne({ cartId: request.params.cartId });
    if (!cart) {
      return response.status(404).json({ message: "Shopping cart not found." });
    }

    const item = cart.items.find(
      (cartItem) => cartItem.productId === request.params.productId.toUpperCase()
    );
    if (!item) {
      return response.status(404).json({ message: "Cart item not found." });
    }

    item.quantity = Math.max(1, Number(request.body.quantity) || 1);
    cart.recalculate();
    await cart.save();
    response.json(cartJson(cart));
  })
);

app.delete(
  "/api/shopping-carts/:cartId/items/:productId",
  asyncRoute(async (request, response) => {
    const cart = await ShoppingCart.findOne({ cartId: request.params.cartId });
    if (!cart) {
      return response.status(404).json({ message: "Shopping cart not found." });
    }

    const beforeCount = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.productId !== request.params.productId.toUpperCase()
    );

    if (cart.items.length === beforeCount) {
      return response.status(404).json({ message: "Cart item not found." });
    }

    cart.recalculate();
    await cart.save();
    response.json(cartJson(cart));
  })
);

// Backward-compatible aliases for older storefront code.
app.post("/api/cart/:cartId/items", (request, response) => {
  response.redirect(
    307,
    `/api/shopping-carts/${encodeURIComponent(request.params.cartId)}/items`
  );
});
app.delete("/api/cart/:cartId/items/:productId", (request, response) => {
  response.redirect(
    307,
    `/api/shopping-carts/${encodeURIComponent(request.params.cartId)}/items/${encodeURIComponent(request.params.productId)}`
  );
});
app.delete("/api/cart/:cartId", (request, response) => {
  response.redirect(
    307,
    `/api/shopping-carts/${encodeURIComponent(request.params.cartId)}`
  );
});

// ---------------------------------------------------------------------------
// SHIPPING COLLECTION - complete CRUD
// ---------------------------------------------------------------------------
app.get(
  "/api/shipping",
  asyncRoute(async (request, response) => {
    response.json(await Shipping.find().sort({ createdAt: -1 }));
  })
);

app.get(
  "/api/shipping/:shippingId",
  asyncRoute(async (request, response) => {
    const record = await Shipping.findOne({ shippingId: request.params.shippingId });
    if (!record) return response.status(404).json({ message: "Shipping record not found." });
    response.json(record);
  })
);

app.post(
  "/api/shipping",
  asyncRoute(async (request, response) => {
    const method = request.body.method || request.body.shippingMethod;
    const cost = method === "Express shipping" ? 9.99 : method === "Standard shipping" ? 4.99 : 0;

    const record = await Shipping.create({
      shippingId: createPublicId("SHP"),
      cartId: request.body.cartId,
      fullName: request.body.fullName,
      email: request.body.email,
      address: request.body.address,
      method,
      cost,
      status: request.body.status || "Pending"
    });

    response.status(201).json(record);
  })
);

app.patch(
  "/api/shipping/:shippingId",
  asyncRoute(async (request, response) => {
    const record = await Shipping.findOneAndUpdate(
      { shippingId: request.params.shippingId },
      request.body,
      { new: true, runValidators: true }
    );
    if (!record) return response.status(404).json({ message: "Shipping record not found." });
    response.json(record);
  })
);

app.delete(
  "/api/shipping/:shippingId",
  asyncRoute(async (request, response) => {
    const record = await Shipping.findOneAndDelete({ shippingId: request.params.shippingId });
    if (!record) return response.status(404).json({ message: "Shipping record not found." });
    response.json({ message: "Shipping record deleted.", shipping: record });
  })
);

// ---------------------------------------------------------------------------
// BILLING COLLECTION - complete CRUD
// ---------------------------------------------------------------------------
app.get(
  "/api/billing",
  asyncRoute(async (request, response) => {
    response.json(await Billing.find().sort({ createdAt: -1 }));
  })
);

app.get(
  "/api/billing/:confirmationNumber",
  asyncRoute(async (request, response) => {
    const record = await Billing.findOne({ confirmationNumber: request.params.confirmationNumber });
    if (!record) return response.status(404).json({ message: "Billing record not found." });
    response.json(record);
  })
);

app.post(
  "/api/billing",
  asyncRoute(async (request, response) => {
    const cart = await ShoppingCart.findOne({ cartId: request.body.cartId });
    const shipping = await Shipping.findOne({ shippingId: request.body.shippingId });

    if (!cart || cart.items.length === 0) {
      return response.status(400).json({ message: "The database shopping cart is empty." });
    }
    if (!shipping) {
      return response.status(400).json({ message: "A valid shipping record is required." });
    }

    const subtotal = Number(cart.subtotal.toFixed(2));
    const shippingCost = Number(shipping.cost.toFixed(2));
    const total = Number((subtotal + shippingCost).toFixed(2));

    const record = await Billing.create({
      confirmationNumber: createPublicId("ORD"),
      cartId: cart.cartId,
      shippingId: shipping.shippingId,
      fullName: request.body.fullName,
      email: request.body.email,
      address: request.body.address,
      paymentMethod: request.body.paymentMethod,
      shippingMethod: shipping.method,
      items: cart.items,
      subtotal,
      shippingCost,
      total,
      status: request.body.status || "Paid"
    });

    cart.status = "Checked Out";
    await cart.save();
    response.status(201).json(record);
  })
);

app.patch(
  "/api/billing/:confirmationNumber",
  asyncRoute(async (request, response) => {
    const record = await Billing.findOneAndUpdate(
      { confirmationNumber: request.params.confirmationNumber },
      request.body,
      { new: true, runValidators: true }
    );
    if (!record) return response.status(404).json({ message: "Billing record not found." });
    response.json(record);
  })
);

app.delete(
  "/api/billing/:confirmationNumber",
  asyncRoute(async (request, response) => {
    const record = await Billing.findOneAndDelete({
      confirmationNumber: request.params.confirmationNumber
    });
    if (!record) return response.status(404).json({ message: "Billing record not found." });
    response.json({ message: "Billing record deleted.", billing: record });
  })
);

// ---------------------------------------------------------------------------
// RETURNS COLLECTION - complete CRUD
// ---------------------------------------------------------------------------
app.get(
  "/api/returns",
  asyncRoute(async (request, response) => {
    response.json(await ReturnRequest.find().sort({ createdAt: -1 }));
  })
);

app.get(
  "/api/returns/:returnId",
  asyncRoute(async (request, response) => {
    const record = await ReturnRequest.findOne({ returnId: request.params.returnId });
    if (!record) return response.status(404).json({ message: "Return request not found." });
    response.json(record);
  })
);

app.post(
  "/api/returns",
  asyncRoute(async (request, response) => {
    const sourceProduct = request.body.product || {};
    const record = await ReturnRequest.create({
      returnId: createPublicId("RET"),
      orderNumber: request.body.orderNumber,
      customerEmail: request.body.customerEmail,
      product: {
        productId: sourceProduct.productId || sourceProduct.id,
        name: sourceProduct.name || sourceProduct.title,
        image: sourceProduct.image || "",
        price: sourceProduct.price
      },
      reason: request.body.reason,
      condition: request.body.condition,
      details: request.body.details,
      status: request.body.status || "Received"
    });
    response.status(201).json(record);
  })
);

app.patch(
  "/api/returns/:returnId",
  asyncRoute(async (request, response) => {
    const record = await ReturnRequest.findOneAndUpdate(
      { returnId: request.params.returnId },
      request.body,
      { new: true, runValidators: true }
    );
    if (!record) return response.status(404).json({ message: "Return request not found." });
    response.json(record);
  })
);

app.delete(
  "/api/returns/:returnId",
  asyncRoute(async (request, response) => {
    const record = await ReturnRequest.findOneAndDelete({ returnId: request.params.returnId });
    if (!record) return response.status(404).json({ message: "Return request not found." });
    response.json({ message: "Return request deleted.", returnRequest: record });
  })
);

// ---------------------------------------------------------------------------
// EXISTING MAGAZINE EDITORIAL WORKFLOW - now also stored in MongoDB
// ---------------------------------------------------------------------------
app.get(
  "/api/submissions",
  asyncRoute(async (request, response) => {
    const submissions = await Submission.find().sort({ createdAt: -1 });
    response.json(
      submissions.map((submission) => ({
        ...submission.toObject(),
        id: submission.submissionId,
        submittedAt: submission.createdAt
      }))
    );
  })
);

app.post(
  "/api/submissions",
  asyncRoute(async (request, response) => {
    const submission = await Submission.create({
      submissionId: String(request.body.submissionId || createPublicId("SUB")),
      articleId: request.body.articleId || request.body.articleCode,
      articleCode: request.body.articleCode || request.body.articleId,
      articleTitle: request.body.articleTitle || request.body.title || request.body.articleId,
      publicationDate: request.body.publicationDate || "",
      channels: request.body.channels || {},
      editorName: request.body.editorName,
      editorEmail: request.body.editorEmail,
      editorialNotes: request.body.editorialNotes || "",
      status: request.body.status || "Pending"
    });
    response.status(201).json({
      ...submission.toObject(),
      id: submission.submissionId,
      submittedAt: submission.createdAt
    });
  })
);

app.patch(
  "/api/submissions/:submissionId",
  asyncRoute(async (request, response) => {
    const update = { ...request.body };
    if (update.status && update.status !== "Pending") {
      update.reviewedAt = new Date();
    }
    const submission = await Submission.findOneAndUpdate(
      { submissionId: request.params.submissionId },
      update,
      { new: true, runValidators: true }
    );
    if (!submission) return response.status(404).json({ message: "Submission not found." });
    response.json({
      ...submission.toObject(),
      id: submission.submissionId,
      submittedAt: submission.createdAt
    });
  })
);

app.delete(
  "/api/submissions/:submissionId",
  asyncRoute(async (request, response) => {
    const submission = await Submission.findOneAndDelete({
      submissionId: request.params.submissionId
    });
    if (!submission) return response.status(404).json({ message: "Submission not found." });
    response.json({ message: "Submission deleted." });
  })
);

app.get("/api/health", (request, response) => {
  response.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

app.use(express.static(publicDirectory));

app.get("/", (request, response) => {
  response.sendFile(path.join(publicDirectory, "index.html"));
});

app.use((request, response) => {
  if (request.path.startsWith("/api/")) {
    return response.status(404).json({ message: "API endpoint not found." });
  }
  response.status(404).sendFile(path.join(publicDirectory, "index.html"));
});

app.use((error, request, response, next) => {
  console.error(error);

  if (error.code === 11000) {
    return response.status(409).json({
      message: "A record with that unique ID already exists.",
      fields: error.keyValue
    });
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    return response.status(400).json({ message: error.message });
  }

  response.status(500).json({ message: "Internal server error." });
});

async function startServer() {
  try {
    await connectDatabase();
    await seedProducts();

    app.listen(port, () => {
      console.log(`Express server running at http://localhost:${port}`);
      console.log(`Storefront: http://localhost:${port}/cart.html`);
      console.log(`Database API health: http://localhost:${port}/api/health`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, seedProducts };
