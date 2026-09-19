// Carries the email and code between the three password-reset pages.
// sessionStorage keeps it out of the URL and clears it when the tab closes.
const KEY = 'libas_password_reset';

interface ResetState {
  email: string;
  code?: string;
}

export function getResetState(): ResetState | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ResetState) : null;
  } catch {
    return null;
  }
}

export function setResetState(state: ResetState) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable: the user will be sent back to the first step.
  }
}

export function clearResetState() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
