import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormField from "../components/FormField";
import Button from "../components/Button";
import { registerUser } from "../api/authService";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Indian mobile: 10 digit, 6-9 se shuru. Backend mein bhi yahi rule dobara lagega.
const PHONE_REGEX = /^[6-9]\d{9}$/;

// Pure function: form do, errors object lo. Empty object = sab theek.
function validate(form) {
  const errors = {};

  if (form.name.trim().length < 3) errors.name = "Naam kam se kam 3 characters ka daalo";
  if (!EMAIL_REGEX.test(form.email.trim())) errors.email = "Valid email daalo";
  if (!PHONE_REGEX.test(form.phone)) errors.phone = "10 digit ka valid mobile number daalo";

  // Password rules: 8+ characters, ek capital, ek small, ek digit. Teen alag test() isliye ki
  // yeh aasani se badle ja sakein (jaise special character bhi maangna ho).
  // NOTE: strong password ka asli rule backend lagata hai, frontend sirf jaldi feedback deta hai.
  const pwd = form.password;
  if (pwd.length < 8 || !/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/\d/.test(pwd)) {
    errors.password = "Kam se kam 8 characters: ek capital, ek small letter aur ek digit";
  }

  // Confirm password: typo pakadne ke liye. Ye check SIRF frontend par hota hai,
  // backend ko confirmPassword bhejne ki zaroorat nahi.
  if (form.confirmPassword !== form.password) errors.confirmPassword = "Dono passwords same hone chahiye";

  return errors;
}

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    // Phone mein sirf digits rakho: type karte hi baaki characters hata dete hain.
    // replace(/\D/g, "") = jo digit nahi hai wo sab hatao. Isse "98765-43210" jaisa paste bhi theek ho jaata hai.
    const value = e.target.name === "phone" ? e.target.value.replace(/\D/g, "") : e.target.value;
    setForm({ ...form, [e.target.name]: value });
    setServerError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      // confirmPassword alag karke bheja nahi: "...rest" se bachi hui fields hi API ko jaati hain.
      // eslint-disable-next-line no-unused-vars -- confirmPassword jaan-boojhkar use nahi kiya
      const { confirmPassword, ...payload } = form;
      await registerUser(payload);

      // Login par bhejo, saath mein ek chhota flag. Register ke baad seedha login karwa dena bhi
      // possible hai, par abhi alag step rakha (real app mein email verification yahin aati hai).
      navigate("/", { replace: true, state: { registered: true } });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-card" noValidate>
        <h2>Naya account banao</h2>

        <FormField label="Full name" name="name" value={form.name} onChange={handleChange} autoComplete="name" error={errors.name} />
        <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" error={errors.email} />
        <FormField
          label="Mobile number"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          maxLength={10}
          autoComplete="tel"
          error={errors.phone}
        />
        {/* "new-password": browser ko batata hai ki ye naya password hai, toh wo strong password suggest
            kar sakta hai aur purana saved password autofill nahi karta. */}
        <FormField label="Password" name="password" type="password" value={form.password} onChange={handleChange} autoComplete="new-password" error={errors.password} />
        <FormField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
          error={errors.confirmPassword}
        />

        <Button type="submit" loading={submitting} loadingText="Creating account..." style={{ width: "100%" }}>
          Register
        </Button>

        {serverError && (
          <p className="alert alert--error" role="alert">
            {serverError}
          </p>
        )}

        <p>
          Pehle se account hai? <Link to="/">Login karo</Link>
        </p>
      </form>
    </div>
  );
}