import ChannelHeader from "@/components/ChannelHeader";
import Channeltabs from "@/components/Channeltabs";
import ChannelVideo from "@/components/ChannelVideo";
import VideoUploader from "@/components/VideoUploader";
import { useUser } from "@/lib/AuthContext";
import { useRouter } from "next/router";
import { join } from "path";
import React, { useState, useEffect } from "react";
import axiosInstance from "@/lib/axiosinstance";

interface Video {
  _id: string;
  videotitle: string;
  filename: string;
  filepath: string;
  filetype: string;
  filesize?: string;
  videochanel?: string;
  Like?: number;
  views?: number;
  uploader?: string;
  createdAt?: string;
}

const index = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    const loadChannelVideos = async () => {
      if (!router.isReady || !id) return;

      setLoading(true);
      try {
        const response = await axiosInstance.get(`/video/user/${id}`);
        console.log('Channel videos loaded:', response.data);
        setVideos(response.data);
      } catch (error) {
        console.error('Failed to load channel videos:', error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    loadChannelVideos();
  }, [router.isReady, id]);

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading channel...</div>
      </div>
    );
  }

  // For now, use logged-in user if viewing their own channel
  // In future, this should fetch channel data by ID from API
  let channel = user;

  // Ensure channel has required properties with null safety
  const channelData = {
    _id: channel?._id || id || "unknown",
    channelname: channel?.channelname || channel?.name || "My Channel",
    description: channel?.description || "",
    image: channel?.image || "https://github.com/shadcn.png",
    email: channel?.email || ""
  };

  console.log("Channel page data:", { channel, channelData, videos: videos.length });

  return (
    <div className="flex-1 min-h-screen bg-background">
      <div className="max-w-full mx-auto">
        <ChannelHeader channel={channelData} user={user} />
        <Channeltabs/>
        <div className="px-4 pb-8">

        </div>
        <div className="px-4 pb-8">
          <VideoUploader channelId={channelData._id} channelName={channelData.channelname}/>
        </div>
        <div>
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-4 text-foreground">No videos uploaded yet</h3>
              <p className="text-muted-foreground">
                This channel hasn't uploaded any videos yet. Be the first to upload!
              </p>
            </div>
          ) : (
            <ChannelVideo videos={videos} />
          )}
        </div>
      </div>
    </div>
  );
};

export default index;
