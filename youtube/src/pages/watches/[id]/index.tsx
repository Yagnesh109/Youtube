import Comments from "@/components/Comments";
import VideoInfo from "@/components/VideoInfo";
import Videoplayer from "@/components/Videoplayer";
import RelatedVideos from "@/components/RelatedVideos";
import { notFound } from "next/navigation";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState, useRef } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

const index = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [videos, setvideo] = useState<any>(null);
  const [video, setvide] = useState<any>(null);
  const [showComments, setShowComments] = useState(false);
  const commentsRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchvideo = async () => {
      if (!id || typeof id !== "string") return;
      console.log('Fetching video with ID:', id);
      console.log('User:', user);
      
      try {
        const res = await axiosInstance.get("/video/getall");
        const video = res.data?.filter((vid: any) => vid._id === id);
        console.log('Found video:', video[0]);
        setvideo(video[0]);
        setvide(res.data);
        
        // Add to history when video is watched
        if (video[0] && user) {
          console.log('Adding to history for user:', user._id, 'video:', id);
          try {
            const historyResponse = await axiosInstance.post(`/history/${id}`, {
              userId: user._id
            });
            console.log('History response:', historyResponse.data);
          } catch (error) {
            console.error('Error adding to history:', error);
          }
        } else {
          console.log('Not adding to history - user:', !!user, 'video:', !!video[0]);
        }
      } catch (error) {
        console.error('Error fetching video:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchvideo();
  }, [id]);

  // Gesture handlers
  const handleCommentsToggle = () => {
    setShowComments(!showComments);
    // Scroll to comments if opening
    if (!showComments && commentsRef.current) {
      setTimeout(() => {
        commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleNextVideo = () => {
    if (video && video.length > 1) {
      const currentIndex = video.findIndex((v: any) => v._id === id);
      console.log('Current video index:', currentIndex, 'Total videos:', video.length);
      
      if (currentIndex !== -1) {
        const nextIndex = (currentIndex + 1) % video.length;
        const nextVideo = video[nextIndex];
        console.log('Next video:', nextVideo);
        
        if (nextVideo && nextVideo._id) {
          router.push(`/watches/${nextVideo._id}`);
        } else {
          console.error('Next video not found or missing _id');
        }
      } else {
        console.error('Current video not found in list');
        // Fallback to first video if current not found
        if (video.length > 0 && video[0]?._id) {
          router.push(`/watches/${video[0]._id}`);
        }
      }
    } else {
      console.log('No videos available or only one video');
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      window.close();
      // Fallback if window.close() doesn't work (tab wasn't opened programmatically)
      router.push('/');
    }
  };
  /*const relatedVideos = [
    {
      _id: "1",
      videotitle: "Amazing Nature Documentary",
      filename: "vdo.mp4",
      filetype: "video/mp4",
      filepath: "/video/vdo.mp4",
      filesize: "500MB",
      videochanel: "Nature Channel",
      Like: 1250,
      Dislike: 50,
      views: 45000,
      uploader: "nature_lover",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "2",
      videotitle: "Cooking Tutorial: Perfect Pasta",
      filename: "vdo.mp4",
      filetype: "video/mp4",
      filepath: "/video/vdo.mp4",
      filesize: "300MB",
      videochanel: "Chef's Kitchen",
      Like: 890,
      Dislike: 20,
      views: 23000,
      uploader: "chef_master",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];*/
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!videos) {
    return <div>Video not found</div>;
  }
  const videoId = Array.isArray(id) ? id[0] : id || "";
  return (
    <div className="min-h-screen bg-background dark:bg-background">
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Videoplayer 
              video={videos} 
              onCommentsToggle={handleCommentsToggle}
              onNextVideo={handleNextVideo}
              onClose={handleClose}
              allVideos={video}
              currentVideoId={videoId}
            />
            <VideoInfo video={videos} />
            <div ref={commentsRef}>
              <Comments videoId={videoId} />
            </div>
          </div>
          <div className="space-y-4">
            <RelatedVideos video={video} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default index;
