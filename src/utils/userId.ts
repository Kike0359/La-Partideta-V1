import { safeStorage } from './safeStorage';

const USER_ID_KEY = 'golf_app_user_id';

function generateUserId(): string {
  return crypto.randomUUID();
}

export function getUserId(): string {
  let userId = safeStorage.getItem(USER_ID_KEY);

  if (!userId) {
    userId = generateUserId();
    safeStorage.setItem(USER_ID_KEY, userId);
  }

  return userId;
}

export function clearUserId(): void {
  safeStorage.removeItem(USER_ID_KEY);
}

export function setUserId(userId: string): void {
  safeStorage.setItem(USER_ID_KEY, userId);
}
