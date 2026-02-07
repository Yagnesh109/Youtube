import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import Videocard from "@/components/Videocard";
import { Download, Loader2 } from "lucide-react";
import { useUser } from "@/lib/AuthContext";
import { toast } from "sonner";

export default function DownloadsPage() {
  const { user, loading: authLoading } = useUser();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch if user is logged in
    if (!user) {
        if(!authLoading) setLoading(false);
        return;
    }

    const fetchDownloads = async () => {
      try {
        const { data } = await axiosInstance.get("/video/downloaded");
        setVideos(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load downloads");
      } finally {
        setLoading(false);
      }
    };

    fetchDownloads();
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="flex-1 flex justify-center items-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[80vh] gap-4 bg-background">
        <Download className="w-16 h-16 text-muted-foreground" />
        <p className="text-xl font-semibold text-foreground">Sign in to view downloads</p>
      </div>
    );
  }

  return (
    <main className="flex-1 p-6 bg-background">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
          <Download className="w-6 h-6 text-primary" />
          My Downloads
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {videos.length} video{videos.length !== 1 && "s"} downloaded
        </p>
      </div>

      {videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <Videocard key={video._id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center mt-20 text-muted-foreground">
          <Download className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg">No downloads yet.</p>
          <p className="text-sm">Download videos to watch them later!</p>
        </div>
      )}
    </main>
  );
}