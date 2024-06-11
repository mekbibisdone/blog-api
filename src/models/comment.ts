import mongoose, { Types } from "mongoose";

export interface IComment extends Document {
  _id: Types.ObjectId;
  content: string;
  timestamp: string;
  user: Types.ObjectId;
}

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  timestamp: { type: String, required: true },
  user: { type: Types.ObjectId, ref: "User", required: true },
  editedOn: { type: String, required: false },
});

const commentModel = mongoose.model<IComment>("Comment", commentSchema);

export default commentModel;
