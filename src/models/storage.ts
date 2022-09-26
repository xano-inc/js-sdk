export class XanoStorage {
    private storage: Record<string, string> = {};

    public clear(): void {
        this.storage = {};
    }

    public getAll(): Record<string, string> {
        return this.storage;
    }

    public getItem(key: string): string | null {
        return this.storage[key] ?? null;
    }

    public removeItem(key: string): void {
        delete this.storage[key];
    }

    public setItem(key: string, value: string): void {
        this.storage[key] = value;
    }
}
