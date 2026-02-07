import React, { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Globe, ThumbsDown, ThumbsUp, MapPin } from "lucide-react"; 
import { toast } from "sonner";

// Language Options (examples; users can enter any language code)
const LANGUAGES = [
  { code: 'hi', label: 'Hindi' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'mr', label: 'Marathi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'bn', label: 'Bengali' },
];

const Comments = ({ videoId }: { videoId: string }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetLang, setTargetLang] = useState("hi"); 
  const [translatedComments, setTranslatedComments] = useState<{ [key: string]: string }>({});
  const [userLocation, setUserLocation] = useState("Locating...");
  
  const { user } = useUser();

  // 🔹 Detect Location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            setUserLocation(
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.hamlet ||
              data.address.county ||
              data.address.state ||
              "Unknown City"
            );
          } catch (e) { setUserLocation("Unknown"); }
        },
        () => setUserLocation("Location Denied")
      );
    } else {
      setUserLocation("Not Supported");
    }
    
    // Load comments
    if(videoId) {
        axiosInstance.get(`/comment/${videoId}`).then(res => setComments(res.data)).catch(console.error);
    }
  }, [videoId]);

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post('/comment/add', {
        videoid: videoId,
        commentbody: newComment.trim(),
        userId: user._id,
        city: userLocation 
      });
      setComments((prev) => [response.data, ...prev]);
      setNewComment("");
      toast.success("Comment posted!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTranslate = async (commentId: string) => {
    if (translatedComments[commentId]) {
       // Toggle off
       const copy = {...translatedComments};
       delete copy[commentId];
       setTranslatedComments(copy);
       return;
    }
    try {
      toast.info("Translating...");
      const res = await axiosInstance.post(`/comment/${commentId}/translate`, { targetLang });
      if(res.data.translated) {
          setTranslatedComments(prev => ({ ...prev, [commentId]: res.data.translated }));
      }
    } catch (error) { toast.error("Translation failed"); }
  };

  const handleDislike = async (commentId: string) => {
      if(!user) return;
      try {
          const res = await axiosInstance.post(`/comment/${commentId}/dislike`, { userId: user._id });
          if(res.data.removed) {
              setComments(prev => prev.filter(c => c._id !== commentId));
              toast.message("Comment removed (Too many dislikes)");
          } else {
              toast.success("Disliked");
              // Ideally refresh comments here or update local state count
          }
      } catch(e) { console.error(e); }
  }

  const handleLike = async (commentId: string) => {
      if(!user) return;
      try {
          const res = await axiosInstance.post(`/comment/${commentId}/like`, { userId: user._id });
          if (typeof res.data?.likes === "number") {
              setComments(prev =>
                prev.map(c =>
                  c._id === commentId ? { ...c, likes: res.data.likes } : c
                )
              );
          }
          toast.success("Liked");
      } catch(e) { console.error(e); }
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-foreground dark:text-foreground">{comments.length} Comments</h2>
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground dark:text-muted-foreground">Translate to:</span>
                <select 
                    value={targetLang} 
                    onChange={(e) => setTargetLang(e.target.value)} 
                    className="text-sm bg-background dark:bg-card border border-border dark:border-border text-foreground dark:text-foreground rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
                >
                    {LANGUAGES.map((lang) => <option key={lang.code} value={lang.code}>{lang.label}</option>)}
                </select>
                <span className="text-sm text-muted-foreground dark:text-muted-foreground">Language code:</span>
                <select 
                    value={targetLang} 
                    onChange={(e) => setTargetLang(e.target.value)} 
                    className="text-sm bg-background dark:bg-card border border-border dark:border-border text-foreground dark:text-foreground rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
                >
                    {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>{`${lang.code} - ${lang.label}`}</option>
                    ))}
                </select>
            </div>
        </div>
        
        {user && (
            <div className="flex gap-4">
                <Avatar className="w-10 h-10"><AvatarImage src={user.image} /><AvatarFallback>U</AvatarFallback></Avatar>
                <div className="flex-1 space-y-2">
                    <Textarea 
                        placeholder={`Add a comment from ${userLocation}...`}
                        className="min-h-[80px]"
                        value={newComment} 
                        onChange={(e)=>setNewComment(e.target.value)} 
                        disabled={isSubmitting}
                    />
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground dark:text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {userLocation}</span>
                        <Button onClick={handleSubmitComment} disabled={isSubmitting}>{isSubmitting ? "Posting..." : "Comment"}</Button>
                    </div>
                </div>
            </div>
        )}
        
        <div className="space-y-4">
            {comments.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-muted-foreground dark:text-muted-foreground">No comments yet. Be the first to comment!</p>
                </div>
            ) : (
                comments.map((comment) => (
                <div key={comment._id} className="flex gap-4">
                    <Avatar><AvatarImage src={comment.userid?.image}/><AvatarFallback>U</AvatarFallback></Avatar>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground dark:text-foreground">{comment.userid?.name}</span>
                            <span className="text-[10px] bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary px-2 py-0.5 rounded">{comment.city || "Unknown"}</span>
                            <span className="text-xs text-muted-foreground dark:text-muted-foreground">{formatDistanceToNow(new Date(comment.commentedon))} ago</span>
                        </div>
                        <p className="text-sm text-foreground dark:text-foreground">{translatedComments[comment._id] || comment.commentbody}</p>
                        <div className="flex items-center gap-4 mt-2">
                            <button 
                                onClick={() => handleTranslate(comment._id)} 
                                className="text-xs text-primary dark:text-primary hover:text-primary/80 dark:hover:text-primary/80 flex items-center gap-1 transition-colors"
                            >
                                <Globe className="w-3 h-3"/> Translate
                            </button>
                            <button 
                                onClick={() => handleLike(comment._id)} 
                                className="text-xs text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 flex items-center gap-1 transition-colors"
                            >
                                <ThumbsUp className="w-3 h-3"/> Like ({comment.likes || 0})
                            </button>
                            <button 
                                onClick={() => handleDislike(comment._id)} 
                                className="text-xs text-destructive dark:text-destructive hover:text-destructive/80 dark:hover:text-destructive/80 flex items-center gap-1 transition-colors"
                            >
                                <ThumbsDown className="w-3 h-3"/> Dislike ({comment.dislikes || 0})
                            </button>
                        </div>
                    </div>
                </div>
                ))
            )}
        </div>
    </div>
  );
};

export default Comments;
