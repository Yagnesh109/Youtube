import axios from "axios";
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Add request interceptor to include user ID and token in headers
axiosInstance.interceptors.request.use(
  (config) => {
    // Get user data and token from localStorage
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");
      
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user && user._id) {
            config.headers['x-user-id'] = user._id;
          }
        } catch (err) {
          console.log("Error parsing stored user for request:", err);
        }
      }
      
      if (storedToken) {
        config.headers['Authorization'] = `Bearer ${storedToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
