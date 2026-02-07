import React, { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "sonner";

const ChannelHeader = ({ channel, user }: any) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check subscription status on mount
  useEffect(() => {
    const checkStatus = async () => {
      if (user && channel?._id && user._id !== channel._id) {
        try {
          const res = await axiosInstance.get(`/subscription/status/${user._id}/${channel._id}`);
          setIsSubscribed(res.data.subscribed);
        } catch (error) {
          console.error(error);
        }
      }
    };
    checkStatus();
  }, [channel, user]);

  const handleSubscribe = async () => {
    if (!user) {
        toast.error("Please login to subscribe");
        return;
    }

    if (!channel?._id) {
        console.error("Channel ID not found:", channel);
        toast.error("Channel information not available");
        return;
    }

    if (channel._id === user._id) {
        toast.error("You cannot subscribe to your own channel");
        return;
    }

    setLoading(true);
    try {
        const res = await axiosInstance.post("/subscription/toggle", {
            channelId: channel._id
        });
        setIsSubscribed(res.data.subscribed);
        toast.success(res.data.message);
    } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message || "Subscription failed";
        toast.error(errorMsg);
        console.error("Subscription error:", error);
    } finally {
        setLoading(false);
    }
  };

  const isOwner = user && channel && user._id === channel._id;

  return (
    <div className="w-full">
      <div className="relative h-32 md:h-48 lg:h-64 bg-gradient-to-r from-blue-400 to-purple-500 overflow-hidden"></div>
      <div className="px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Avatar className="w-20 h-20 md:w-32 md:h-32 ring-4 ring-white">
            <AvatarImage 
              src={channel?.image} 
              alt={channel?.channelname}
            />
            <AvatarFallback className="text-2xl">
              {channel?.channelname?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">{channel?.channelname}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>@{channel?.channelname?.toLowerCase().replace(/\s+/g, "")}</span>
            </div>
            {channel?.description && (
              <p className="text-sm text-muted-foreground max-w-2xl">
                {channel?.description}
              </p>
            )}
          </div>
          
          {user && !isOwner && (
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className={`transition-all ${
                isSubscribed 
                  ? "bg-secondary text-foreground hover:bg-accent" 
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              }`}
            >
              {loading ? "Loading..." : isSubscribed ? "Subscribed" : "Subscribe"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelHeader;