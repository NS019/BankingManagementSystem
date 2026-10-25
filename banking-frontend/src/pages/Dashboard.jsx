// useEffect = "component screen par aane ke baad ye kaam karo". Angular ke ngOnInit
// jaisa. API call, timers, subscriptions yahin hote hain.
import { useEffect, useState } from "react";
import AccountCard from "../components/AccountCard";
import Navbar from "../components/Navbar";
import { getAccounts } from "../api/accountService";

export default function Dashboard() {
  // 3 state chahiye kyunki asli API ke 3 haalat hote hain:
  // data aaya, abhi aa raha hai (loading), ya fail ho gaya (error).
  // Inme se koi ek bhi bhool gayi toh user ko blank screen dikhti hai.
  const [accounts, setAccounts] = useState([]);   // [] se shuru: .map() empty array par bhi crash nahi karta
  const [loading, setLoading] = useState(true);   // true se shuru: pehle render par hi "Loading" dikhe
  const [error, setError] = useState("");

  // Dusra argument [] = "sirf ek baar, component pehli baar dikhne par chalao".
  // [] hata diya toh effect har render par chalega, setAccounts se re-render,
  // phir effect... ye INFINITE LOOP ban jaata hai aur server par hazaaron calls jaati hain.
  // Dhyan do: development mein React StrictMode effect ko 2 baar chalata hai
  // (bug pakadne ke liye). Ye sirf dev mein hota hai, production mein ek hi baar.
  useEffect(() => {
    // useEffect ka function seedha async nahi ho sakta, isliye andar ek alag function banaya.
    const load = async () => {
      try {
        const data = await getAccounts();
        setAccounts(data);
      } catch (e) {
        // Real API fail ho sakti hai (network, 500 error). User ko saaf message dikhate hain,
        // raw error nahi, kyunki raw error mein internal details leak ho sakti hain.
        setError("Accounts load nahi ho paaye. Dobara try karo.");
      } finally {
        // finally success ho ya fail, dono mein chalta hai, isliye spinner hamesha band hoga.
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 480, margin: "40px auto" }}>
        <h2>My Accounts</h2>

        {/* Conditional rendering: ek hi jagah teen haalat. Angular ke *ngIf / else jaisa.
            && ka matlab: left side true ho tabhi right side dikhao. */}
        {loading && <p>Loading accounts...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {accounts.map((acc) => (
          <AccountCard key={acc.id} {...acc} />
        ))}
      </div>
    </>
  );
}