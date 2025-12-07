// models/Document.js
import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  application_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application", 
    required: true,
  },
  requirement_name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Submitted", "Approved", "Rejected"],
    default: "Pending",
  },
  file_url: {
    type: String,
    required: false,
  },
  uploaded_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Document", DocumentSchema);
