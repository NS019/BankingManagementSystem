import { Link } from "react-router-dom";

// Galat URL par (jaise /abc) ye page dikhta hai. Ye na ho toh user ko blank screen milti hai.
export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <h1 style={{ margin: 0 }}>404</h1>
        <p>Ye page nahi mila.</p>
        {/* Token ho ya na ho, /dashboard par bhejo. Token nahi hoga toh ProtectedRoute khud Login par bhej dega. */}
        <Link to="/dashboard">Wapas Dashboard par jao</Link>
      </div>
    </div>
  );
}