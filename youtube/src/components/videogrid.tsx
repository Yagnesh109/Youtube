import React, { useState, useEffect } from "react";
import Videocard from "./Videocard";
import axiosInstance from "@/lib/axiosinstance";

const Videogrid = () => {
  const [videos, setvideo] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchvideo = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");
        setvideo(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    fetchvideo();
  }, []);

  /*const videos = [
    {
      _id: "1",
      videotitle: "Amazing Nature Documentary",
      filename: "nature-doc.mp4",
      filetype: "video/mp4",
      filepath: "/videos/nature-doc.mp4",
      filesize: "500MB",
      videochanel: "Nature Channel",
      Like: 1250,
      views: 45000,
      uploader: "nature_lover",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "2",
      videotitle: "Cooking Tutorial: Perfect Pasta",
      filename: "pasta-tutorial.mp4",
      filetype: "video/mp4",
      filepath: "/videos/pasta-tutorial.mp4",
      filesize: "300MB",
      videochanel: "Chef's Kitchen",
      Like: 890,
      views: 23000,
      uploader: "chef_master",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
  */

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500); // 0.5s fake loading
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {loading ? (
        <div>Loading...</div>
      ) : videos && videos.length > 0 ? (
        videos.map((video: any) => <Videocard key={video._id} video={video} />)
      ) : (
        <div>No videos available</div>
      )}
    </div>
  );
};

export default Videogrid;
