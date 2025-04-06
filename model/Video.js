import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  shared: {
    facebook: { type: Boolean, default: false },
    instagram: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false },
    twitter: { type: Boolean, default: false }
  }
});

const Video = mongoose.model("Video", videoSchema);

export default Video;
