export class XanoEventStream {
  data: string;
  id: string;
  type: string;

  constructor(args: { data: string; id: string; type: string }) {
    Object.assign(this, args);
  }

  dataAsJSON(): any {
    try {
      return JSON.parse(this.data);
    } catch (e) {
      return null;
    }
  }
}
