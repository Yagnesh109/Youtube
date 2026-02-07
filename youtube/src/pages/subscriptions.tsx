import React, { useEffect, useState } from "react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Channel {
  _id: string;
  channelname: string;
  name?: string;
  description?: string;
  image?: string;
  createdAt?: string;
}

const Subscriptions = () => {
  const { user } = useUser();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscriptions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadSubscriptions = async () => {
    try {
      const response = await axiosInstance.get(`/subscription/user/${user._id}`);
      setChannels(response.data);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Please sign in to view subscriptions</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Subscriptions</h1>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">You haven't subscribed to any channels yet.</p>
              </div>
            ) : (
              channels.map((channel) => (
                <div key={channel._id} className="bg-card rounded-lg shadow-sm p-4 flex gap-4 items-center border border-border">
                   <Link href={`/channel/${channel._id}`}>
                    <Avatar className="w-16 h-16 cursor-pointer">
                        <AvatarImage src={channel.image} />
                        <AvatarFallback>{(channel.channelname || "U")[0]}</AvatarFallback>
                    </Avatar>
                   </Link>
                   <div className="flex-1 min-w-0">
                      <Link href={`/channel/${channel._id}`}>
                        <h3 className="font-semibold text-lg truncate hover:text-primary cursor-pointer text-foreground">
                            {channel.channelname || channel.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {channel.description || "No description"}
                      </p>
                   </div>
                   <Button variant="secondary" className="bg-secondary hover:bg-accent text-foreground">
                     View
                   </Button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscriptions;