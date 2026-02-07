import { io, Socket } from "socket.io-client";

class SignalingService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private lastRegisteredUserId: string | null = null;
  private lastRegisterAt = 0;

  constructor(url?: string) {
    this.connect(url);
  }

  private connect(url?: string) {
    const serverUrl =
      url ||
      process.env.NEXT_PUBLIC_SIGNALING_URL ||
      "http://localhost:5000";

    this.socket = io(serverUrl, {
      autoConnect: true,
    });

    this.socket.on("connect_error", (err) => {
      console.error("Signaling connect_error:", err?.message || err);
    });

    this.socket.on("connect", () => {
      if (this.userId) {
        this.register(this.userId);
      }
    });
  }

  public setUserId(userId: string) {
    this.userId = userId;
    this.register(userId);
  }

  public register(userId: string) {
    if (!this.socket) return;
    if (this.socket.connected) {
      const now = Date.now();
      if (this.lastRegisteredUserId === userId && now - this.lastRegisterAt < 3000) {
        return;
      }
      this.lastRegisteredUserId = userId;
      this.lastRegisterAt = now;
      this.socket.emit("register", { userId });
    }
  }

  public on(type: string, callback: (...args: any[]) => void) {
    this.socket?.on(type, callback);
  }

  public off(type: string, callback: (...args: any[]) => void) {
    this.socket?.off(type, callback);
  }

  public initiateCall(targetUserId: string, offer: RTCSessionDescriptionInit, fromUserId: string) {
    console.log("Signaling: call offer", { from: fromUserId, to: targetUserId });
    this.socket?.emit("call:offer", {
      to: targetUserId,
      from: fromUserId,
      offer,
    });
  }

  public answerCall(targetUserId: string, answer: RTCSessionDescriptionInit, fromUserId: string) {
    this.socket?.emit("call:answer", {
      to: targetUserId,
      from: fromUserId,
      answer,
    });
  }

  public sendIceCandidate(targetUserId: string, candidate: RTCIceCandidateInit, fromUserId: string) {
    this.socket?.emit("ice-candidate", {
      to: targetUserId,
      from: fromUserId,
      candidate,
    });
  }

  public endCall(targetUserId: string, fromUserId: string) {
    this.socket?.emit("call:end", {
      to: targetUserId,
      from: fromUserId,
    });
  }

  public rejectCall(targetUserId: string, fromUserId: string) {
    this.socket?.emit("call:reject", {
      to: targetUserId,
      from: fromUserId,
    });
  }

  public disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

const GLOBAL_KEY = "__youtube_signaling_service__";

export const getSignalingService = () => {
  const globalAny = globalThis as any;
  if (!globalAny[GLOBAL_KEY]) {
    globalAny[GLOBAL_KEY] = new SignalingService();
  }
  return globalAny[GLOBAL_KEY] as SignalingService;
};

export default SignalingService;
