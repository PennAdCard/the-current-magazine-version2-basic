const mongoose = require("mongoose");

const billingAddressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true, uppercase: true },
    zip: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const billingItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    title: { type: String, required: true },
    format: { type: String, default: "" },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1, min: 1 }
  },
  { _id: false }
);

const billingSchema = new mongoose.Schema(
  {
    confirmationNumber: { type: String, required: true, unique: true },
    cartId: { type: String, required: true },
    shippingId: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    address: { type: billingAddressSchema, required: true },
    paymentMethod: {
      type: {
        type: String,
        required: true,
        default: "Credit card"
      },
      lastFour: { type: String, required: true, minlength: 4, maxlength: 4 },
      expiration: { type: String, required: true }
    },
    shippingMethod: { type: String, required: true },
    items: { type: [billingItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Paid", "Refunded", "Cancelled"],
      default: "Paid"
    }
  },
  { timestamps: true, collection: "billing" }
);

module.exports = mongoose.model("Billing", billingSchema);
