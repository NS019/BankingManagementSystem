// Link: React Router ka <a> tag. Normal <a href> page ko POORA reload kar deta hai
// (SPA ka faayda khatam, state bhi ud jaati hai). Link sirf URL badalta hai aur
// React Router baaki kaam karta hai. Angular ka routerLink.
import { Link } from "react-router-dom";

// Ab "id" bhi props mein le rahe hain, kyunki Dashboard ne {...acc} spread kiya tha,
// toh id already aa rahi hai. Bas ab use karna hai.
export default function AccountCard({ id, accountNumber, type, balance }) {
  return (
    // Poore card ko Link ke andar daala, taaki kahin bhi click karo toh chale.
    // Template literal (backticks) mein ${id} se dynamic URL: /accounts/2 jaisa.
    <Link to={`/accounts/${id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 12, cursor: "pointer" }}>
        <h3>{type} Account</h3>
        <p style={{ color: "#666", margin: 0 }}>{accountNumber}</p>
        <p style={{ fontSize: 20, margin: "8px 0 0" }}>₹{balance.toLocaleString("en-IN")}</p>
      </div>
    </Link>
  );
}