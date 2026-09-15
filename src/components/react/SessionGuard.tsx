import { useCallback, useEffect, useRef, useState } from 'react';
import { createBrowserSupabase } from '../../lib/supabase/browser';
import { isSupabaseConfigured } from '../../lib/env';
import {
  clearSessionTimes,
  formatCountdown,
  persistSessionTimes,
  readSessionTimes,
  snapshot,
  SESSION_MOVE_THROTTLE_MS,
  SESSION_PERSIST_EVERY_MS,
  SESSION_REASON_IDLE,
  SESSION_REASON_MAX,
  SESSION_TICK_MS,
  type SessionReason,
  type SessionTimes,
} from '../../lib/session';

const IMMEDIATE_EVENTS = [
  'pointerdown',
  'pointerup',
  'keydown',
  'touchstart',
  'focus',
  'pageshow',
] as const;

const THROTTLED_EVENTS = ['pointermove', 'wheel', 'scroll'] as const;

export default function SessionGuard() {
  const [warning, setWarning] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);
  const timesRef = useRef<SessionTimes | null>(null);
  const warnedRef = useRef(false);
  const expiredRef = useRef(false);
  const lastPersistRef = useRef(0);
  const lastMoveRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const expire = useCallback((reason: SessionReason) => {
    if (expiredRef.current) return;
    expiredRef.current = true;
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    clearSessionTimes();
    window.location.assign(`/api/auth/logout?reason=${reason}`);
  }, []);

  const markActivity = useCallback(() => {
    const times = timesRef.current;
    if (!times || expiredRef.current) return;
    const now = Date.now();
    times.lastActivityAt = now;
    if (warnedRef.current) {
      warnedRef.current = false;
      setWarning(false);
      setCountdown(null);
    }
    if (now - lastPersistRef.current >= SESSION_PERSIST_EVERY_MS) {
      lastPersistRef.current = now;
      persistSessionTimes(times);
    }
  }, []);

  const tick = useCallback(() => {
    const times = timesRef.current;
    if (!times || expiredRef.current) return;
    const current = snapshot(times);
    if (current.reason === SESSION_REASON_MAX) {
      expire(SESSION_REASON_MAX);
      return;
    }
    if (current.reason === SESSION_REASON_IDLE) {
      expire(SESSION_REASON_IDLE);
      return;
    }
    if (current.showWarning) {
      warnedRef.current = true;
      setCountdown(formatCountdown(current.countdownMs));
      setWarning(true);
    } else if (warnedRef.current) {
      warnedRef.current = false;
      setCountdown(null);
      setWarning(false);
    }
  }, [expire]);

  const onThrottledActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastMoveRef.current < SESSION_MOVE_THROTTLE_MS) return;
    lastMoveRef.current = now;
    markActivity();
  }, [markActivity]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let disposed = false;

    const onActivity = () => markActivity();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        markActivity();
        tick();
      } else if (timesRef.current) {
        persistSessionTimes(timesRef.current);
      }
    };

    (async () => {
      const supabase = createBrowserSupabase();
      const { data } = await supabase.auth.getSession();
      if (disposed) return;
      const session = data.session;
      if (!session) return;

      const lastSignIn = session.user.last_sign_in_at
        ? new Date(session.user.last_sign_in_at).getTime()
        : null;
      const anchor = lastSignIn ?? Date.now();
      const stored = readSessionTimes();
      const now = Date.now();

      const times: SessionTimes =
        stored && stored.startedAt >= anchor
          ? { ...stored, lastActivityAt: Math.max(stored.lastActivityAt, now) }
          : { startedAt: anchor, lastActivityAt: now };

      timesRef.current = times;
      lastPersistRef.current = now;
      persistSessionTimes(times);

      for (const event of IMMEDIATE_EVENTS) {
        window.addEventListener(event, onActivity, true);
      }
      for (const event of THROTTLED_EVENTS) {
        window.addEventListener(event, onThrottledActivity, true);
      }
      document.addEventListener('visibilitychange', onVisibilityChange);
      timerRef.current = setInterval(tick, SESSION_TICK_MS);
      tick();
    })();

    return () => {
      disposed = true;
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      for (const event of IMMEDIATE_EVENTS) {
        window.removeEventListener(event, onActivity, true);
      }
      for (const event of THROTTLED_EVENTS) {
        window.removeEventListener(event, onThrottledActivity, true);
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (timesRef.current) persistSessionTimes(timesRef.current);
    };
  }, [markActivity, onThrottledActivity, tick]);

  if (!isSupabaseConfigured()) return null;

  return (
    <>
      {warning && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="session-warning-title"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm dark:bg-ink/70"
        >
          <div className="animate-rise w-full max-w-sm rounded-2xl border-2 border-ember/50 bg-paper p-6 shadow-hard dark:bg-ink-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-ember">
              Sesión
            </p>
            <h2
              id="session-warning-title"
              className="font-display mt-1 text-2xl uppercase"
            >
              Tu sesión está a punto de expirar
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/70 dark:text-paper/70">
              Por inactividad, la sesión se cerrará en{' '}
              <strong className="font-mono whitespace-nowrap text-ember">
                {countdown}
              </strong>
              . Continúa trabajando para mantenerla activa.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={markActivity}
                className="bg-ember px-4 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-hard-sm transition-all hover:-translate-y-0.5"
              >
                Continuar trabajando
              </button>
              <a
                href="/api/auth/logout"
                className="border-2 border-ink px-4 py-3 text-center text-sm font-bold uppercase tracking-widest text-ink transition-colors hover:bg-ink hover:text-paper dark:border-paper dark:text-paper dark:hover:bg-paper dark:hover:text-ink"
              >
                Cerrar sesión ahora
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}