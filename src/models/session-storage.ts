import { XanoBaseStorage } from "./base-storage";

export class XanoSessionStorage extends XanoBaseStorage {
  clear(): void {
    sessionStorage.clear();
  }

  getAll(): Record<string, string> {
    return { ...sessionStorage };
  }

  getItem(key: string): string | null {
    return sessionStorage.getItem(key);
  }

  removeItem(key: string): void {
    sessionStorage.removeItem(key);
  }

  setItem(key: string, value: string): void {
    sessionStorage.setItem(key, value);
  }
}
