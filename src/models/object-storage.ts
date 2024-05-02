import { XanoBaseStorage } from "./base-storage";

export class XanoObjectStorage extends XanoBaseStorage {
  private storage: Record<string, string> = {};

  clear(): void {
    this.storage = {};
  }

  getAll(): Record<string, string> {
    return this.storage;
  }

  getItem(key: string): string | null {
    return this.storage[key] ?? null;
  }

  removeItem(key: string): void {
    delete this.storage[key];
  }

  setItem(key: string, value: string): void {
    this.storage[key] = value;
  }
}
