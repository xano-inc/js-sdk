import { XanoStorage } from './storage';

export class XanoLocalStorage extends XanoStorage {
    public clear(): void {
        localStorage.clear();
    }

    public getAll(): Record<string, string> {
        return { ...localStorage };
    }

    public getItem(key: string): string | null {
        return localStorage.getItem(key);
    }

    public removeItem(key: string): void {
        localStorage.removeItem(key);
    }

    public setItem(key: string, value: string): void {
        localStorage.setItem(key, value);
    }
}
