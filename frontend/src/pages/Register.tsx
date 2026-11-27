import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Headset, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import axios from 'axios';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setError('Enter your full name.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await register({ fullName: trimmedName, email, password });

      navigate('/login');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;

        setError(
          Array.isArray(message)
            ? message.join(', ')
            : message || 'Registration failed. Please try again.',
        );
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-banner">
        <div className="brand">
          <Headset size={36} />
          <span>ConnectCare</span>
        </div>

        <div className="banner-content">
          <span className="eyebrow">TELECOM SUPPORT SYSTEM</span>

          <h1>
            Better service.
            <br />
            <span>Better connection.</span>
          </h1>

          <p>
            Create your account and experience a simpler way
            to manage your telecom support requests.
          </p>
        </div>

        <div className="banner-footer">
          ConnectCare Telecom Support System
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-form">
          <h2>Create an account</h2>

          <p className="subtitle">
            Get started with ConnectCare today.
          </p>

          {error && <div className="error-message" role="alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label htmlFor="fullName">Full name</label>

            <div className="input-group">
              <User size={19} />

              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                maxLength={100}
                required
              />
            </div>

            <label htmlFor="email">Email address</label>

            <div className="input-group">
              <Mail size={19} />

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                maxLength={150}
                required
              />
            </div>

            <label htmlFor="password">Password</label>

            <div className="input-group">
              <Lock size={19} />

              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
              />

              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            <label htmlFor="confirmPassword">Confirm password</label>

            <div className="input-group">
              <Lock size={19} />

              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-link">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}