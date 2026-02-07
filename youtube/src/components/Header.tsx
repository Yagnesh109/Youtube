import { Bell, Menu, Mic, User, VideoIcon, Download, Users } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import ChannelVideo from "./ChannelVideo";
import { useRouter } from "next/router";
import { useUser } from "@/lib/AuthContext";

const Header = () => {
  const { user, loading, logout, handleAuthStateChange } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [isdialogopen, setisdialogopen] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-background dark:bg-background border-b border-border dark:border-border sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-6 h-6" />
        </Button>
        <Link href={"/"} className="flex items-center gap-1">
          <div className="bg-red-600 p-1 rounded">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <span className="text-xl font-medium hidden sm:block">YouTube</span>
          <span className="text-xs text-muted-foreground ml-1 hidden sm:block">IN</span>
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex flex-1 max-w-xl items-center gap-2 px-4">
        <div className="flex flex-1">
          <Input
            type="search"
            placeholder="Search"
            value={searchQuery}
            className="rounded-l-full border-r-0 focus-visible:ring-0"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit" className="rounded-r-full px-6 bg-secondary dark:bg-secondary hover:bg-accent dark:hover:bg-accent text-foreground dark:text-foreground border border-l-0 border-border dark:border-border">
            Search
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full bg-secondary dark:bg-secondary hover:bg-accent dark:hover:bg-accent">
          <Mic className="w-5 h-5" />
        </Button>
      </form>

      {loading ? (
        <div className="w-10 h-10 rounded-full bg-secondary animate-pulse"></div>
      ) : user ? (
        <div className="flex items-center gap-2">
          <Link href="/friends">
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
              <Users className="w-5 h-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
            <VideoIcon className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
            <Bell className="w-5 h-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src={user.image} alt={user.name} />
                  <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-50 bg-popover dark:bg-popover border border-border dark:border-border shadow-lg w-56" align="end">
              {user?.channelname ? (
                <DropdownMenuItem asChild>
                  <Link href={`/channel/${user._id}`} className="cursor-pointer">Your Channel</Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setisdialogopen(true)} className="cursor-pointer">
                  Create a Channel
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/history" className="cursor-pointer">History</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/likedvideos/${user._id}`} className="cursor-pointer">Liked Videos</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/watchlater/${user._id}`} className="cursor-pointer">Watch Later</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/subscriptions" className="cursor-pointer">Subscriptions</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/friends" className="cursor-pointer flex items-center gap-2">
                  <Users className="w-4 h-4" /> Friends
                </Link>
              </DropdownMenuItem>
              
              {/* 🔹 NEW DOWNLOADS LINK */}
              <DropdownMenuItem asChild>
                <Link href="/downloads" className="cursor-pointer flex items-center gap-2">
                  <Download className="w-4 h-4" /> Downloads
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
      
      <ChannelVideo
        isopen={isdialogopen}
        onclose={() => setisdialogopen(false)}
        mode="create"
      />
    </header>
  );
};

export default Header;
