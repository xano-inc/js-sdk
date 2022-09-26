import { XanoBaseStorage } from './base-storage';

export class XanoCookieStorage extends XanoBaseStorage {
    constructor(
        private cookiePath: string = '/',
        private expirationDays: number = 30
    ) {
        super();
    }

    private getExpirationUTC(dayOffset: number): string {
        const date = new Date();

        date.setTime(date.getTime() + (dayOffset * 24 * 60 * 60 * 1000));

        return date.toUTCString();
    }

    public clear(): void {
        Object.keys(this.getAll()).forEach((key) => {
            this.removeItem(key);
        });
    }

    public getAll(): Record<string, string> {
        return Object.fromEntries(document.cookie.split('; ').map(
            (c) => {
                return c.split('=');
            }
        ));
    }

    public getItem(key: string): string | null {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${key}=`);

        const ret = parts.pop()?.split(';')?.shift() ?? null;
        if (ret === undefined) {
            return null;
        }

        return ret;
    }

    public removeItem(key: string): void {
        document.cookie = `${key}=; expires=${this.getExpirationUTC(-1)}; path=${this.cookiePath}`;
    }

    public setItem(key: string, value: string): void {
        document.cookie = `${key}=${value}; expires=${this.getExpirationUTC(this.expirationDays)}; path=${this.cookiePath}`;
    }
}
