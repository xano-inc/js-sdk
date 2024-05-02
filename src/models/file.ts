export class XanoFile {
  constructor(private name: string, private buffer: Buffer) {}

  getBuffer(): Buffer {
    return this.buffer;
  }

  getName(): string {
    return this.name;
  }
}
