import { Avatar, AvatarFallback } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Clock,
  Download,
  MoreHorizontal,
  Share,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import PremiumModal from "./PremiumModal"; 
import { toast } from "sonner"; 

const VideoInfo = ({ video }: any) => {
  const [likes, setLikes] = useState(video?.Like || 0);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [dislikes, setDislikes] = useState(video?.Dislike || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // 🔹 State for Premium Modal
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const { user } = useUser();

  // 🔹 Unified useEffect to check all statuses (Like, WatchLater, Subscription)
  useEffect(() => {
    if (!video) return;
    
    // Reset local states when video changes
    setLikes(video.Like || 0);
    setDislikes(video.Dislike || 0);
    setIsLiked(false);
    setIsDisliked(false);
    setIsWatchLater(false);
    setIsSubscribed(false);

    const checkStatus = async () => {
      if (user && video?._id) {
        try {
          // 1. Check Like & Watch Later Status
          const likeRes = await axiosInstance.get(`/like/${user._id}/${video._id}/status`);
          setIsLiked(likeRes.data.liked);
          
          const wlRes = await axiosInstance.get(`/watchlater/${user._id}/${video._id}/status`);
          setIsWatchLater(wlRes.data.watchLater);

          // 2. Check Subscription Status
          // Use the same helper function to get channel ID
          const channelId = getChannelId();
          
          if (channelId && channelId !== user._id) {
             try {
               const subRes = await axiosInstance.get(`/subscription/status/${user._id}/${channelId}`);
               setIsSubscribed(subRes.data.subscribed);
             } catch (error) {
               // Silently fail subscription status check if channel doesn't exist
               console.log("Could not check subscription status:", error);
             }
          }
        } catch (error) { 
          console.error("Error checking video status:", error); 
        }
      }
    };

    checkStatus();
  }, [video, user]);

  // 🔹 Handle Download Logic
  // Helper function to get channel ID from video
  const getChannelId = () => {
    if (video?.userid) {
      if (typeof video.userid === 'object' && video.userid !== null && video.userid._id) {
        return video.userid._id;
      } else if (typeof video.userid === 'string' && video.userid !== 'undefined' && video.userid !== 'null' && video.userid.trim() !== '') {
        return video.userid;
      }
    }
    if (video?.uploader && video.uploader !== 'undefined' && video.uploader !== 'null' && video.uploader.trim() !== '') {
      return video.uploader;
    }
    return null;
  };

  const handleDownload = async () => {
    if (!user) {
      if (typeof toast !== "undefined") toast.error("Please sign in to download");
      else alert("Please sign in to download");
      return;
    }

    if (!video?._id) {
      if (typeof toast !== "undefined") toast.error("Video not found");
      return;
    }

    if (isDownloading) return;

    try {
      setIsDownloading(true);

      const headers: any = {};
      if ((user as any)?._id) {
        headers["x-user-id"] = (user as any)._id;
      }
      if ((user as any)?.token) {
        headers.Authorization = `Bearer ${(user as any).token}`;
      }

      const res = await axiosInstance.get(`/video/download/${video._id}`,
        {
          headers,
          responseType: "blob",
        }
      );

      const contentType = (res.headers?.["content-type"] || "") as string;

      if (contentType.includes("application/json")) {
        const text = await (res.data as Blob).text();
        const data = JSON.parse(text);

        if (data?.downloadUrl) {
          const link = document.createElement("a");
          link.href = data.downloadUrl;
          link.setAttribute("download", `${video.videotitle || "video"}.mp4`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          if (typeof toast !== "undefined") toast.success("Download started!");
          return;
        }

        if (typeof toast !== "undefined") toast.error("Download failed");
        return;
      }

      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${video.videotitle || "video"}.mp4`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      if (typeof toast !== "undefined") toast.success("Download started!");
    } catch (error: any) {
      // 3. If Limit Reached (403), Show Premium Modal
      if (error.response && error.response.status === 403) {
        setShowPremiumModal(true);
      } else {
        if (typeof toast !== "undefined") toast.error("Download failed");
        console.error(error);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      const response = await axiosInstance.post(`/like/${video._id}/like`, { userId: user._id });
      if (response.data.liked) {
        setLikes((p: number) => p + 1);
        setIsLiked(true);
        if (isDisliked) { setDislikes((p: number) => p - 1); setIsDisliked(false); }
      } else {
        setLikes((p: number) => p - 1);
        setIsLiked(false);
      }
    } catch (error) { console.error(error); }
  };

  const handleDislike = async () => {
    if (!user) return;
    try {
      const response = await axiosInstance.post(`/like/${video._id}/dislike`, { userId: user._id });
      if (response.data.disliked) {
        setDislikes((p: number) => p + 1);
        setIsDisliked(true);
        if (isLiked) { setLikes((p: number) => p - 1); setIsLiked(false); }
      }
    } catch (error) { console.error(error); }
  };

  const handleWatchLater = async () => {
    if (!user) return;
    try {
      const response = await axiosInstance.post(`/watchlater/${video._id}`, { userId: user._id });
      setIsWatchLater(response.data.watchLater);
    } catch (error) { setIsWatchLater(!isWatchLater); }
  };

  const handleSubscribe = async () => {
     if(!user) return toast.error("Login to subscribe");
     
     // Handle cases where video.userid is an object (populated) or string (ID)
     // Try multiple possible fields where channel ID might be stored
     let channelId = null;
     
     if (video.userid) {
       // If userid is an object with _id property
       if (typeof video.userid === 'object' && video.userid._id) {
         channelId = video.userid._id;
       } 
       // If userid is a string ID
       else if (typeof video.userid === 'string') {
         channelId = video.userid;
       }
     }
     
     // Fallback to uploader field
     if (!channelId && video.uploader) {
       channelId = video.uploader;
     }
     
     // Log for debugging
     console.log("Subscribe attempt - Video data:", {
       videoId: video._id,
       userid: video.userid,
       uploader: video.uploader,
       extractedChannelId: channelId,
       user: user._id
     });
     
     if (!channelId || channelId === 'undefined' || channelId === 'null' || (typeof channelId === 'string' && channelId.trim() === '')) {
       console.error("Channel ID not found in video:", video);
       toast.error("This video doesn't have channel information. Subscription is not available for this video.");
       return;
     }

     if (channelId === user._id) {
       toast.error("You cannot subscribe to your own channel");
       return;
     }
     
     try {
        console.log("Sending subscription request with channelId:", channelId);
        const res = await axiosInstance.post("/subscription/toggle", { channelId });
        setIsSubscribed(res.data.subscribed);
        toast.success(res.data.message);
     } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message || "Subscription failed";
        toast.error(errorMsg);
        console.error("Subscription error details:", {
          error,
          response: error.response?.data,
          channelId,
          video: video
        });
     }
  };

  const hasChannelInfo = getChannelId() !== null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground dark:text-foreground">{video?.videotitle || "Untitled Video"}</h1>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-10 h-10">
            <AvatarFallback>{video?.videochanel?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-foreground dark:text-foreground">{video?.videochanel || "Unknown Channel"}</h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              {hasChannelInfo ? "1.2M subscribers" : "Channel information not available"}
            </p>
          </div>
          {hasChannelInfo && (
            <Button 
              onClick={handleSubscribe}
              className={`ml-4 rounded-full ${
                isSubscribed 
                  ? "bg-secondary dark:bg-secondary text-foreground dark:text-foreground hover:bg-accent dark:hover:bg-accent" 
                  : "bg-foreground dark:bg-foreground text-background dark:text-background hover:bg-foreground/90 dark:hover:bg-foreground/90"
              }`}
            >
              {isSubscribed ? "Subscribed" : "Subscribe"}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <div className="flex items-center bg-secondary dark:bg-secondary rounded-full">
            <Button variant="ghost" size="sm" className="rounded-l-full" onClick={handleLike}>
              <ThumbsUp className={`w-5 h-5 mr-2 ${isLiked ? "fill-foreground dark:fill-foreground" : ""}`} />
              <span className="text-foreground dark:text-foreground">{likes.toLocaleString()}</span>
            </Button>
            <div className="w-px h-6 bg-border dark:bg-border" />
            <Button variant="ghost" size="sm" className="rounded-r-full" onClick={handleDislike}>
              <ThumbsDown className={`w-5 h-5 mr-2 ${isDisliked ? "fill-foreground dark:fill-foreground" : ""}`} />
            </Button>
          </div>

          <Button variant="ghost" size="sm" className={`bg-secondary dark:bg-secondary rounded-full text-foreground dark:text-foreground ${isWatchLater ? "text-primary dark:text-primary" : ""}`} onClick={handleWatchLater}>
            <Clock className="w-5 h-5 mr-2" /> {isWatchLater ? "Saved" : "Watch Later"}
          </Button>

          {/* 🔹 Download Button with Logic */}
          <Button
            variant="ghost"
            size="sm"
            className="bg-secondary dark:bg-secondary rounded-full text-foreground dark:text-foreground"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download className="w-5 h-5 mr-2" /> {isDownloading ? "Downloading..." : "Download"}
          </Button>

          <Button variant="ghost" size="sm" className="bg-secondary dark:bg-secondary rounded-full text-foreground dark:text-foreground">
            <Share className="w-5 h-5 mr-2" /> Share
          </Button>

          <Button variant="ghost" size="icon" className="bg-secondary dark:bg-secondary rounded-full text-foreground dark:text-foreground">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="bg-secondary dark:bg-secondary rounded-lg p-4">
        <div className="flex gap-4 text-sm font-medium mb-2 text-foreground dark:text-foreground">
          <span>{video?.views?.toLocaleString() || 0} views</span>
          <span>{formatDistanceToNow(new Date(video?.createdAt || Date.now()))} ago</span>
        </div>
        <p className={`text-sm text-foreground dark:text-foreground ${showFullDescription ? "" : "line-clamp-3"}`}>
          {video?.description || "No description available."}
        </p>
        <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto font-medium text-foreground dark:text-foreground" onClick={() => setShowFullDescription(!showFullDescription)}>
          {showFullDescription ? "Show Less" : "Show More"}
        </Button>
      </div>

      {/* 🔹 Render Premium Modal conditionally */}
      {showPremiumModal && (
        <PremiumModal 
          isOpen={showPremiumModal} 
          onClose={() => setShowPremiumModal(false)} 
        />
      )}
    </div>
  );
};

export default VideoInfo;