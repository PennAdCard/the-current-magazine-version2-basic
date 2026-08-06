const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    submissionId: { type: String, required: true, unique: true },
    articleId: { type: String, required: true },
    articleCode: { type: String, default: "" },
    articleTitle: { type: String, default: "" },
    publicationDate: { type: String, default: "" },
    channels: {
      web: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
      social: { type: Boolean, default: false },
      print: { type: Boolean, default: false }
    },
    editorName: { type: String, required: true },
    editorEmail: { type: String, required: true, match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address."] },
    editorialNotes: { type: String, default: "" },
    reviewNotes: { type: String, default: "" },
    editorNotes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "In Review", "Approved", "Rejected", "Revision Requested", "Ready to Publish"],
      default: "Pending"
    },
    reviewedAt: { type: Date }
  },
  { timestamps: true, collection: "editorial_submissions" }
);

module.exports = mongoose.model("Submission", submissionSchema);
