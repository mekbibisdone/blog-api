import mongoose, { Types } from "mongoose";

export interface IBlog extends Document {
  _id: Types.ObjectId;
  title: string;
  content: string;
  timestamp: string;
  published: boolean;
  editedOn: string;
  comments: Types.ObjectId[];
}

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: String, required: true },
  published: { type: Boolean, required: true },
  editedOn: { type: String, required: false },
  comments: [{ type: mongoose.Types.ObjectId, required: false }],
});

const blogModel = mongoose.model<IBlog>("Blog", blogSchema);

export default blogModel;
