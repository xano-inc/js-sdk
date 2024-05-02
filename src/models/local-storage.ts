import { XanoBaseStorage } from "./base-storage";

export class XanoLocalStorage extends XanoBaseStorage {
  clear(): void {
    localStorage.clear();
  }

  getAll(): Record<string, string> {
    return { ...localStorage };
  }

  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }
}
