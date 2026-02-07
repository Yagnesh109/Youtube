import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase.js";
import axiosInstance from "./axiosinstance";
import LoginDialog from "@/components/LoginDialog"; // Ensure this path is correct based on your project structure

const UserContext = createContext();

const SOUTH_INDIAN_STATES = [
  "Tamil Nadu",
  "Kerala",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
];

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 1. Dynamic Theming Logic (IST + Region Based)
  const applyDynamicTheme = useCallback(() => {
    if (typeof window === "undefined") return;

    // Clear any existing theme classes and attributes first to avoid conflicts
    document.documentElement.classList.remove("dark");
    document.documentElement.removeAttribute("data-theme");
    
    // Default to dark mode initially (will be overridden if conditions are met)
    let shouldBeDark = true;

    // 🔹 DEBUG OVERRIDE: Check for debug flags FIRST (allows overriding time check)
    const debugRegion =
      (typeof window !== "undefined" &&
        (localStorage.getItem("debug_region") ||
          new URLSearchParams(window.location.search).get("region"))) ||
      null;
    const debugTimeOverride =
      typeof window !== "undefined" &&
      localStorage.getItem("debug_time_override") === "true";

    // Always calculate time in IST (UTC+5:30)
    // Method: Get UTC time, then add 5.5 hours for IST
    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000; // Convert to UTC
    const istTime = new Date(utcTime + 5.5 * 60 * 60 * 1000); // Add 5.5 hours for IST
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const istTimeString = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} IST`;

    // Also show in 12-hour format for clarity
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? "PM" : "AM";
    const istTimeString12 = `${hour12}:${String(minutes).padStart(2, "0")} ${ampm} IST`;

    const isTimeInRange = hours >= 10 && hours < 12; // 10:00–11:59 IST (10:00 AM - 11:59 AM)

    console.log(`[Theme Debug] Current IST Time: ${istTimeString} (${istTimeString12})`);
    console.log(
      `[Theme Debug] Time in range (10:00 AM - 11:59 AM IST): ${isTimeInRange} ${
        isTimeInRange ? "✅" : "❌ (Current time is outside 10:00 AM - 11:59 AM IST)"
      }`
    );
    console.log(`[Theme Debug] Debug Region: ${debugRegion || "none"}`);
    console.log(`[Theme Debug] Debug Time Override: ${debugTimeOverride}`);

    // If debug region is set, allow overriding time check
    if (debugRegion) {
      const normalized = debugRegion.toLowerCase();
      const isSouthDebug =
        normalized === "south" ||
        SOUTH_INDIAN_STATES.some(
          (state) => state.toLowerCase() === normalized
        );

      console.log(`[Theme Debug] Is South (debug): ${isSouthDebug}`);

      // If time override is enabled OR time is in range, apply theme based on region
      if (debugTimeOverride || isTimeInRange) {
        if (isSouthDebug) {
          // Simulate South India → Light theme
          shouldBeDark = false;
          console.log(`[Theme Debug] ✅ Applied LIGHT theme (South India debug)`);
        } else {
          // Simulate non‑South India → Dark theme
          shouldBeDark = true;
          console.log(`[Theme Debug] ✅ Applied DARK theme (Non-South debug)`);
        }
      } else {
        // Time not in range and no override → Dark theme
        shouldBeDark = true;
          console.log(
            `[Theme Debug] ⚠️ Applied DARK theme (Time ${istTimeString} (${istTimeString12}) is outside 10:00 AM - 11:59 AM IST range. Set localStorage.setItem("debug_time_override", "true") to override)`
          );
      }
      
      // Apply theme (both class and data attribute for reliability)
      if (shouldBeDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-theme", "light");
      }
      console.log(`[Theme Debug] Theme applied: ${shouldBeDark ? "DARK" : "LIGHT"} (class: ${document.documentElement.classList.contains("dark") ? "dark" : "no-dark"})`);
      return;
    }

    // No debug mode → check real time
    if (!isTimeInRange) {
      // Any time outside 10–12 IST must be dark
      shouldBeDark = true;
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      console.log(
      `[Theme Debug] ⚠️ Applied DARK theme (Current time ${istTimeString} (${istTimeString12}) is outside 10:00 AM - 11:59 AM IST range)`
    );
      return;
    }

    // Time is in range → check real location
    console.log(`[Theme Debug] Checking real location...`);
    try {
      if (!("geolocation" in navigator)) {
        document.documentElement.classList.add("dark");
        console.log(`[Theme Debug] ⚠️ Geolocation not available → DARK theme`);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
            );
            const data = await res.json();
            const state = data.address?.state;

            console.log(`[Theme Debug] Detected state: ${state || "unknown"}`);

            if (state && SOUTH_INDIAN_STATES.includes(state)) {
              // South India + 10–12 IST → Light theme
              document.documentElement.classList.remove("dark");
              document.documentElement.setAttribute("data-theme", "light");
              console.log(`[Theme Debug] ✅ Applied LIGHT theme (South India: ${state})`);
            } else {
              // Any other region in this time window → Dark theme
              document.documentElement.classList.add("dark");
              document.documentElement.setAttribute("data-theme", "dark");
              console.log(
                `[Theme Debug] ✅ Applied DARK theme (Non-South: ${state || "unknown"})`
              );
            }
          } catch (apiError) {
            console.error("[Theme Debug] Location API Error:", apiError);
            document.documentElement.classList.add("dark");
            console.log(`[Theme Debug] ⚠️ Applied DARK theme (API error)`);
          }
        },
        (err) => {
          console.log("[Theme Debug] Location access denied or unavailable:", err);
          document.documentElement.classList.add("dark");
          console.log(`[Theme Debug] ⚠️ Applied DARK theme (Location denied)`);
        }
      );
    } catch (e) {
      console.error("[Theme Debug] Geolocation error:", e);
      document.documentElement.classList.add("dark");
      console.log(`[Theme Debug] ⚠️ Applied DARK theme (Geolocation error)`);
    }
    
    // Final fallback: ensure theme is applied
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Run once on initial load
  useEffect(() => {
    applyDynamicTheme();
  }, [applyDynamicTheme]);

  // 2. Load User and Token from LocalStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (err) {
          console.log("Error parsing stored user:", err);
          localStorage.removeItem("user");
        }
      }
      if (storedToken) {
        setToken(storedToken);
      }
    }
    setLoading(false);
  }, []);

  // 3. Auth Actions
  const login = useCallback(
    (userData, userToken = null) => {
      console.log("Login function called with:", userData);
      setUser(userData);
      if (userToken) {
        setToken(userToken);
        if (typeof window !== "undefined") {
          localStorage.setItem("token", userToken);
        }
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(userData));
      }

      // Re‑apply theme on every successful login so that
      // time + region at login control the experience.
      applyDynamicTheme();
    },
    [applyDynamicTheme]
  );

  const refreshUser = useCallback((partial) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
    try {
      await signOut(auth); // Sign out from Firebase if linked
    } catch (err) {
      console.log("Logout error:", err);
    }
  }, []);

  // 4. Trigger the Region-Based Auth Modal
  // Replaces the old Firebase Popup flow
  const handleAuthStateChange = useCallback((userData) => {
    if(userData) {
        login(userData); // If data passed, log them in
    } else {
        setShowLoginModal(true); // Else show modal
    }
  }, [login]);

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        refreshUser,
        logout,
        handleAuthStateChange,
      }}
    >
      {children}
      
      {/* Render the Login Dialog controlled by state */}
      <LoginDialog
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={(userData, userToken) => {
          login(userData, userToken);
          setShowLoginModal(false);
        }}
      />
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
