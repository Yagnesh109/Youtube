import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { Clock, MoreVerticalIcon, X } from "lucide-react";
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

const HistoryContent = () => {
  const { user } = useUser();

  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) {
        console.log('No user available for history');
        return;
      }

      console.log('Loading history for user:', user._id);
      try {
        const historyData = await axiosInstance.get(`/history/${user?._id}`);
        console.log('Raw history data from API:', historyData.data);
        console.log('Type of API response:', typeof historyData.data);
        console.log('Is array:', Array.isArray(historyData.data));
        console.log('History data length:', historyData.data?.length);
        
        if (historyData.data && Array.isArray(historyData.data)) {
          setHistory(historyData.data);
          console.log('History state updated with', historyData.data.length, 'items');
        } else {
          console.log('Invalid history data received:', historyData.data);
          setHistory([]);
        }
      } catch (error) {
        console.error("Failed to load history:", error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure user context is ready
    const timeoutId = setTimeout(() => {
      if (user) {
        loadHistory();
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;

    try {
      const historyData = await axiosInstance.get(`/history/${user?._id}`);
      console.log('Raw history data from API:', historyData.data);
      console.log('Type of API response:', typeof historyData.data);
      console.log('Is array:', Array.isArray(historyData.data));
      setHistory(historyData.data);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveHistory = async (historyId: string, videoId: string) => {
    try {
      console.log(`Removing history item with id: ${historyId}`);
      
      // Call backend API to remove from database
      await axiosInstance.delete(`/history/${user?._id}/${videoId}`);
      
      // Update local state
      setHistory((prevHistory) =>
        prevHistory.filter((item) => item._id !== historyId)
      );
    } catch (error) {
      console.error("Failed to remove history:", error);
    }
  };
  if (!user) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          Keep track of your watch history
        </h2>
        <p className="text-gray-600">
          Watch history is'nt viewable when signed out
        </p>
      </div>
    );
  }
  if (loading) {
    return <div>Loading history...</div>;
  }
  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          Your watch history is empty
        </h2>
        <p className="text-gray-600">Videos you watch will appear here</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {history.length} items in history
        </p>
      </div>
      <div className="space-y-4">
        {history.map((item) => (
          <div key={item._id} className="flex gap-4 group">
            <Link
              className="flex-shrink-0"
              href={`/watches/${item.videoid?._id || item.videoid}`}
              key={item._id}
            >
              <div className="relative w-40 aspect-video bg-gray-100 rounded overflow-hidden">
                <video
                  src={getVideoUrl(item.videoid)}
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
                  {item.videoid?.views?.toLocaleString() || 0} views ·{" "}
                  {formatDistanceToNow(new Date(item.videoid?.createdAt || Date.now()))} ago
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
                    onClick={() => handleRemoveHistory(item._id, item.videoid._id)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove from history
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

export default HistoryContent;
