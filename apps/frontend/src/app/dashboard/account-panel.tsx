'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ApiError } from '@/lib/api';
import { authClient } from '@/lib/auth-client';

import styles from './page.module.scss';

export function AccountPanel() {
  const router = useRouter();
  const [busy, setBusy] = useState<'logout' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    setBusy('logout');
    setError(null);
    try {
      await authClient.logout();
      router.push('/login');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unexpected error');
    } finally {
      setBusy(null);
    }
  }

  async function deleteAccount() {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your account? This cannot be undone.',
    );
    if (!confirmed) return;

    setBusy('delete');
    setError(null);
    try {
      await authClient.deleteAccount();
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unexpected error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className={styles.card}>
      <h2 className={styles.section}>Account</h2>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <button type="button" className={styles.btn} onClick={logout} disabled={busy !== null}>
          {busy === 'logout' ? 'Signing out…' : 'Sign out'}
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.danger}`}
          onClick={deleteAccount}
          disabled={busy !== null}
        >
          {busy === 'delete' ? 'Deleting…' : 'Delete account'}
        </button>
      </div>
    </section>
  );
}
