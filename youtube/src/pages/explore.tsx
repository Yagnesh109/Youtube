import React, { useEffect, useState } from "react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import Videocard from "@/components/Videocard";
import { formatDistanceToNow } from "date-fns";

interface Video {
  _id: string;
  videotitle: string;
  filename: string;
  filepath: string;
  filetype: string;
  views?: number;
  createdAt?: string;
  userid?: {
    _id: string;
    name: string;
    image?: string;
  };
}

const Explore = () => {
  const { user } = useUser();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const response = await axiosInstance.get('/video/getall');
      console.log('Explore videos loaded:', response.data);
      setVideos(response.data);
    } catch (error) {
      console.error('Failed to load explore videos:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      console.log('Empty search query, loading all videos');
      loadVideos();
      return;
    }
    
    console.log('Searching for:', searchQuery.trim());
    setLoading(true);
    
    try {
      const response = await axiosInstance.get(`/video/search?q=${encodeURIComponent(searchQuery.trim())}`);
      console.log('Search results:', response.data);
      setVideos(response.data);
    } catch (error) {
      console.error('Search failed:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Please sign in to explore</h2>
          <p className="text-muted-foreground">You need to be logged in to access the explore page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Explore</h1>
        
        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}>
            <div className="flex gap-4 max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Search
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    loadVideos();
                  }}
                  className="px-6 py-2 bg-secondary text-foreground rounded-lg hover:bg-accent"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading videos...</p>
          </div>
        ) : (
          <>
            {/* Results Header */}
            {searchQuery && (
              <h2 className="text-xl font-semibold mb-4 text-foreground">
                Search Results for "{searchQuery}"
              </h2>
            )}

            {/* Videos Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <h3 className="text-xl font-semibold mb-4 text-foreground">No videos found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? `No results found for "${searchQuery}"` : "No videos available"}
                  </p>
                </div>
              ) : (
                videos.map((video: Video) => (
                  <Videocard key={video._id} video={video} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Explore;
