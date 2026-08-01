const mongoose = require("mongoose");

const returnRequestSchema = new mongoose.Schema(
  {
    returnId: { type: String, required: true, unique: true },
    orderNumber: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    product: {
      productId: { type: String, required: true },
      name: { type: String, required: true },
      image: { type: String, default: "" },
      price: { type: Number, required: true, min: 0 }
    },
    reason: { type: String, required: true },
    condition: { type: String, required: true },
    details: { type: String, required: true, minlength: 10 },
    status: {
      type: String,
      enum: ["Received", "Approved", "Rejected", "Completed", "Cancelled"],
      default: "Received"
    }
  },
  { timestamps: true, collection: "returns" }
);

module.exports = mongoose.model("ReturnRequest", returnRequestSchema);
