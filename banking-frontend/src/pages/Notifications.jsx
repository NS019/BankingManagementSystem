import { useState } from "react";
import Navbar from "../components/Navbar";
import { useApp } from "../context/AppContext";

export default function Notifications() {
  const { notifications, unreadCount, loading, error, readNotification, readAll } = useApp();
  const [actionError, setActionError] = useState("");

  // Chhota wrapper: har action (ek padha / sab padhe) ka try/catch ek jagah.
  // Pehle error saaf, phir kaam, fail hua toh message. Isse har button par alag try/catch nahi likhna.
  // Aisa na ho toh API fail hone par "unhandled promise rejection" aata hai aur user ko kuch dikhta nahi.
  const run = async (action) => {
    setActionError("");
    try {
      await action();
    } catch {
      setActionError("Update nahi ho paaya. Dobara try karo.");
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 560, margin: "40px auto", padding: "0 16px" }}>
        <h2>Notifications</h2>

        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {actionError && <p role="alert" style={{ color: "crimson" }}>{actionError}</p>}

        {!loading && !error && (
          <>
            {/* disabled jab kuch unread nahi: bekaar API call se bachao. */}
            <button type="button" onClick={() => run(readAll)} disabled={unreadCount === 0}>
              Mark all as read ({unreadCount})
            </button>

            {notifications.length === 0 ? (
              <p>Koi notification nahi hai.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
                {notifications.map((n) => (
                  <li key={n.id} style={{ marginBottom: 8 }}>
                    {/* Poori row <button> hai, <div onClick> nahi. Button keyboard (Tab/Enter) aur
                        screen reader se apne aap chalta hai, div mein ye sab haath se likhna padta. */}
                    <button
                      type="button"
                      className="btn btn--secondary"
                      // Padhi hui notification par dobara API call nahi: sirf unread par.
                      onClick={() => !n.read && run(() => readNotification(n.id))}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: 12,
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        background: n.read ? "white" : "#eaf2ff",
                        cursor: n.read ? "default" : "pointer",
                      }}
                    >
                      {/* Unread ko sirf rang nahi, bold aur ● se bhi dikhaya (color-blind users ke liye). */}
                      <div style={{ fontWeight: n.read ? "normal" : "bold" }}>
                        {!n.read && "● "}
                        {n.title}
                      </div>
                      <div>{n.message}</div>
                      <small style={{ color: "#666" }}>
                        {/* toLocaleString se date user ke hisaab se format hoti hai. */}
                        {new Date(n.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </>
  );
}