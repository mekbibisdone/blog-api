import mongoose from "mongoose";
import { Types } from "mongoose";

const userSchema= new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  blogs: [{ type: Types.ObjectId, required: false }],
});

const userModel = mongoose.model("User",userSchema);

export default userModel;
