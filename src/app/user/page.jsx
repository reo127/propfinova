'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    queueMicrotask(() => {
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return <div className="text-center p-10">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-6">User Dashboard</h1>
      <p className="mb-4">Welcome, {user.name}!</p>
      <div className="bg-surface shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
        <p>This is a placeholder for the user dashboard. You can add user-specific functionality here.</p>
      </div>
    </div>
  );
}