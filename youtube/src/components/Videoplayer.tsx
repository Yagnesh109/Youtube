import React, { useEffect, useRef, useState, useCallback } from 'react';
import axiosInstance from '@/lib/axiosinstance';
import { useUser } from '@/lib/AuthContext';
import PremiumModal from './PremiumModal';
import { toast } from 'sonner';

const Videoplayer = ({ video, onCommentsToggle, onNextVideo, onClose, allVideos, currentVideoId }: any) => {
    console.log('Videoplayer props:', { onCommentsToggle: !!onCommentsToggle, onNextVideo: !!onNextVideo, onClose: !!onClose });
    const { user } = useUser();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [watchedProgress, setWatchedProgress] = useState<number[]>([]);
    const [showControls, setShowControls] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [hoverTime, setHoverTime] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Gesture state
    const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const tapCountRef = useRef(0);
    const lastTapTimeRef = useRef(0);
    const lastTapPositionRef = useRef({ x: 0, y: 0 });

    // Progress tracking
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const defaultSrc = "/video/vdo.mp4";
    const src = video?.filepath
      ? new URL(video.filepath, axiosInstance.defaults.baseURL).href
      : defaultSrc;

    // Progress tracking functions
    const updateWatchedProgress = useCallback(() => {
        if (!videoRef.current || duration === 0) return;
        
        const current = videoRef.current.currentTime;
        const progressPercentage = (current / duration) * 100;
        
        setWatchedProgress(prev => {
            const newProgress = [...prev];
            const segmentIndex = Math.floor(progressPercentage / 1); // 1% segments
            
            if (!newProgress.includes(segmentIndex)) {
                newProgress.push(segmentIndex);
                newProgress.sort((a, b) => a - b);
            }
            
            return newProgress;
        });
    }, [duration]);

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current || !progressBarRef.current) return;
        
        const rect = progressBarRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const newTime = percentage * duration;
        
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
        handleProgressMouseMove(e);
    };

    const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressBarRef.current || !videoRef.current) return;
        
        const rect = progressBarRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const newTime = percentage * duration;
        
        setHoverTime(newTime);
        
        if (isDragging) {
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const handleProgressMouseUp = () => {
        setIsDragging(false);
    };

    const handleProgressMouseEnter = () => {
        setIsHovering(true);
    };

    const handleProgressMouseLeave = () => {
        setIsHovering(false);
        setIsDragging(false);
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const togglePlayPause = () => {
        console.log('togglePlayPause called, React state isPlaying:', isPlaying);
        if (!videoRef.current) {
            console.log('No video ref!');
            return;
        }
        
        // Check the actual video element state, not just React state
        const actualVideoState = !videoRef.current.paused;
        console.log('Actual video state (not paused):', actualVideoState);
        
        if (actualVideoState) {
            console.log('Pausing video');
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            console.log('Playing video');
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const playVideo = () => {
        if (!videoRef.current) return;
        videoRef.current.play();
        setIsPlaying(true);
        showControlsTemporarily();
    };

    const showControlsTemporarily = () => {
        setShowControls(true);
        
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 3000);
    };

    const formatTime = (time: number): string => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Define Plan Limits (in seconds)
    const PLAN_LIMITS: { [key: string]: number } = {
        Free: 5 * 60,    // 5 minutes
        Bronze: 7 * 60,  // 7 minutes
        Silver: 10 * 60, // 10 minutes
        Gold: Infinity   // Unlimited
    };

    // Gesture handling functions
    const getTapZone = (x: number, containerWidth: number): 'left' | 'center' | 'right' => {
        const leftZone = containerWidth * 0.3;
        const rightZone = containerWidth * 0.7;
        
        if (x < leftZone) return 'left';
        if (x > rightZone) return 'right';
        return 'center';
    };

    const handleGesture = useCallback((tapZone: 'left' | 'center' | 'right', tapCount: number) => {
        console.log('Gesture triggered:', { tapZone, tapCount });
        if (!videoRef.current) return;

        // Show visual feedback
        const showIndicator = (zone: 'left' | 'center' | 'right') => {
            const indicator = document.getElementById(`${zone}Indicator`);
            if (indicator) {
                indicator.classList.remove('opacity-0');
                indicator.classList.add('opacity-100');
                setTimeout(() => {
                    indicator.classList.remove('opacity-100');
                    indicator.classList.add('opacity-0');
                }, 200);
            }
        };

        switch (tapCount) {
            case 1:
                // Single tap
                if (tapZone === 'center') {
                    console.log('Single tap center - toggle play/pause, current state:', isPlaying);
                    showIndicator('center');
                    togglePlayPause();
                }
                break;
                
            case 2:
                // Double tap
                if (tapZone === 'left') {
                    console.log('Double tap left - seek backward');
                    showIndicator('left');
                    // Seek backward 10 seconds
                    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                } else if (tapZone === 'right') {
                    console.log('Double tap right - seek forward');
                    showIndicator('right');
                    // Seek forward 10 seconds
                    videoRef.current.currentTime = Math.min(
                        videoRef.current.duration || 0,
                        videoRef.current.currentTime + 10
                    );
                }
                break;
                
            case 3:
                // Triple tap
                console.log('Triple tap:', tapZone);
                if (tapZone === 'center') {
                    console.log('Triple tap center - next video, onNextVideo exists:', !!onNextVideo);
                    // Next video
                    if (onNextVideo) onNextVideo();
                } else if (tapZone === 'right') {
                    console.log('Triple tap right - close, onClose exists:', !!onClose);
                    // Close website
                    if (onClose) onClose();
                } else if (tapZone === 'left') {
                    console.log('Triple tap left - comments, onCommentsToggle exists:', !!onCommentsToggle);
                    // Open comments
                    if (onCommentsToggle) onCommentsToggle();
                }
                break;
        }
    }, [onCommentsToggle, onNextVideo, onClose]);

    const handleContainerClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        console.log('Container clicked!', event);
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const currentTime = Date.now();

        console.log('Click position:', { x, y, width: rect.width });
        console.log('Time since last tap:', currentTime - lastTapTimeRef.current);

        // Check if this is a new tap sequence (more than 500ms since last tap)
        if (currentTime - lastTapTimeRef.current > 500) {
            tapCountRef.current = 0;
            console.log('Reset tap count - new sequence');
        }

        tapCountRef.current++;
        lastTapTimeRef.current = currentTime;
        lastTapPositionRef.current = { x, y };

        console.log('Tap count:', tapCountRef.current);

        // Clear existing timeout
        if (tapTimeoutRef.current) {
            clearTimeout(tapTimeoutRef.current);
        }

        // Set timeout to handle the gesture (wait longer for triple taps)
        tapTimeoutRef.current = setTimeout(() => {
            const tapZone = getTapZone(x, rect.width);
            console.log('Handling gesture:', { tapZone, tapCount: tapCountRef.current });
            handleGesture(tapZone, tapCountRef.current);
            tapCountRef.current = 0;
        }, 600); // Increased timeout to allow for triple taps
    }, [handleGesture]);

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;

        const currentPlan = user?.plan || "Free";
        const timeLimit = PLAN_LIMITS[currentPlan];
        const current = videoRef.current.currentTime;
        
        setCurrentTime(current);
        updateWatchedProgress();

        if (current >= timeLimit) {
            videoRef.current.pause();
            videoRef.current.currentTime = timeLimit;
            
            if (!showUpgradeModal) {
                toast.error(`Time limit reached for ${currentPlan} plan!`);
                setShowUpgradeModal(true);
            }
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handlePlay = () => {
        console.log('Video play event triggered');
        setIsPlaying(true);
        showControlsTemporarily();
    };

    const handlePause = () => {
        console.log('Video pause event triggered');
        setIsPlaying(false);
    };

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.load();
            // Reset playing state when video changes
            setIsPlaying(false);
        }
    }, [src]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (tapTimeoutRef.current) {
                clearTimeout(tapTimeoutRef.current);
            }
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, []);

    // Progress tracking interval
    useEffect(() => {
        if (isPlaying) {
            progressIntervalRef.current = setInterval(() => {
                updateWatchedProgress();
            }, 1000);
        } else {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        }

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, [isPlaying, updateWatchedProgress]);

    // Global mouse event listeners for dragging
    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (isDragging && progressBarRef.current && videoRef.current) {
                const rect = progressBarRef.current.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = Math.max(0, Math.min(1, x / rect.width));
                const newTime = percentage * duration;
                
                videoRef.current.currentTime = newTime;
                setCurrentTime(newTime);
            }
        };

        const handleGlobalMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleGlobalMouseMove);
            document.addEventListener('mouseup', handleGlobalMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging, duration]);

    return (
        <div 
            ref={containerRef}
            className='relative aspect-video bg-black rounded-lg overflow-hidden cursor-pointer'
            onClick={handleContainerClick}
            onMouseMove={showControlsTemporarily}
            onMouseEnter={showControlsTemporarily}
        >
            <video 
                ref={videoRef} 
                className='w-full h-full' 
                controls={false}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={handlePlay}
                onPause={handlePause}
            >
                <source src={src} type='video/mp4'/>
                Your browser does not support the video tag.
            </video>

            {/* Progress Bar */}
            <div 
                ref={progressBarRef}
                className={`absolute bottom-0 left-0 right-0 h-1 bg-gray-600 cursor-pointer z-20 transition-all ${isDragging ? 'h-2' : 'hover:h-2'}`}
                onClick={(e) => {
                    e.stopPropagation();
                    handleProgressClick(e);
                }}
                onMouseDown={handleProgressMouseDown}
                onMouseMove={handleProgressMouseMove}
                onMouseUp={handleProgressMouseUp}
                onMouseEnter={handleProgressMouseEnter}
                onMouseLeave={handleProgressMouseLeave}
            >
                {/* Watched Progress */}
                <div className="relative h-full">
                    {watchedProgress.map((segment, index) => (
                        <div
                            key={index}
                            className="absolute h-full bg-red-600"
                            style={{
                                left: `${segment}%`,
                                width: '1%'
                            }}
                        />
                    ))}
                </div>
                {/* Current Progress */}
                <div 
                    className="absolute top-0 left-0 h-full bg-red-500 transition-all duration-100"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
                {/* Hover Indicator */}
                {isHovering && (
                    <div 
                        className="absolute top-0 h-full bg-white/30 pointer-events-none"
                        style={{ 
                            left: `${duration > 0 ? (hoverTime / duration) * 100 : 0}%`,
                            width: '2px'
                        }}
                    />
                )}
                {/* Drag Handle */}
                {isDragging && (
                    <div 
                        className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg pointer-events-none -translate-x-1/2"
                        style={{ 
                            left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`
                        }}
                    />
                )}
                {/* Time Tooltip */}
                {isHovering && (
                    <div 
                        className="absolute bottom-full mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded pointer-events-none transform -translate-x-1/2 whitespace-nowrap"
                        style={{ 
                            left: `${duration > 0 ? (hoverTime / duration) * 100 : 0}%`
                        }}
                    >
                        {formatTime(hoverTime)}
                    </div>
                )}
            </div>

            {/* Controls Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'} pointer-events-none`}>
                {/* Top controls */}
                <div className="absolute top-4 right-4 flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFullscreen();
                        }}
                        className="pointer-events-auto bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                    </button>
                </div>

                {/* Bottom controls */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-3 pointer-events-auto">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                togglePlayPause();
                            }}
                            className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                        >
                            {isPlaying ? (
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </button>
                        <span className="text-white text-sm">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Gesture indicators */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Left zone indicator */}
                <div className="absolute left-0 top-0 bottom-0 w-[30%] flex items-center justify-start pl-4">
                    <div id="leftIndicator" className="opacity-0 transition-opacity duration-200 bg-white/20 rounded-full p-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </div>
                </div>
                
                {/* Right zone indicator */}
                <div className="absolute right-0 top-0 bottom-0 w-[30%] flex items-center justify-end pr-4">
                    <div id="rightIndicator" className="opacity-0 transition-opacity duration-200 bg-white/20 rounded-full p-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
                
                {/* Center zone indicator */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div id="centerIndicator" className="opacity-0 transition-opacity duration-200 bg-white/20 rounded-full p-4">
                        <svg id="playPauseIcon" className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Overlay if limit reached (Optional, blocks view) */}
            {showUpgradeModal && (
                 <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 text-white p-6 text-center">
                    <h2 className="text-2xl font-bold mb-2">Watch Limit Reached</h2>
                    <p className="mb-4">Upgrade your plan to keep watching.</p>
                    <button 
                        onClick={() => setShowUpgradeModal(true)} // Re-trigger modal open if needed
                        className="bg-red-600 px-6 py-2 rounded-full font-semibold hover:bg-red-700"
                    >
                        View Plans
                    </button>
                 </div>
            )}

            <PremiumModal 
                isOpen={showUpgradeModal} 
                onClose={() => setShowUpgradeModal(false)} 
            />
        </div>
    );
}

export default Videoplayer;