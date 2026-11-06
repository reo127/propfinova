'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout, { AuthError, AuthField, AuthSubmit } from '../components/AuthLayout';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store token in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to home page since everyone is a user now
      window.location.reload();
      window.location.href = '/';
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Save the properties you like, track your enquiries, and hear about new listings first."
      altPrompt="Already have an account?"
      altLabel="Sign in"
      altHref="/login"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthError>{error}</AuthError>

        <AuthField
          id="name"
          label="Full name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Your name"
          autoComplete="name"
          required
        />

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
          placeholder="Create a password"
          autoComplete="new-password"
          required
          minLength={6}
          hint="At least 6 characters."
          reveal={showPassword}
          onToggleReveal={() => setShowPassword(!showPassword)}
        />

        <AuthSubmit loading={loading} loadingLabel="Creating account…">
          Create account
        </AuthSubmit>
      </form>
    </AuthLayout>
  );
}
