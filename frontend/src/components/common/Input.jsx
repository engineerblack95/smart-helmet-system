export const Input = ({ label, error, className = '', ...props }) => (
  <div className={className}>
    {label && <label className="label">{label}</label>}
    <input
      className={`input ${error ? 'border-danger-500 focus:ring-danger-500' : ''}`}
      {...props}
    />
    {error && <p className="text-xs text-danger-600 mt-1">{error}</p>}
  </div>
);