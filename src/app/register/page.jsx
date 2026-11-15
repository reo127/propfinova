'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout, { AuthError, AuthField, AuthSubmit } from '../components/AuthLayout';
import { User, Building2, Check } from 'lucide-react';

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

        {/* Account type — mirrors the mobile register screen. 'builder' is the
            role the backend already uses for brokers who list properties. */}
        <fieldset>
          <legend className="mb-2 block text-sm font-semibold text-slate-800">I am a</legend>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'user', label: 'Customer', hint: 'Looking to buy or rent', Icon: User },
              { value: 'builder', label: 'Broker', hint: 'Want to list properties', Icon: Building2 },
            ].map(({ value, label, hint, Icon }) => {
              const active = formData.role === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFormData({ ...formData, role: value })}
                  className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                    active
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border bg-surface hover:border-primary/40'
                  }`}
                >
                  <span className="flex w-full items-center justify-between">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${
                        active ? 'bg-primary text-btn-text' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {active && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-btn-text">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </span>
                  <span className={`mt-2.5 text-sm font-bold ${active ? 'text-primary' : 'text-slate-900'}`}>
                    {label}
                  </span>
                  <span className="mt-0.5 text-xs text-slate-500">{hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

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
