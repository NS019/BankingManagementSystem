import { useEffect, useState } from "react";
// useParams: URL ke dynamic hisse ko object ki tarah deta hai.
// Route "/accounts/:id" par URL "/accounts/2" ho toh { id: "2" } milta hai.
// Link ke saath wapas jaane ka button bhi banayenge.
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getAccountById, getTransactions } from "../api/accountService";

export default function AccountDetails() {
  // Destructuring: params object se sirf "id" nikaala. Naam wahi hona chahiye
  // jo Route ke path mein ":id" likha hai, warna undefined milega.
  const { id } = useParams();

  const [account, setAccount] = useState(null);       // null: abhi data nahi aaya (object expect hai, array nahi)
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        // Promise.all: dono calls EK SAATH bhejta hai, ek ke baad ek nahi.
        // Dono 400ms leti hain: sequential mein 800ms lagte, parallel mein 400ms.
        // Real app mein ye bada faayda hai. Dhyan do: ek bhi fail hui toh dono ka result jaata hai.
        // Agar dono independent hain aur ek fail hone par bhi doosra dikhana ho, toh
        // Promise.allSettled use karte hain.
        const [acc, list] = await Promise.all([getAccountById(id), getTransactions(Number(id))]);
        setAccount(acc);
        setTxns(list);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
    // Dependency [id]: jab URL ka id badle (/accounts/1 se /accounts/2), effect dobara chale.
    // Agar [] rakhte, toh component wahi rehta hai aur purana data dikhta rehta.
  }, [id]);
console.log("account value:", account);
  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 640, margin: "40px auto", padding: "0 16px" }}>
        <Link to="/dashboard">← Back to accounts</Link>

        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* account && ... : account null ho (loading ke time) toh neeche ka JSX nahi chalega.
            Ye check na ho toh account.type par "Cannot read properties of null" crash aata hai.
            Ye React ke sabse common runtime errors mein se ek hai. */}
        {account && (
          <>
            <h2>{account.type} Account</h2>
            <p style={{ color: "#666" }}>{account.accountNumber} · {account.status}</p>
            <h1>₹{account.balance.toLocaleString("en-IN")}</h1>

            <h3>Statement</h3>
            {txns.length === 0 ? (
              // Empty state ko hamesha handle karo, warna user ko khaali table dikhti hai
              // aur lagta hai kuch toot gaya.
              <p>Koi transaction nahi mila.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "2px solid #ccc" }}>
                    <th>Date</th>
                    <th>Description</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {txns.map((t) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td>{t.date}</td>
                      <td>{t.description}</td>
                      {/* Credit hara (+), Debit laal (-). Sirf rang par bharosa nahi karte
                          (color-blind users ke liye), isliye +/- sign bhi dikhaya.
                          Ye accessibility ka chhota par zaroori rule hai. */}
                      <td style={{ textAlign: "right", color: t.type === "CREDIT" ? "green" : "crimson" }}>
                        {t.type === "CREDIT" ? "+" : "-"}₹{t.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </>
  );
}