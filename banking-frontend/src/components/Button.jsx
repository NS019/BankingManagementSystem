// variant se "primary" (bhara hua) ya "secondary" (outline) button milta hai.
export default function Button({
  loading = false,
  loadingText = "Processing...",
  variant = "primary",
  disabled = false, // alag nikaala taaki neeche ...rest isse overwrite na kare
  className = "",
  children,
  ...rest
}) {
  return (
    // disabled={loading || disabled}: API ke jawab tak button band (double-click se double submit nahi).
    // Backend par idempotency key phir bhi chahiye, kyunki sirf button disable karna kaafi nahi.
    // Template literal se classes jodi: "btn btn--primary" + caller ki extra class (agar di ho).
    <button className={`btn btn--${variant} ${className}`.trim()} disabled={loading || disabled} {...rest}>
      {loading ? loadingText : children}
    </button>
  );
}