import type { SupabaseClientOptions } from "@supabase/supabase-js";

type AuthStorage = NonNullable<SupabaseClientOptions<any>["auth"]>["storage"];

class InMemoryAuthStorage implements AuthStorage {
  private store = new Map<string, string>();

  async getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  async setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  async removeItem(key: string) {
    this.store.delete(key);
  }
}

class SessionStorageAdapter implements AuthStorage {
  constructor(private readonly storage: Storage) {}

  async getItem(key: string) {
    return this.storage.getItem(key);
  }

  async setItem(key: string, value: string) {
    this.storage.setItem(key, value);
  }

  async removeItem(key: string) {
    this.storage.removeItem(key);
  }
}

const createBrowserStorage = (): AuthStorage => {
  if (typeof window === "undefined") {
    return new InMemoryAuthStorage();
  }

  try {
    const storage = window.sessionStorage;
    const testKey = `sb-${Math.random().toString(36).slice(2)}`;

    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);

    return new SessionStorageAdapter(storage);
  } catch (error) {
    console.warn("Session storage is not available, falling back to in-memory storage", error);
    return new InMemoryAuthStorage();
  }
};

export const authStorage = createBrowserStorage();
