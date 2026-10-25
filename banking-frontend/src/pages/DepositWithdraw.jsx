import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import FormField from "../components/FormField";
import Button from "../components/Button";
import { getAccounts, depositFunds, withdrawFunds } from "../api/accountService";

// Limits component ke bahar constant: ye kabhi badalte nahi, toh har render par naya
// object banane ka koi matlab nahi. (Asli limit backend ki hai, ye sirf UX ke liye.)
const LIMITS = { DEPOSIT: 200000, WITHDRAW: 50000 };

// Pure validation function bahar rakhi (Transfer jaisa hi pattern).
// "mode" ke hisaab se rules badalte hain: withdraw mein balance check hota hai, deposit mein nahi.
function validate(form, mode, selectedAccount) {
  const errors = {};
  if (!form.accountId) errors.accountId = "Account chuno";

  const amount = Number(form.amount);
  if (!amount || amount <= 0) {
    errors.amount = "Valid amount daalo (0 se zyada)";
  } else if (amount > LIMITS[mode]) {
    // LIMITS[mode]: mode ki value ("DEPOSIT"/"WITHDRAW") ko key banake limit nikaali.
    errors.amount = `Ek transaction mein maximum ₹${LIMITS[mode].toLocaleString("en-IN")}`;
  } else if (mode === "WITHDRAW" && selectedAccount && amount > selectedAccount.balance) {
    errors.amount = "Balance kam hai";
  }
  return errors;
}

export default function DepositWithdraw() {
  const [accounts, setAccounts] = useState([]);
  const [mode, setMode] = useState("DEPOSIT"); // "DEPOSIT" ya "WITHDRAW": ek hi page, do roop
  const [form, setForm] = useState({ accountId: "", amount: "", remark: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [reloadKey, setReloadKey] = useState(0); // "doorbell": badalte hi accounts dobara aate hain

  // Loader effect ke ANDAR (naye lint rule ke hisaab se, Transfer wale fix jaisa).
  useEffect(() => {
    let ignore = false; // purani request ka jawab naye data ko overwrite na kare
    const load = async () => {
      try {
        const data = await getAccounts();
        if (!ignore) setAccounts(data);
      } catch {
        if (!ignore) setResult({ type: "error", message: "Accounts load nahi ho paaye. Page refresh karo." });
      }
    };
    load();
    return () => {
      ignore = true; // cleanup: component hatne par flag true
    };
  }, [reloadKey]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setResult(null);
  };

  // Mode badalte hi purani galtiyan aur message saaf karo. Warna Deposit ka "Balance kam hai"
  // jaisa error Withdraw par bhi chipka rehta, jo user ko confuse karta.
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setErrors({});
    setResult(null);
  };

  const selectedAccount = accounts.find((a) => a.id === Number(form.accountId));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate(form, mode, selectedAccount);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      // Mode ke hisaab se sahi service function chuno. Dono ek hi shape ka jawab dete hain,
      // isliye neeche ka code same rehta hai. Ye "polymorphism" ka simple roop hai.
      const action = mode === "DEPOSIT" ? depositFunds : withdrawFunds;
      const res = await action({
        accountId: form.accountId,
        amount: Number(form.amount),
        remark: form.remark,
      });

      const label = mode === "DEPOSIT" ? "Deposit" : "Withdrawal";
      setResult({
        type: "success",
        message: `${label} successful! Ref: ${res.referenceId} · New balance: ₹${res.newBalance.toLocaleString("en-IN")}`,
      });
      setForm({ ...form, amount: "", remark: "" }); // account chuna hua rehne do
      setReloadKey((k) => k + 1); // dropdown mein naya balance dikhane ke liye
    } catch (err) {
      setResult({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle button ka style: active mode gehra, baaki halka. Function banaya taaki
  // dono buttons par style repeat na ho.
  const tabStyle = (active) => ({
    flex: 1,
    padding: 10,
    border: "1px solid #1e3a5f",
    background: active ? "#1e3a5f" : "white",
    color: active ? "white" : "#1e3a5f",
    cursor: "pointer",
  });

  return (
    <>
      <Navbar />
      <form onSubmit={handleSubmit} style={{ maxWidth: 420, margin: "40px auto", padding: "0 16px" }}>
        <h2>Deposit / Withdraw</h2>

        <div style={{ display: "flex" }}>
          {/* type="button" ZAROORI hai. Form ke andar button ka default type "submit" hota hai,
              toh toggle dabate hi form submit ho jaata. Ye beginners ka common bug hai. */}
          <button type="button" style={tabStyle(mode === "DEPOSIT")} onClick={() => handleModeChange("DEPOSIT")}>
            Deposit
          </button>
          <button type="button" style={tabStyle(mode === "WITHDRAW")} onClick={() => handleModeChange("WITHDRAW")}>
            Withdraw
          </button>
        </div>

        {/* Reusable stamp ka use: <select> children ke taur par diya. */}
        <FormField label="Account" name="accountId" error={errors.accountId}>
          <select
            id="accountId"
            name="accountId"
            value={form.accountId}
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
        </FormField>

        {/* Yahan children nahi diya, toh FormField default <input> banata hai.
            type, value, onChange wagairah ...inputProps ke through input tak pahunch jaate hain. */}
        <FormField
          label="Amount (₹)"
          name="amount"
          type="number"
          min="1"
          value={form.amount}
          onChange={handleChange}
          error={errors.amount}
        />

        <FormField
          label="Remark (optional)"
          name="remark"
          value={form.remark}
          onChange={handleChange}
          maxLength={50}
        />

        <Button type="submit" loading={submitting}>
          {mode === "DEPOSIT" ? "Deposit" : "Withdraw"}
        </Button>

        {result && (
          <p style={{ marginTop: 16, color: result.type === "success" ? "green" : "crimson" }}>
            {result.message}
          </p>
        )}
      </form>
    </>
  );
}