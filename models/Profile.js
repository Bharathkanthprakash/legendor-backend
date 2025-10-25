import mongoose from "mongoose";
const profileSchema = new mongoose.Schema({
  userId: String,
  name: String,
  role: String,
  bio: String,
});
export default mongoose.model("Profile", profileSchema);
