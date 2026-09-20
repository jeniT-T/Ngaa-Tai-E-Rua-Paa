import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="card" style={{ maxWidth: '420px', width: '100%' }}>
        <h1 style={{ marginBottom: '2rem', fontSize: '1.75rem' }}>Reset Password</h1>

        {sent ? (
          <div style={{ padding: '1rem', backgroundColor: 'rgba(52, 211, 153, 0.1)', color: '#047857', borderRadius: 'var(--radius-md)', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
              If an account exists for that email, a reset link has been sent. Check your inbox
              (and spam folder) and follow the link to set a new password.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', opacity: submitting ? '0.6' : '1', cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              {submitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/login" style={{ fontWeight: '600', color: 'var(--primary)', textDecoration: 'none' }}>
            Back to Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
