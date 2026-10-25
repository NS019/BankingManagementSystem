import { useCallback, useEffect, useMemo, useState } from "react";
import { AppContext } from "./AppContext";
import { getProfile, submitKyc, getNotifications, markAsRead, markAllAsRead } from "../api/profileService";

// Provider = notice board ka malik. Data yahan rehta hai, aur "children" (andar ke saare pages)
// use padh sakte hain. children = jo tag iske andar likha jaayega.
export default function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true); // true se shuru: pehle render par hi "Loading" dikhe
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false; // purani request ka jawab naye data ko overwrite na kare

    const load = async () => {
      try {
        // Dono calls ek saath (Promise.all), sequential nahi: total time kam.
        const [profile, list] = await Promise.all([getProfile(), getNotifications()]);
        if (!ignore) {
          setUser(profile);
          setNotifications(list);
        }
      } catch {
        if (!ignore) setError("Profile load nahi ho paayi. Page refresh karo.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();

    return () => {
      ignore = true;
    };
  }, []);
  // [] = Provider mount hone par ek baar. Provider ProtectedRoute ke andar hai, toh logout par
  // unmount hota hai aur dobara login par FRESH mount hota hai, naya fetch hota hai.
  // Agar Provider App ke sabse upar hota, toh logout ke baad bhi purane user ka data memory
  // mein reh jaata aur agla user (shared computer par) use dekh sakta. Ye security bug hota.

  // useCallback: har render par naya function banne se rokta hai. Neeche value object mein
  // ye functions jaate hain. Naye function = naya value object = saare consumers
  // (Navbar, pages) bekaar mein re-render hote. [] kyunki ye sirf set... functions
  // (jo React guarantee karta hai ki kabhi nahi badalte) aur service functions use karte hain.
  const completeKyc = useCallback(async (details) => {
    const updated = await submitKyc(details); // fail hua toh error upar caller (Profile page) pakdega
    setUser(updated);
    // KYC submit se backend ne naya notification banaya, wo list mein laao.
    // Production mein ye real-time hota hai (WebSocket / SSE / polling).
    setNotifications(await getNotifications());
  }, []);

  const readNotification = useCallback(async (id) => {
    await markAsRead(id);
    // Server confirm kare tabhi UI badlo. Alternate: "optimistic update" (pehle UI badlo,
    // fail hone par wapas karo): zyada smooth lagta hai par rollback ka code likhna padta hai.
    // prev => ... "functional update": hamesha latest list par kaam karta hai (stale bug nahi).
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const readAll = useCallback(async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Derived state: unread count alag state NAHI hai, list se nikala jaata hai (Batch 5 wala rule).
  // Alag state hoti toh list aur count kabhi out-of-sync ho jaate.
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  // value object ko useMemo mein rakha. Bina useMemo ke har render par naya object banta, aur
  // Context ke SAARE consumers re-render hote chahe data na badla ho.
  // SCALING NOTE: Context ki ek limitation hai: value ka koi bhi hissa badle toh saare
  // consumers re-render hote hain (user badla toh Notifications page bhi). Bade app mein
  // contexts alag karte hain (UserContext, NotificationContext), ya server data ke liye
  // React Query / SWR aur client state ke liye Zustand / Redux Toolkit use hota hai.
  // Hamare chhote app ke liye ek context kaafi hai.
  const value = useMemo(
    () => ({ user, notifications, unreadCount, loading, error, completeKyc, readNotification, readAll }),
    [user, notifications, unreadCount, loading, error, completeKyc, readNotification, readAll]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}