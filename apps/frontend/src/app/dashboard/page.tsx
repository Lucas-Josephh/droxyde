import { redirect } from 'next/navigation';

import { getServerSession } from '@/lib/session-server';

import { AccountPanel } from './account-panel';
import styles from './page.module.scss';

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session.authenticated || !session.user) {
    redirect('/login');
  }

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <span className={styles.email}>{session.user.email}</span>
      </header>

      <section className={styles.card}>
        <h2 className={styles.section}>
          Welcome{session.user.name ? `, ${session.user.name}` : ''}!
        </h2>
        <p className={styles.muted}>
          You are signed in with id <code>{session.user.id}</code>.
        </p>
      </section>

      <AccountPanel />
    </main>
  );
}
