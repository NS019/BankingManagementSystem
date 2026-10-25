// axios ek HTTP client library hai. Angular ka HttpClient yahi kaam karta hai.
// Alternate: browser ka built-in fetch(). Humne axios chuna kyunki isme
// interceptors (har request par automatic kaam) aur JSON parsing built-in hai.
import axios from "axios";

// axios.create() se ek CUSTOM instance banta hai jiski settings sab requests par lagti hain.
// Alternate: har jagah axios.get("http://...") likhna, jisme URL 50 jagah repeat hoga.
const axiosClient = axios.create({
  // import.meta.env Vite ka tareeka hai environment variables padhne ka.
  // Variable ka naam VITE_ se shuru hona zaroori hai, warna Vite use frontend ko nahi deta
  // (security, taaki galti se secret leak na ho).
  // Production mein alag URL (api.mybank.com) .env.production se aayega, code nahi badalna padega.
  // Abhi backend nahi hai, toh fallback localhost:8080 (hamara future API Gateway).
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
});

// Interceptor = har request jaane se PEHLE chalne wala function. Angular ka HttpInterceptor.
axiosClient.interceptors.request.use((config) => {
  // Token localStorage se padhte hain. Dhyan do: localStorage mein JWT rakhna seekhne
  // ke liye theek hai, par XSS attack mein JS token chura sakta hai. Real banking
  // app mein httpOnly secure cookie use hoti hai, jise JS padh hi nahi sakta.
  // Hum backend ready hone par is par wapas aayenge.
  const token = localStorage.getItem("token");

  // Token ho tabhi header lagao, warna login call jaise public endpoints par bhi
  // faltu header chala jaata.
  if (token) {
    // "Bearer " standard format hai (RFC 6750). Spring Security ka JWT filter yahi expect karega.
    config.headers.Authorization = `Bearer ${token}`;
  }

  // config WAPAS return karna zaroori hai, warna request wahin atak jaayegi.
  return config;
});

export default axiosClient;