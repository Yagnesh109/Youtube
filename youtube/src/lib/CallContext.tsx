import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@/lib/AuthContext";
import SignalingService, { getSignalingService } from "@/services/SignalingService";
import VideoCall from "@/components/VideoCall";
import axiosInstance from "@/lib/axiosinstance";

type CallContextValue = {
  isCallActive: boolean;
  isCallVisible: boolean;
  incomingOffer: RTCSessionDescriptionInit | null;
  incomingFrom: string | null;
  incomingCaller: any | null;
  startOutgoingCall: (targetUserId: string) => void;
  acceptIncomingCall: () => void;
  declineIncomingCall: () => void;
  showCall: () => void;
  hideCall: () => void;
};

const CallContext = createContext<CallContextValue | null>(null);

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const signalingRef = useRef<SignalingService | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCallVisible, setIsCallVisible] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [incomingOffer, setIncomingOffer] = useState<RTCSessionDescriptionInit | null>(null);
  const [incomingFrom, setIncomingFrom] = useState<string | null>(null);
  const [incomingCaller, setIncomingCaller] = useState<any | null>(null);
  const [autoStart, setAutoStart] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    if (!signalingRef.current) {
      signalingRef.current = getSignalingService();
    }
    signalingRef.current.setUserId(user._id);

    const handleIncomingOffer = ({ from, offer }: any) => {
      setIncomingFrom(from);
      setIncomingOffer(offer);
      setTargetUserId(from);
      setAutoStart(false);
      setIsCallVisible(false);
    };

    signalingRef.current.on("call:offer", handleIncomingOffer);
    return () => {
      signalingRef.current?.off("call:offer", handleIncomingOffer);
    };
  }, [user?._id]);

  useEffect(() => {
    const loadCaller = async () => {
      if (!incomingFrom) {
        setIncomingCaller(null);
        return;
      }
      try {
        const { data } = await axiosInstance.get(`/user/public/${incomingFrom}`);
        setIncomingCaller(data);
      } catch (error) {
        console.error("Failed to load caller info:", error);
        setIncomingCaller(null);
      }
    };
    loadCaller();
  }, [incomingFrom]);

  const startOutgoingCall = useCallback((targetId: string) => {
    setIncomingOffer(null);
    setIncomingFrom(null);
    setTargetUserId(targetId);
    setAutoStart(true);
    setIsCallActive(true);
    setIsCallVisible(true);
  }, []);

  const acceptIncomingCall = useCallback(() => {
    if (!incomingFrom) return;
    setTargetUserId(incomingFrom);
    setIsCallActive(true);
    setIsCallVisible(true);
  }, [incomingFrom]);

  const declineIncomingCall = useCallback(() => {
    if (incomingFrom && user?._id) {
      signalingRef.current?.rejectCall(incomingFrom, user._id);
    }
    setIncomingFrom(null);
    setIncomingOffer(null);
    setIncomingCaller(null);
  }, [incomingFrom, user?._id]);

  const showCall = useCallback(() => setIsCallVisible(true), []);
  const hideCall = useCallback(() => setIsCallVisible(false), []);

  const handleEndCall = useCallback(() => {
    setIsCallActive(false);
    setIsCallVisible(false);
    setTargetUserId(null);
    setIncomingFrom(null);
    setIncomingOffer(null);
    setIncomingCaller(null);
    setAutoStart(true);
  }, []);

  const value = useMemo(
    () => ({
      isCallActive,
      isCallVisible,
      incomingOffer,
      incomingFrom,
      incomingCaller,
      startOutgoingCall,
      acceptIncomingCall,
      declineIncomingCall,
      showCall,
      hideCall,
    }),
    [
      isCallActive,
      isCallVisible,
      incomingOffer,
      incomingFrom,
      incomingCaller,
      startOutgoingCall,
      acceptIncomingCall,
      declineIncomingCall,
      showCall,
      hideCall,
    ]
  );

  return (
    <CallContext.Provider value={value}>
      {children}
      {incomingFrom && incomingOffer && !isCallVisible && (
        <div className="fixed right-6 top-24 z-[60] w-80 rounded-xl bg-gray-900 text-white shadow-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
              {incomingCaller?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={incomingCaller.image} alt="Caller" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-semibold">
                  {(incomingCaller?.channelname ||
                    incomingCaller?.name ||
                    incomingCaller?.email ||
                    "C")[0]}
                </span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold">Incoming call</p>
              <p className="text-sm text-gray-300">
                {incomingCaller?.channelname || incomingCaller?.name || "Caller"}
              </p>
              <p className="text-xs text-gray-400">{incomingCaller?.email || incomingFrom}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={acceptIncomingCall}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg"
            >
              Answer
            </button>
            <button
              onClick={declineIncomingCall}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg"
            >
              Hang up
            </button>
          </div>
        </div>
      )}
      {user?._id && targetUserId && isCallActive && (
        <VideoCall
          userId={user._id}
          targetUserId={targetUserId}
          incomingOffer={incomingOffer}
          incomingFromUserId={incomingFrom}
          signalingService={signalingRef.current}
          autoStart={autoStart}
          onEndCall={handleEndCall}
          onHide={hideCall}
          isHidden={!isCallVisible}
        />
      )}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error("useCall must be used within CallProvider");
  }
  return ctx;
};
