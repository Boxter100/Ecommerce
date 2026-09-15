export const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
export const MAX_SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000;
export const SESSION_WARNING_MS = 5 * 60 * 1000;
export const SESSION_TICK_MS = 15 * 1000;
export const SESSION_PERSIST_EVERY_MS = 20 * 1000;
export const SESSION_MOVE_THROTTLE_MS = 5 * 1000;

export const SESSION_REASON_IDLE = 'idle';
export const SESSION_REASON_MAX = 'max';

export type SessionReason = typeof SESSION_REASON_IDLE | typeof SESSION_REASON_MAX;

const START_KEY = 'vuelta.session.startedAt';
const ACTIVITY_KEY = 'vuelta.session.lastActivityAt';

export interface SessionTimes {
  startedAt: number;
  lastActivityAt: number;
}

export interface SessionSnapshot {
  maxDeadline: number;
  idleDeadline: number;
  idleWarningAt: number;
  reason: SessionReason | null;
  showWarning: boolean;
  countdownMs: number;
}

export function snapshot(
  times: SessionTimes,
  now = Date.now(),
): SessionSnapshot {
  const maxDeadline = times.startedAt + MAX_SESSION_LIFETIME_MS;
  const idleDeadline = times.lastActivityAt + IDLE_TIMEOUT_MS;
  const idleWarningAt = idleDeadline - SESSION_WARNING_MS;
  const maxExpired = now >= maxDeadline;
  const idleExpired = !maxExpired && now >= idleDeadline;
  return {
    maxDeadline,
    idleDeadline,
    idleWarningAt,
    reason: maxExpired
      ? SESSION_REASON_MAX
      : idleExpired
        ? SESSION_REASON_IDLE
        : null,
    showWarning: !maxExpired && !idleExpired && now >= idleWarningAt,
    countdownMs: Math.max(0, idleDeadline - now),
  };
}

export function readSessionTimes(): SessionTimes | null {
  if (typeof window === 'undefined') return null;
  const startedAt = Number(window.localStorage.getItem(START_KEY));
  const lastActivityAt = Number(window.localStorage.getItem(ACTIVITY_KEY));
  if (!Number.isFinite(startedAt) || !Number.isFinite(lastActivityAt)) {
    return null;
  }
  return { startedAt, lastActivityAt };
}

export function persistSessionTimes(times: SessionTimes): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(START_KEY, String(times.startedAt));
  window.localStorage.setItem(ACTIVITY_KEY, String(times.lastActivityAt));
}

export function clearSessionTimes(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(START_KEY);
  window.localStorage.removeItem(ACTIVITY_KEY);
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function isSessionReason(value: string | null): value is SessionReason {
  return value === SESSION_REASON_IDLE || value === SESSION_REASON_MAX;
}

export const SESSION_REASON_MESSAGES: Record<SessionReason, string> = {
  [SESSION_REASON_IDLE]:
    'Tu sesión se cerró por inactividad. Inicia sesión de nuevo para continuar.',
  [SESSION_REASON_MAX]:
    'Alcanzaste el tiempo máximo de sesión (8 h). Inicia sesión de nuevo para continuar.',
};