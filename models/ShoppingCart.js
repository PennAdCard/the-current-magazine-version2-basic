const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, default: "" },
    format: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, default: 1, min: 1 }
  },
  { _id: false }
);

const shoppingCartSchema = new mongoose.Schema(
  {
    cartId: { type: String, required: true, unique: true, trim: true },
    items: { type: [cartItemSchema], default: [] },
    subtotal: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["Active", "Checked Out", "Abandoned"],
      default: "Active"
    }
  },
  { timestamps: true, collection: "shopping_carts" }
);

shoppingCartSchema.methods.recalculate = function recalculate() {
  this.subtotal = Number(
    this.items
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
      .toFixed(2)
  );
};

module.exports = mongoose.model("ShoppingCart", shoppingCartSchema);
