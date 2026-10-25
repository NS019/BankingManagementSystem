import { createContext, useContext } from "react";

// createContext(null): notice board bana diya, abhi khaali. null default isliye ki agar koi
// component Provider ke BAHAR use kare toh hum neeche saaf error de sakein.
// Ye file sirf context + hook rakhti hai (koi component nahi), kyunki Vite ka
// "react-refresh" lint rule ek hi file mein component aur non-component exports par
// warning deta hai. Isliye Provider alag file mein hai.
export const AppContext = createContext(null);

// Custom hook: har page mein useContext(AppContext) likhne ki jagah sirf useApp().
// Faayda: null check ek jagah, aur kal ko context ka naam badle toh sirf yahi file badalegi.
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    // Provider bhoolne par chup-chaap undefined se crash hone ki jagah saaf message milta hai.
    throw new Error("useApp sirf <AppProvider> ke andar use ho sakta hai");
  }
  return ctx;
}