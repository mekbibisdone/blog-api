import mongoose from "mongoose";
import { Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  fullname: string;
  email: string;
  password?: string;
  blogs: Types.ObjectId[];
}
const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  blogs: [{ type: Types.ObjectId, required: false, ref: "Blog" }],
});

const userModel = mongoose.model<IUser>("User", userSchema);

export default userModel;
