export abstract class XanoBaseStorage {
  abstract clear(): void;
  abstract getAll(): Record<string, string>;
  abstract getItem(key: string): string | null;
  abstract removeItem(key: string): void;
  abstract setItem(key: string, value: string): void;
}
