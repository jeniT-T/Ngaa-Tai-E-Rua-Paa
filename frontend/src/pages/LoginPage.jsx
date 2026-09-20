import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to log in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="card" style={{ maxWidth: '420px', width: '100%' }}>
        <h1 style={{ marginBottom: '2rem', fontSize: '1.75rem' }}>Log in</h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Email
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

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label htmlFor="password" style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                Password
              </label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--primary)', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
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
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1.5rem', textAlign: 'center' }}>
          Don't have an account?{' '}
          <Link to="/register" state={location.state} style={{ fontWeight: '600', color: 'var(--primary)', textDecoration: 'none' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
