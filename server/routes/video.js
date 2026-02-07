import express from "express";
import {
  getallvideo,
  uploadvideo,
  searchVideos,
  getVideosByUser,
  downloadVideo,
  getDownloadedVideos, // <--- Import this
  streamVideo
} from "../controllers/video.js";
import { verifyToken } from "../verifyToken.js";

const routes = express.Router();

routes.post("/upload", uploadvideo);
routes.get("/getall", getallvideo);
routes.get("/search", searchVideos);
routes.get("/user/:userId", getVideosByUser);
routes.get("/download/:videoId", verifyToken, downloadVideo);
routes.get("/stream/:videoId", streamVideo);

// NEW ROUTE 👇
routes.get("/downloaded", verifyToken, getDownloadedVideos);

export default routes;
