const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    category: { type: String, required: true, trim: true },
    format: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    wordCount: { type: Number, default: 0, min: 0 },
    image: { type: String, default: "images/oracle-ai-erp.svg" },
    active: { type: Boolean, default: true }
  },
  { timestamps: true, collection: "products" }
);

module.exports = mongoose.model("Product", productSchema);
