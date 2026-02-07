
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { Clock, MoreVerticalIcon, Play, X } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { getVideoUrl } from "@/lib/videoUrl";
import { useUser } from "@/lib/AuthContext";

interface WatchLaterItem {
  _id: string;
  videoid: string;
  viewer: string;
  addedon: string;
  video: {
    _id: string;
    videotitle: string;
    videochanel: string;
    views: number;
    createdAt: string;
    filepath?: string;
  };
}

const WatchLaterContent = () => {
  const { user } = useUser();

  const [watchLater, setWatchLater] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWatchLater();
    }
  }, [user]);

  const loadWatchLater = async () => {
    if (!user) return;

    try {
      const watchLaterData = await axiosInstance.get(`/watchlater/${user?._id}`);
      console.log('Raw watch later data from API:', watchLaterData.data);
      setWatchLater(watchLaterData.data);
    } catch (error) {
      console.error("Failed to load watch later:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWatchLater = async (watchLaterId: string, videoId: string) => {
    try {
      // Call backend API to remove from database
      await axiosInstance.delete(`/watchlater/${user?._id}/${videoId}`);
      
      // Update local state
      setWatchLater((prev) =>
        prev.filter((item) => item._id !== watchLaterId)
      );
    } catch (error) {
      console.error("Failed to remove watch later:", error);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          Keep track of videos you save
        </h2>
        <p className="text-gray-600">
          Sign in to view your watch later videos
        </p>
      </div>
    );
  }

  if (loading) {
    return <div>Loading watch later...</div>;
  }

  if (watchLater.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          No videos in watch later
        </h2>
        <p className="text-gray-600">
          Videos you save will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {watchLater.length} items in watch later
        </p>
        <Button>
          <Play /> Play all
        </Button>
      </div>

      <div className="space-y-4">
        {watchLater.map((item) => (
          <div key={item._id} className="flex gap-4 group">
            <Link
              className="flex-shrink-0"
              href={`/watches/${item.videoid?._id || item.videoid}`}
            >
              <div className="relative w-40 aspect-video bg-gray-100 rounded overflow-hidden">
                <video
                  src={getVideoUrl(item.videoid)}
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <Link href={`/watches/${item.videoid?._id || item.videoid}`}>
                <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600 mb-1">
                  {item.videoid?.videotitle || "Untitled Video"}
                </h3>
                <p className="text-sm text-gray-600">
                  {item.videoid?.views?.toLocaleString() || 0} views ·{" "}
                  {formatDistanceToNow(new Date(item.videoid?.createdAt || Date.now()))} ago
                </p>
                <p className="text-sm text-gray-600">
                  saved {formatDistanceToNow(new Date(item.createdAt || Date.now()))} ago
                </p>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100"
                  >
                    <MoreVerticalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleRemoveWatchLater(item._id, item.videoid._id)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove from watch later
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

export default WatchLaterContent;
