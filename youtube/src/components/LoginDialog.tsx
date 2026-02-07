import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "sonner";
import axiosInstance from "@/lib/axiosinstance";
import { MapPin, Lock, Phone, Sparkles } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any, token?: string) => void;
  existingUser?: any; // User who needs OTP verification
}

const SOUTH_INDIAN_STATES = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"];

const LoginDialog = ({ isOpen, onClose, onLoginSuccess, existingUser }: LoginDialogProps) => {
  const [step, setStep] = useState<"google" | "detecting" | "mobile_input" | "otp">("google");
  const [tempUser, setTempUser] = useState<any>(null); 
  const [authType, setAuthType] = useState<"email" | "mobile">("email");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState<number>(0);

  // 3. Send OTP
  const initiateOTP = useCallback(async (type: "email" | "mobile", value: string, userEmail: string) => {
      setLoading(true);
      try {
          const res = await axiosInstance.post("/user/send-otp", {
              type,
              email: userEmail, 
              phone: type === 'mobile' ? value : undefined
          });
          setStep("otp");
          setOtp("");
          setOtpHint(null);
          setOtpExpiresAt(null);
          setOtpSecondsLeft(0);
          
          // If OTP is returned in response (development mode), show it
          if (res.data?.debugOTP) {
              toast.success(`OTP sent! Check server console. OTP: ${res.data.debugOTP}`, { duration: 10000 });
              console.log(`[DEV MODE] OTP for ${type}: ${res.data.debugOTP}`);
          } else if (res.data?.otp && res.data?.expiresInSeconds) {
              setOtpHint(res.data.otp);
              const expiresAt = Date.now() + Number(res.data.expiresInSeconds) * 1000;
              setOtpExpiresAt(expiresAt);
              setOtpSecondsLeft(Number(res.data.expiresInSeconds));
              toast.success(`OTP generated. It will hide in ${res.data.expiresInSeconds}s`);
          } else {
              toast.success(`OTP sent to your ${type}`);
          }
      } catch (err: any) {
          const errorMsg = err.response?.data?.message || "Failed to send OTP";
          toast.error(errorMsg);
          console.error("OTP send error:", err);
      } finally {
          setLoading(false);
      }
  }, []);

  useEffect(() => {
    if (!otpExpiresAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000));
      setOtpSecondsLeft(remaining);
      if (remaining <= 0) {
        setOtpHint(null);
        setOtpExpiresAt(null);
        clearInterval(interval);
        toast.info("OTP expired. Request a new OTP.");
      }
    }, 500);
    return () => clearInterval(interval);
  }, [otpExpiresAt]);

  // 2. Location Check
  const detectLocation = useCallback((email: string) => {
    // 🔹 DEBUG MODE: Check for test region in localStorage or URL
    const debugRegion = typeof window !== 'undefined' 
      ? (localStorage.getItem('debug_region') || new URLSearchParams(window.location.search).get('region'))
      : null;
    
    if (debugRegion) {
      const normalized = debugRegion.toLowerCase();
      const isSouthDebug =
        normalized === 'south' ||
        SOUTH_INDIAN_STATES.some(
          (state) => state.toLowerCase() === normalized
        );

      console.log(`[DEBUG MODE] Simulating region: ${debugRegion}`);
      if (isSouthDebug) {
        setAuthType("email");
        initiateOTP("email", email, email);
        toast.info(`[DEBUG] Simulating South India - Email OTP`);
        return;
      } else {
        setAuthType("mobile");
        setStep("mobile_input");
        toast.info(`[DEBUG] Simulating Non-South India - Mobile OTP`);
        return;
      }
    }

    if (!navigator.geolocation) {
      setAuthType("mobile");
      setStep("mobile_input");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const state = data.address?.state;

          console.log(`[Location] Detected state: ${state}`); // Debug log

          if (state && SOUTH_INDIAN_STATES.includes(state)) {
            // South -> Email OTP
            setAuthType("email");
            initiateOTP("email", email, email);
            toast.success(`Location detected: ${state} - Using Email OTP`);
          } else {
            // North -> Mobile OTP
            setAuthType("mobile");
            setStep("mobile_input");
            toast.info(`Location detected: ${state || "Other"} - Using Mobile OTP`);
          }
        } catch (error) {
          console.error("Location detection error:", error);
          setAuthType("mobile");
          setStep("mobile_input");
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setAuthType("mobile");
        setStep("mobile_input");
      }
    );
  }, [initiateOTP]);

  // If existingUser is provided, skip Google sign-in and go to location detection
  useEffect(() => {
    if (existingUser && isOpen) {
      setTempUser(existingUser);
      setStep("detecting");
      detectLocation(existingUser.email);
    } else if (isOpen && !existingUser) {
      // Reset state when dialog opens fresh
      setStep("google");
      setTempUser(null);
      setMobileNumber("");
      setOtp("");
    }
  }, [existingUser, isOpen, detectLocation]);

  // 1. Google Sign In
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Backend call to create/find user
      const res = await axiosInstance.post("/user/google", {
        name: user.displayName,
        email: user.email,
        image: user.photoURL
      });
      
      setTempUser(res.data.result);
      setStep("detecting");
      
      // Pass email to detection to use it if South India
      detectLocation(res.data.result.email);
      
    } catch (error) {
      console.error(error);
      toast.error("Google Sign-In failed. Check backend console.");
    }
  };

  const handleMobileSubmit = () => {
      if(!mobileNumber || mobileNumber.length < 10) return toast.error("Invalid Mobile Number");
      if (!tempUser?.email) return toast.error("User email not found");
      initiateOTP("mobile", mobileNumber, tempUser.email);
  };

  // 4. Verify & Finish
  const handleVerify = async () => {
      setLoading(true);
      try {
          const res = await axiosInstance.post("/user/verify-otp", {
              type: authType,
              email: tempUser.email,
              phone: authType === 'mobile' ? mobileNumber : undefined,
              otp
          });
          
          // Complete Login
          onLoginSuccess(res.data.result, res.data.token);
          onClose();
          toast.success("Login Successful");
      } catch (err) {
          toast.error("Invalid OTP");
      } finally {
          setLoading(false);
      }
  };

  const handleResendOTP = () => {
    if (!tempUser?.email) return toast.error("User email not found");
    if (authType === "mobile") {
      if (!mobileNumber || mobileNumber.length < 10) return toast.error("Invalid Mobile Number");
      initiateOTP("mobile", mobileNumber, tempUser.email);
    } else {
      initiateOTP("email", tempUser.email, tempUser.email);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-2xl p-0 overflow-hidden border border-gray-800 bg-[#0b0f14] text-white"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="grid md:grid-cols-2">
          <div className="relative p-6 md:p-8 bg-[#0b0f14] border-b md:border-b-0 md:border-r border-gray-800">
            <div className="relative">
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Welcome back to your YouTube Clone
              </h2>
              <p className="mt-2 text-sm text-gray-300">
                Sign in to continue to your account. This helps keep your experience secure.
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8 bg-[#0b0f14]">
            <DialogHeader>
              <DialogTitle className="text-left text-xl text-white">
                Authentication
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4 flex flex-col gap-4">
              {step === "google" && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">
                    Continue with Google to verify your identity and location.
                  </p>
                  <Button
                    onClick={handleGoogleLogin}
                    className="w-full bg-white text-gray-900 hover:bg-gray-100"
                  >
                    Sign in with Google
                  </Button>
                </div>
              )}

              {step === "detecting" && (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-gray-800 bg-[#0f172a] p-4">
                  <MapPin className="animate-bounce w-8 h-8 text-sky-300"/>
                  <p className="text-sm text-gray-300">Verifying Region...</p>
                </div>
              )}

              {step === "mobile_input" && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">Please provide your mobile number.</p>
                  <div className="flex items-center border border-gray-800 rounded px-3 py-2 bg-[#0f172a]">
                    <Phone className="w-4 h-4 text-gray-400 mr-2"/>
                    <Input 
                      placeholder="Mobile Number" 
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="border-0 focus-visible:ring-0 bg-transparent text-white placeholder:text-gray-500"
                    />
                  </div>
                  <Button onClick={handleMobileSubmit} disabled={loading} className="w-full bg-sky-600 hover:bg-sky-500">
                    {loading ? "Sending..." : "Send OTP"}
                  </Button>
                </div>
              )}

              {step === "otp" && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">Enter OTP sent to your {authType}.</p>
                  {authType === "mobile" && otpHint && (
                    <div className="rounded-md border border-emerald-900/60 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
                      OTP: <span className="font-semibold tracking-widest">{otpHint}</span>
                      {otpExpiresAt && (
                        <span className="ml-2 text-emerald-300/80">({otpSecondsLeft}s)</span>
                      )}
                    </div>
                  )}
                  {authType === "mobile" && !otpHint && (
                    <div className="rounded-md border border-amber-900/60 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
                      OTP expired or hidden. Please request a new OTP.
                    </div>
                  )}
                  <div className="flex items-center border border-gray-800 rounded px-3 py-2 bg-[#0f172a]">
                    <Lock className="w-4 h-4 text-gray-400 mr-2"/>
                    <Input 
                      placeholder="Enter 6-digit OTP" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="border-0 focus-visible:ring-0 bg-transparent text-white placeholder:text-gray-500"
                    />
                  </div>
                  <Button onClick={handleVerify} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500">
                    {loading ? "Verifying..." : "Verify & Login"}
                  </Button>
                  <Button
                    onClick={handleResendOTP}
                    variant="outline"
                    className="w-full border-gray-800 text-gray-300 hover:bg-[#111827]"
                  >
                    Resend OTP
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
