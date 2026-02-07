import Link from "next/link";
import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { getVideoUrl } from "@/lib/videoUrl";

const Videocard = ({ video }: any) => {
  const src = video?.filepath
    ? getVideoUrl(video)
    : "/video/vdo.mp4";
  return (
    <Link href={`/watches/${video._id}`} className="group">
      <div className="space-y-3">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted dark:bg-muted">
          <video
            src={src}
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded">
            10:24
          </div>
        </div>
        <div className="flex gap-3">
          <Avatar className="w-9 h-9 flex-shrink-0">
            <AvatarFallback>{video?.videochanel?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2 text-foreground dark:text-foreground group-hover:text-primary dark:group-hover:text-primary">
              {video?.videotitle}
            </h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">{video?.videochanel}</p>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              {video?.views.toLocaleString()} views •{" "}
              {formatDistanceToNow(new Date(video?.createdAt))} ago
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Videocard;
