import axiosInstance from "@/lib/axiosinstance";

const DEFAULT_FALLBACK = "/video/vdo.mp4";

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

export const getVideoUrl = (video: any): string => {
  if (!video) return DEFAULT_FALLBACK;

  const filepath =
    video.filepath ||
    video.videoid?.filepath ||
    video.video?.filepath ||
    "";

  if (!filepath) return DEFAULT_FALLBACK;

  if (typeof filepath === "string" && isHttpUrl(filepath)) {
    return filepath;
  }

  const id = video._id || video.videoid?._id || video.video?._id;
  if (id) {
    return new URL(`/video/stream/${id}`, axiosInstance.defaults.baseURL).href;
  }

  return new URL(filepath, axiosInstance.defaults.baseURL).href;
};

