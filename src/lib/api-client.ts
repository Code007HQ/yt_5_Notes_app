import axios from "axios";

const api = axios.create({
  baseURL: "https://notes-app-backend-bad2.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
