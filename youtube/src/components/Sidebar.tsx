import { Clock, Compass, Home, PlaySquare, ThumbsUp, User, Download, Crown } from "lucide-react"; // Added Download and Crown icons
import Link from "next/link";
import { Button } from "./ui/button";
import { useState } from "react";
import ChannelVideo from "./ChannelVideo";
import { useUser } from "@/lib/AuthContext";
import PremiumModal from "./PremiumModal";

const Sidebar = () => {
  const { user } = useUser();
  const [isdialogopen, setisdialogopen] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  return (
    <aside className="w-64 bg-sidebar dark:bg-sidebar border-r border-sidebar-border dark:border-sidebar-border min-h-screen p-2 flex flex-col gap-2">
      <nav className="space-y-1 flex-1">
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent dark:hover:bg-sidebar-accent">
            <Home className="w-5 h-5 mr-3" />
            Home
          </Button>
        </Link>
        <Link href="/explore">
          <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent dark:hover:bg-sidebar-accent">
            <Compass className="w-5 h-5 mr-3" />
            Explore
          </Button>
        </Link>
        <Link href="/subscriptions">
          <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent dark:hover:bg-sidebar-accent">
            <PlaySquare className="w-5 h-5 mr-3" />
            Subscriptions
          </Button>
        </Link>
        
        {/* NEW DOWNLOADS BUTTON 👇 */}
        <Link href="/downloads">
          <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent dark:hover:bg-sidebar-accent">
            <Download className="w-5 h-5 mr-3" />
            Downloads
          </Button>
        </Link>

        {user && (
          <div className="border-t border-sidebar-border dark:border-sidebar-border pt-2 mt-2">
            <Link href="/history">
              <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent dark:hover:bg-sidebar-accent">
                <Clock className="w-5 h-5 mr-3" />
                History
              </Button>
            </Link>
            <Link href="/liked">
              <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent dark:hover:bg-sidebar-accent">
                <ThumbsUp className="w-5 h-5 mr-3" />
                Liked videos
              </Button>
            </Link>
            <Link href="/watch-later">
              <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent dark:hover:bg-sidebar-accent">
                <Clock className="w-5 h-5 mr-3" />
                Watch later
              </Button>
            </Link>

            {/* CHANNEL LOGIC */}
            {user?.channelname ? (
              <Link href={`/channel/${user._id}`}>
                <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent dark:hover:bg-sidebar-accent">
                  <User className="w-5 h-5 mr-3" />
                  Your channel
                </Button>
              </Link>
            ) : (
              <div className="px-2 py-1.5">
                <Button
                  variant="secondary"
                  className="w-full"
                  size="sm"
                  onClick={() => setisdialogopen(true)}
                >
                  Create a Channel
                </Button>
              </div>
            )}

            {/* PREMIUM BUTTON - Under Your channel section */}
            {user && user?.plan !== "Gold" && (
              <div className="px-2 py-1.5">
                <Button
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md flex items-center justify-center gap-2 border border-red-500"
                  onClick={() => setShowPremiumModal(true)}
                >
                  <Crown className="w-4 h-4 text-yellow-300" />
                  {user?.plan === "Free" ? "Get Premium" : `Upgrade from ${user?.plan}`}
                </Button>
              </div>
            )}
          </div>
        )}
      </nav>

      <ChannelVideo
        isopen={isdialogopen}
        onclose={() => setisdialogopen(false)}
        mode="create"
      />

      {showPremiumModal && (
        <PremiumModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
        />
      )}
    </aside>
  );
};

export default Sidebar;