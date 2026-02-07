import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import React from "react";
import axiosInstance from "@/lib/axiosinstance";

const RelatedVideos = ({ video }: { video: any[] }) => {
  return (
    <div className="space-y-2">
      {video.map((video:any) => (
        <Link key={video._id} href={`/watches/${video._id}`} className="flex gap-2 group">
          <div className="relative w-40 aspect-video bg-muted dark:bg-muted rounded overflow-hidden flex-shrink-0">
            <video className="object-cover group-hover:scale-105 transition-transform duration-200" src={video?.filepath ? new URL(video.filepath, axiosInstance.defaults.baseURL).href : "/video/vdo.mp4"}/>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2 text-foreground dark:text-foreground group-hover:text-primary dark:group-hover:text-primary">{video.videotitle}</h3>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">{video.videochanel}</p>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground">{video.views.toLocaleString()} views {formatDistanceToNow(new Date(video.createdAt))}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default RelatedVideos;
