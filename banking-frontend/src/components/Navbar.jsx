// NavLink = Link + "active" ki samajh. Jis page par ho, uska link highlight hota hai.
import { NavLink, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

// NavLink ki className ek FUNCTION le sakti hai, jise { isActive } milta hai.
// Function component ke bahar hai, kyunki isme state ya props ka koi kaam nahi.
const linkClass = ({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`;

export default function Navbar() {
  const navigate = useNavigate();
  const { user, unreadCount } = useApp(); // Context se seedha, koi prop nahi

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/", { replace: true }); // replace: Back dabane par protected page wapas na khule
  };

  const firstName = user?.name?.split(" ")[0]; // user abhi load ho raha ho (null) toh crash nahi

  return (
    <nav className="navbar">
      <div className="nav-group">
        <strong>🏦 My Bank</strong>
        <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
        <NavLink to="/transfer" className={linkClass}>Transfer</NavLink>
        <NavLink to="/deposit-withdraw" className={linkClass}>Deposit / Withdraw</NavLink>
        <NavLink to="/history" className={linkClass}>History</NavLink>
      </div>

      <div className="nav-group">
        {/* aria-label: screen reader sirf "bell" nahi, "2 unread" bhi bolega. */}
        <NavLink to="/notifications" className={linkClass} aria-label={`Notifications, ${unreadCount} unread`}>
          🔔
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </NavLink>
        <NavLink to="/profile" className={linkClass}>{firstName ? `Hi, ${firstName}` : "Profile"}</NavLink>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}