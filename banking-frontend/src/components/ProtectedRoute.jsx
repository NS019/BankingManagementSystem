// Outlet: "yahan child route ka page dikhao" ka placeholder. Angular ke <router-outlet> jaisa.
// Ye component ab "layout route" hai: bouncer + notice board ek baar, andar ke saare pages automatic.
import { Navigate, Outlet } from "react-router-dom";
import AppProvider from "../context/AppProvider";

export default function ProtectedRoute() {
  const token = localStorage.getItem("token");

  // Token nahi toh Login par bhej do. "replace" se Back dabane par blocked page wapas nahi aata.
  // (Ye sirf UX hai, asli security backend ke token check se aati hai.)
  if (!token) return <Navigate to="/" replace />;

  // Token hai: Provider lagao, aur uske andar child page (Outlet) dikhao.
  // Provider sirf login ke baad mount hota hai, isliye profile fetch bhi tabhi hota hai.
  return (
    <AppProvider>
      <Outlet />
    </AppProvider>
  );
}