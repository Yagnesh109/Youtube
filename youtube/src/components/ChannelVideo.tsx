import React from "react";
import Videocard from "./Videocard";
import ChannelDialog from "./ChannelDialog";

const ChannelVideo = ({ isopen, onclose, mode, videos }: any) => {
  // If this is being used as a dialog for channel creation/editing
  if (isopen !== undefined) {
    return (
      <ChannelDialog
        isopen={isopen}
        onclose={onclose}
        mode={mode}
      />
    );
  }

  // If this is being used to display videos
  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No videos available</p>
      </div>
    );
  }
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Videos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((video: any) => (
            <Videocard key={video._id} video={video} />
        ))}
      </div>
    </div>
  );
};

export default ChannelVideo;
