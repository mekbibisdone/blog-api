import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: String, required: true },
  published: { type: Boolean, required: true },
  editedOn: {type: String, required: false},
  comments: [{ type: mongoose.Types.ObjectId, required: false }],
});

const blogModel = mongoose.model("Blog", blogSchema);

export default blogModel;