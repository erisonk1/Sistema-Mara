import axios from "axios";

const api = axios.create({
  baseURL: "http://0.0.0.0:4000/comandas", // rota base do backend
});

export default api;