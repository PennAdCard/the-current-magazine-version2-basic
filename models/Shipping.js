const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true, uppercase: true },
    zip: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const shippingSchema = new mongoose.Schema(
  {
    shippingId: { type: String, required: true, unique: true },
    cartId: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    address: { type: addressSchema, required: true },
    method: { type: String, required: true },
    cost: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Pending", "Prepared", "Shipped", "Delivered", "Cancelled"],
      default: "Pending"
    }
  },
  { timestamps: true, collection: "shipping" }
);

module.exports = mongoose.model("Shipping", shippingSchema);
