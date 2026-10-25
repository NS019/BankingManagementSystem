import { useState } from "react";
import Navbar from "../components/Navbar";
import FormField from "../components/FormField";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";

// Frontend ki PAN check: sirf jaldi feedback ke liye. Backend wahi regex dobara chalayega.
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

// Status -> label aur rang ka lookup object. Alternate: if/else ya switch ki lambi chain.
// Object lookup chhota aur naya status jodna aasaan (sirf ek line).
const KYC_STATUS = {
  PENDING: { label: "Not completed", color: "#b45309" },
  SUBMITTED: { label: "Under review", color: "#1d4ed8" },
  VERIFIED: { label: "Verified", color: "green" },
  REJECTED: { label: "Rejected, dobara submit karo", color: "crimson" },
};

// Pure validation function component ke bahar (pehle wale forms jaisa pattern).
function validate(form) {
  const errors = {};
  if (!PAN_REGEX.test(form.panNumber)) errors.panNumber = "PAN format galat hai (jaise ABCDE1234F)";
  if (form.address.trim().length < 10) errors.address = "Address kam se kam 10 characters ka daalo";
  return errors;
}

export default function Profile() {
  // Saare hooks sabse upar, early return se PEHLE. Hooks ko kisi if ke andar ya return ke
  // baad call karna React ka rule todta hai (hooks ki ginti har render par same honi chahiye).
  const { user, loading, error, completeKyc } = useApp();
  const [form, setForm] = useState({ panNumber: "", address: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    // PAN hamesha CAPITAL mein chahiye, isliye type karte hi uppercase kar dete hain.
    const value = e.target.name === "panNumber" ? e.target.value.toUpperCase() : e.target.value;
    setForm({ ...form, [e.target.name]: value });
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await completeKyc({ panNumber: form.panNumber, address: form.address });
      setResult({ type: "success", message: "KYC submit ho gaya! Review ke baad status update hoga." });
      // Sensitive PAN ko form state se hata do. Component state memory mein rehti hai
      // (React DevTools mein dikhti hai), toh kaam hone ke baad saaf karna achhi aadat hai.
      setForm({ panNumber: "", address: "" });
    } catch (err) {
      setResult({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading ya error ke time form nahi, warna user null par crash aata.
  if (loading || error || !user) {
    return (
      <>
        <Navbar />
        <p style={{ textAlign: "center", marginTop: 40, color: error ? "red" : "inherit" }}>
          {error || "Loading profile..."}
        </p>
      </>
    );
  }

  const status = KYC_STATUS[user.kycStatus];

  // KYC form sirf PENDING ya REJECTED par dikhao. SUBMITTED/VERIFIED mein dobara bharne ka
  // matlab nahi (aur VERIFIED ko badalna toh backend bhi rokta hai).
  const showKycForm = user.kycStatus === "PENDING" || user.kycStatus === "REJECTED";

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 480, margin: "40px auto", padding: "0 16px" }}>
        <h2>My Profile</h2>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Phone:</strong> {user.phone}</p>
        {/* panNumber backend se MASKED aata hai (AB******4F), poora PAN browser tak aata hi nahi. */}
        {user.panNumber && <p><strong>PAN:</strong> {user.panNumber}</p>}

        <p>
          <strong>KYC status:</strong>{" "}
          {/* Sirf rang par bharosa nahi: text label bhi hai (color-blind users ke liye). */}
          <span style={{ color: status.color, fontWeight: "bold" }}>{status.label}</span>
        </p>

        {showKycForm && (
          <form onSubmit={handleSubmit}>
            <h3>Complete your KYC</h3>
            <FormField
              label="PAN number"
              name="panNumber"
              value={form.panNumber}
              onChange={handleChange}
              maxLength={10}
              autoComplete="off" // browser PAN ko autofill history mein na rakhe
              error={errors.panNumber}
            />
            <FormField label="Address" name="address" error={errors.address}>
              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                style={{ display: "block", width: "100%" }}
              />
            </FormField>
            <Button type="submit" loading={submitting}>Submit KYC</Button>
          </form>
        )}

        {/* Result form ke BAHAR hai: submit hote hi form gayab ho jaata hai
            (status SUBMITTED), toh andar rakhte toh success message bhi saath ud jaata. */}
        {result && (
          <p style={{ marginTop: 16, color: result.type === "success" ? "green" : "crimson" }}>
            {result.message}
          </p>
        )}
      </div>
    </>
  );
}