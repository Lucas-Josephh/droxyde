import Link from 'next/link';

import { getServerSession } from '@/lib/session-server';

import styles from './page.module.scss';

export default async function HomePage() {
  const session = await getServerSession();

  return (
    <main className={styles.shell}>
      <section className={styles.hero}>
        <h1 className={styles.title}>Droxyde</h1>
        <p className={styles.subtitle}>
          Fullstack starter — Next.js + NestJS + Prisma in a Turborepo monorepo.
        </p>
        <div className={styles.actions}>
          {session.authenticated ? (
            <Link className={styles.primary} href="/dashboard">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link className={styles.primary} href="/login">
                Sign in
              </Link>
              <Link className={styles.ghost} href="/register">
                Create account
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
