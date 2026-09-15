import { createBrowserSupabase } from '../../lib/supabase/browser';
import { useState } from 'react';

export default function LoginForm({ next = '/admin' }: { next?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = next;
    } catch (err) {
      setError(
        err instanceof Error && /Invalid login credentials/.test(err.message)
          ? 'Email o contraseña incorrectos'
          : 'No se pudo iniciar sesión. Revisa tu conexión.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-ink/60 dark:text-paper/60">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@vuelta.store"
          className="rounded-xl border border-line bg-white/60 px-4 py-3 text-sm outline-none transition-colors focus:border-ember dark:border-line-dark dark:bg-ink-2"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-ink/60 dark:text-paper/60">Contraseña</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="rounded-xl border border-line bg-white/60 px-4 py-3 text-sm outline-none transition-colors focus:border-ember dark:border-line-dark dark:bg-ink-2"
        />
      </label>

      {error && (
        <p role="alert" className="rounded-lg border border-ember/40 bg-ember/10 px-3 py-2 text-sm font-semibold text-ember">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-2 bg-ink px-4 py-3.5 font-bold uppercase tracking-widest text-paper shadow-hard transition-all hover:-translate-y-0.5 hover:bg-ember hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-paper dark:text-ink"
      >
        {busy ? 'Entrando…' : 'Iniciar sesión'}
      </button>
    </form>
  );
}