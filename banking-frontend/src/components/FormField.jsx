// Pehle inline style tha, ab CSS classes. Look badalna ho toh sirf index.css badlo, yeh file nahi.
export default function FormField({ label, name, error, children, ...inputProps }) {
  return (
    <div className="form-field">
      {/* htmlFor + id: label par click se input focus hota hai, aur screen reader dono ko jodta hai. */}
      <label htmlFor={name} className="form-label">
        {label}
      </label>

      {/* children (jaise <select>) ho toh wahi, warna default <input>.
          ...inputProps se type, value, onChange, autoComplete, maxLength sab seedha input ko milte hain. */}
      {children ? children : <input id={name} name={name} className="form-input" {...inputProps} />}

      {/* role="alert": error aate hi screen reader use turant bol deta hai. */}
      {error && (
        <small role="alert" className="form-error">
          {error}
        </small>
      )}
    </div>
  );
}