import axios from "axios";

const api = axios.create({
  baseURL: "https://sistema-mara-backend-1.onrender.com/comandas", // rota base do backend
});

export default api;