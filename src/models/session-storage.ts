import { XanoBaseStorage } from './base-storage';

export class XanoSessionStorage extends XanoBaseStorage {
    public clear(): void {
        sessionStorage.clear();
    }

    public getAll(): Record<string, string> {
        return { ...sessionStorage };
    }

    public getItem(key: string): string | null {
        return sessionStorage.getItem(key);
    }

    public removeItem(key: string): void {
        sessionStorage.removeItem(key);
    }

    public setItem(key: string, value: string): void {
        sessionStorage.setItem(key, value);
    }
}
