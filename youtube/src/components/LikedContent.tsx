import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { Clock, MoreVerticalIcon, Play, X } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

interface LikeItem {
  _id: string;
  videoid: string;
  viewer: string;
  watchedon: string;
  video: {
    _id: string;
    videotitle: string;
    videochanel: string;
    views: number;
    createdAt: string;
    filepath?: string;
  };
}

const LikedContent = () => {
  const { user } = useUser();

  const [likedVideos, setLikedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLikedVideos = async (forceRefresh = false) => {
    if (!user) {
      console.log('No user available for liked videos');
      return;
    }

    console.log('Loading liked videos for user:', user._id);
    console.log('Full user object:', user);
    console.log('Force refresh:', forceRefresh);
    
    try {
      const likedData = await axiosInstance.get(`/like/${user?._id}`, {
        headers: forceRefresh ? { 'Cache-Control': 'no-cache' } : {}
      });
      console.log('Raw liked videos data from API:', likedData.data);
      console.log('Type of API response:', typeof likedData.data);
      console.log('Is array:', Array.isArray(likedData.data));
      console.log('Liked videos data length:', likedData.data?.length);
      
      if (likedData.data && Array.isArray(likedData.data)) {
        setLikedVideos(likedData.data);
        console.log('Liked videos state updated with', likedData.data.length, 'items');
      } else {
        console.log('Invalid liked videos data received:', likedData.data);
        setLikedVideos([]);
      }
    } catch (error) {
      console.error("Failed to load liked videos:", error);
      setLikedVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Add a small delay to ensure user context is ready
    const timeoutId = setTimeout(() => {
      if (user) {
        loadLikedVideos();
      }
    }, 100);

    // Listen for custom events from VideoInfo component
    const handleVideoLiked = (event: any) => {
      console.log('Received videoLiked event:', event.detail);
      // Force refresh when a video is liked/unliked
      if (user) {
        setTimeout(() => {
          loadLikedVideos(true);
        }, 500);
      }
    };

    window.addEventListener('videoLiked', handleVideoLiked);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('videoLiked', handleVideoLiked);
    };
  }, [user]);

  const handleUnlikeVideo = async (likeId: string, videoId: string) => {
    try {
      console.log(`Removing liked video with id: ${likeId}, videoId: ${videoId}`);
      
      // Call backend API to unlike the video
      const response = await axiosInstance.post(`/like/${videoId}/like`, {
        userId: user?._id
      });
      
      console.log('Unlike API response:', response.data);
      
      // Update local state immediately
      setLikedVideos((prev) =>
        prev.filter((item) => item._id !== likeId)
      );
      
      // Force a complete reload of the component by setting loading state
      setLoading(true);
      
      // Wait a moment then refetch to ensure server consistency
      setTimeout(async () => {
        console.log('Refetching liked videos after unlike...');
        try {
          const refetchData = await axiosInstance.get(`/like/${user?._id}`, {
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
          });
          console.log('Refetched liked videos after unlike:', refetchData.data);
          if (refetchData.data && Array.isArray(refetchData.data)) {
            setLikedVideos(refetchData.data);
            console.log('Liked videos state updated with', refetchData.data.length, 'items');
          }
        } catch (error) {
          console.error("Failed to refetch liked videos:", error);
        } finally {
          setLoading(false);
        }
      }, 500); // Wait 500ms before refetching
      
    } catch (error) {
      console.error("Failed to unlike video:", error);
      setLoading(false);
    }
  };
  if (!user) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Keep track of videos you like</h2>
        <p className="text-gray-600">Sign in to view your liked videos</p>
      </div>
    );
  }
  if (loading) {
    return <div>Loading liked videos...</div>;
  }
  if (likedVideos.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No liked videos yet</h2>
        <p className="text-gray-600">Videos you like will appear here</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">{likedVideos.length} items in liked videos</p>
        <div className="flex gap-2">
          <Button onClick={() => loadLikedVideos(true)} variant="outline" size="sm">
            Refresh
          </Button>
          <Button><Play/> Play all</Button>
        </div>
      </div>
      <div className="space-y-4">
        {likedVideos.map((item: any) => (
          <div key={item._id} className="flex gap-4 group">
            <Link className="flex-shrink-0" href={`/watches/${item.videoid?._id || item.videoid}`} key={item._id}>
              <div className="relative w-40 aspect-video bg-gray-100 rounded overflow-hidden">
                <video
                  src={item.videoid?.filepath || item.videoid?.filepath || "/video/vdo.mp4"}
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/watches/${item.videoid?._id || item.videoid}`} key={item._id}>
                <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600 mb-1">
                  {item.videoid?.videotitle || "Untitled Video"}
                </h3>
                <p className="text-sm text-gray-600">
                  {item.videoid?.views?.toLocaleString() || 0} views
                  {formatDistanceToNow(new Date(item.videoid?.createdAt || Date.now()))} ago
                </p>
                <p className="text-sm text-gray-600">
                  liked {formatDistanceToNow(new Date(item.watchedon || Date.now()))} ago
                </p>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100">
                    <MoreVerticalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleUnlikeVideo(item._id, item.videoid?._id || item.videoid)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove from liked videos
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LikedContent;
