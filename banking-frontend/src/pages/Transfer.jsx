// useCallback ki ab zaroorat nahi, kyunki loader effect ke andar chala gaya.
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getAccounts, transferFunds } from "../api/accountService";

// Pure validation function, component ke BAHAR: input do, errors object lo.
// Bahar rakhne se har render par dobara nahi banti aur alag se test ho sakti hai.
// Empty object return hua matlab sab theek.
function validate(form, selectedAccount) {
  const errors = {};
  if (!form.fromAccountId) errors.fromAccountId = "Source account chuno";

  // trim() se sirf spaces wala input bhi "empty" maana jaata hai.
  if (!form.toAccountNumber.trim()) errors.toAccountNumber = "Beneficiary account number daalo";
  else if (form.toAccountNumber.trim().length < 8)
    errors.toAccountNumber = "Account number kam se kam 8 characters ka hona chahiye";

  // Input ki value hamesha STRING hoti hai, isliye Number() se convert.
  // Number("") = 0 aur Number("abc") = NaN, dono neeche ek hi check se pakad jaate hain.
  const amount = Number(form.amount);
  if (!amount || amount <= 0) errors.amount = "Valid amount daalo (0 se zyada)";
  else if (selectedAccount && amount > selectedAccount.balance) errors.amount = "Balance kam hai";

  return errors;
}

// Ye component Transfer ke BAHAR hai, toh file load hote hi sirf ek baar banta hai.
// Andar define karte toh har render par naya component banta, React purana destroy
// karke naya mount karta (performance girti, aur input hota toh focus ud jaata).
function FieldError({ message }) {
  if (!message) return null; // null return = React kuch render nahi karta
  return <small style={{ color: "crimson" }}>{message}</small>;
}

export default function Transfer() {
  const [accounts, setAccounts] = useState([]);

  // Poora form ek object mein: 10 fields ho toh 10 useState nahi chahiye.
  // Alternate: alag useState (chhote form mein theek) ya React Hook Form
  // (production mein bade forms ke liye, kyunki wo har keystroke par re-render nahi karti).
  const [form, setForm] = useState({
    fromAccountId: "",
    toAccountNumber: "",
    amount: "",
    remark: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false); // double-click se double debit rokne ke liye
  const [result, setResult] = useState(null); // { type: "success" | "error", message }

  // reloadKey ek "doorbell" hai. Isse badalte hi neeche ka effect dobara chalta hai
  // aur accounts refresh ho jaate hain. Hum effect ke bahar wala function call nahi
  // kar sakte, kyunki naya lint rule use "effect mein turant setState" maan leta hai.
  // Alternate: poora loader dobara likhna (duplicate code), ya React Query / SWR
  // jaisi library jo refetch khud sambhalti hai (production mein yahi use hoti hai).
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // ignore flag: agar user data aane se pehle page chhod de (ya React StrictMode
    // dev mein effect do baar chalaye), toh purani request ka jawab state mein na jaaye.
    // Isse "setState on unmounted component" aur purana data naye data ko overwrite
    // karne wale race-condition bug se bachte hain. Production mein AbortController
    // se request hi cancel kar dete hain (axios mein signal pass karke).
    let ignore = false;

    // Loader effect ke ANDAR hai: setState await ke BAAD (asynchronously) chalta hai,
    // aur lint ko ye saaf dikhta hai, isliye "synchronously within effect" error nahi aata.
    const load = async () => {
      try {
        const data = await getAccounts();
        if (!ignore) setAccounts(data);
      } catch {
        // Dropdown load na ho toh user ko batana zaroori hai, warna form khaali
        // dikhega aur wo samjhega app kharab hai.
        if (!ignore) setResult({ type: "error", message: "Accounts load nahi ho paaye. Page refresh karo." });
      }
    };
    load();

    // Cleanup function: component hatne par ya effect dobara chalne se pehle chalta hai.
    // Angular ke ngOnDestroy / unsubscribe jaisa.
    return () => {
      ignore = true;
    };
  }, [reloadKey]); // reloadKey badle toh effect dobara chale. Pehli baar bhi chalta hai (0 se shuru).

  // EK handler sab inputs ke liye. Input ka "name" form ki key se match karta hai.
  // [e.target.name] = computed property name (name="amount" ho toh { amount: ... }).
  // ...form = purani saari values copy, sirf ek field overwrite.
  // state ko seedha badalna (form.amount = 5) GALAT hai, React ko pata nahi chalta
  // aur screen update nahi hoti. Hamesha naya object banao (immutability).
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setResult(null); // user dobara type kare toh purana message hata do
  };

  // Chuna hua account. Accounts aaye nahi ya kuch chuna nahi toh undefined,
  // jise validate() sambhal leta hai.
  const selectedAccount = accounts.find((a) => a.id === Number(form.fromAccountId));

  const handleSubmit = async (e) => {
    e.preventDefault(); // page reload roko

    const validationErrors = validate(form, selectedAccount);
    setErrors(validationErrors);

    // Koi galti hai toh yahin ruk jao, API mat bulao.
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await transferFunds({
        fromAccountId: form.fromAccountId,
        toAccountNumber: form.toAccountNumber.trim(),
        amount: Number(form.amount), // API ko string nahi, number bhejo
        remark: form.remark,
      });
      setResult({ type: "success", message: `Transfer successful! Reference: ${res.referenceId}` });

      // Form saaf karo (source account rehne do, user aksar wahi dobara use karta hai).
      setForm({ ...form, toAccountNumber: "", amount: "", remark: "" });

      // Doorbell bajao: effect dobara chalega aur dropdown mein naya balance aayega.
      // (k) => k + 1 "functional update" hai: hamesha latest value par +1 karta hai,
      // stale value ka bug nahi hota.
      setReloadKey((k) => k + 1);
    } catch (err) {
      // Backend ka message dikhate hain (jaise "Insufficient balance").
      // Production mein sirf safe, pehle se tay messages dikhate hain, raw server error nahi.
      setResult({ type: "error", message: err.message });
    } finally {
      setSubmitting(false); // success ho ya fail, button wapas chalu
    }
  };

  return (
    <>
      <Navbar />
      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: 420, margin: "40px auto", padding: "0 16px" }}
      >
        <h2>Fund Transfer</h2>

        <label>From account</label>
        {/* <select> bhi controlled hai: value state se aati hai, onChange state badalta hai.
            name="fromAccountId" handleChange ke liye zaroori hai. */}
        <select
          name="fromAccountId"
          value={form.fromAccountId}
          onChange={handleChange}
          style={{ display: "block", width: "100%" }}
        >
          <option value="">-- Select --</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.type} · {a.accountNumber} · ₹{a.balance.toLocaleString("en-IN")}
            </option>
          ))}
        </select>
        <FieldError message={errors.fromAccountId} />

        <label style={{ display: "block", marginTop: 12 }}>To account number</label>
        <input
          name="toAccountNumber"
          value={form.toAccountNumber}
          onChange={handleChange}
          placeholder="e.g. CA2009876543"
          style={{ display: "block", width: "100%" }}
        />
        <FieldError message={errors.toAccountNumber} />

        <label style={{ display: "block", marginTop: 12 }}>Amount (₹)</label>
        {/* type="number" mobile par number keyboard dikhata hai, par value phir bhi STRING hai.
            min="1" sirf browser ka hint hai, security nahi. Koi bhi bypass kar sakta hai,
            isliye validate() aur backend dono zaroori hain. */}
        <input
          name="amount"
          type="number"
          min="1"
          value={form.amount}
          onChange={handleChange}
          style={{ display: "block", width: "100%" }}
        />
        <FieldError message={errors.amount} />

        <label style={{ display: "block", marginTop: 12 }}>Remark (optional)</label>
        <input
          name="remark"
          value={form.remark}
          onChange={handleChange}
          maxLength={50}
          style={{ display: "block", width: "100%" }}
        />

        {/* disabled={submitting}: API ke jawab tak button band, warna tez double-click se
            do requests jaati hain aur paise do baar kat sakte hain. Backend par
            idempotency key bhi isi wajah se chahiye, kyunki button disable karna
            akela kaafi nahi hota. */}
        <button type="submit" disabled={submitting} style={{ marginTop: 16 }}>
          {submitting ? "Processing..." : "Transfer"}
        </button>

        {result && (
          <p style={{ marginTop: 16, color: result.type === "success" ? "green" : "crimson" }}>
            {result.message}
          </p>
        )}
      </form>
    </>
  );
}