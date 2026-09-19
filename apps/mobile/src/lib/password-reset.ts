// Carries the email and code between the three password-reset screens.
// Kept in memory only: it disappears when the app closes, which is what we want.
interface ResetState {
  email: string;
  code?: string;
}

let state: ResetState | null = null;

export const getResetState = () => state;
export const setResetState = (next: ResetState) => {
  state = next;
};
export const clearResetState = () => {
  state = null;
};
