'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout, { AuthError, AuthField, AuthSubmit } from '../components/AuthLayout';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === 'admin') {
        router.push('/admin');
      } else if (data.user.role === 'agent') {
        router.push('/agent/dashboard');
      } else {
        window.location.reload();
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.message || 'We could not sign you in. Check your email and password, then try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Pick up where you left off — your saved properties, enquiries and dashboard."
      altPrompt="New to PropFinova?"
      altLabel="Create an account"
      altHref="/register"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthError>{error}</AuthError>

        <AuthField
          id="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <AuthField
          id="password"
          label="Password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Your password"
          autoComplete="current-password"
          required
          reveal={showPassword}
          onToggleReveal={() => setShowPassword(!showPassword)}
        />

        <AuthSubmit loading={loading} loadingLabel="Signing in…">
          Sign in
        </AuthSubmit>
      </form>
    </AuthLayout>
  );
}
