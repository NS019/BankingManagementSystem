import { useState } from "react";
// useLocation: Router se "state" padhne ke liye. Register page navigate karte waqt ek chhota
// message ({ registered: true }) saath bhejta hai, jise yahan padhte hain.
import { Link, useLocation, useNavigate } from "react-router-dom";
import FormField from "../components/FormField";
import Button from "../components/Button";
import { loginUser } from "../api/authService";

// Simple email check: "kuch@kuch.kuch" jaisa shape. Poori RFC-valid regex likhna bekaar hai,
// asli verification verification-email se hoti hai. Ye sirf typos pakadne ke liye hai.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pure validation function component ke bahar (har form mein yahi pattern).
function validate(form) {
  const errors = {};
  if (!EMAIL_REGEX.test(form.email.trim())) errors.email = "Valid email daalo";
  if (!form.password) errors.password = "Password daalo";
  return errors;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // ?. kyunki seedha /  kholne par location.state null hota hai.
  // Dhyan: router state browser history mein rehti hai, page refresh par bhi bachi rehti hai.
  // Isliye ye sirf harmless message ke liye use karo, kabhi password ya token ke liye nahi.
  const justRegistered = location.state?.registered === true;

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setServerError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const { token } = await loginUser(form);

      // Token save. (Abhi localStorage, seekhne ke liye. Real banking app mein httpOnly secure cookie,
      // kyunki XSS attack mein JS localStorage ka token chura sakta hai. Backend ke saath wapas aayenge.)
      localStorage.setItem("token", token);

      // replace: Login page history se hat jaata hai, toh Back dabane par login form wapas nahi aata.
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-card" noValidate>
        {/* noValidate: browser ka apna validation popup band, taaki sirf hamare (consistent) messages dikhein. */}
        <h2>🏦 My Bank</h2>
        <p style={{ color: "var(--color-muted)" }}>Apne account mein login karo</p>

        {justRegistered && (
          <p className="alert alert--success" role="status">
            Account ban gaya! Ab login karo.
          </p>
        )}

        <FormField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          autoComplete="email" // password manager / browser sahi cheez autofill kare
          error={errors.email}
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          autoComplete="current-password"
          error={errors.password}
        />

        <Button type="submit" loading={submitting} loadingText="Logging in..." style={{ width: "100%" }}>
          Login
        </Button>

        {serverError && (
          <p className="alert alert--error" role="alert">
            {serverError}
          </p>
        )}

        <p>
          Naya account chahiye? <Link to="/register">Register karo</Link>
        </p>

        {/* Sirf mock phase ke liye hint. Backend aate hi ye block DELETE kar dena. */}
        <small style={{ color: "var(--color-muted)" }}>Demo: neeti@example.com / Password@123</small>
      </form>
    </div>
  );
}