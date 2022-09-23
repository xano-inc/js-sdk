export class XanoFile {
    constructor(
        private name: string,
        private buffer: Buffer
    ) { }

    public getBuffer(): Buffer {
        return this.buffer;
    }

    public getName(): string {
        return this.name;
    }
}
