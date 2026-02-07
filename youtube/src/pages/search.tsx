import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
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

const Search = () => {
  const { user } = useUser();
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const { q } = router.query;
    if (q && typeof q === 'string') {
      setSearchQuery(q);
      loadSearchResults(q as string);
    } else {
      setLoading(false);
    }
  }, [router.query]);

  const loadSearchResults = async (query: string) => {
    try {
      const response = await axiosInstance.get(`/video/search?q=${encodeURIComponent(query)}`);
      console.log('Search results:', response.data);
      setVideos(response.data);
    } catch (error) {
      console.error('Search failed:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Please sign in to search</h2>
          <p className="text-muted-foreground">You need to be logged in to search videos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Search Results</h1>
        
        {/* Results Header */}
        {searchQuery && (
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            Search Results for "{searchQuery}"
          </h2>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Searching...</p>
          </div>
        ) : (
          <>
            {/* Videos Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <h3 className="text-xl font-semibold mb-4 text-foreground">No results found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? `No results found for "${searchQuery}"` : "Try searching for something else"}
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

export default Search;
