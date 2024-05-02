import { Observer } from "./observer";

export class Observable<T> {
  private lastState: T;
  private observers: Observer<T>[] = [];

  constructor(private onObserverCountChange?: CallableFunction) {}

  private notifyCountChange(): void {
    if (typeof this.onObserverCountChange === "function") {
      this.onObserverCountChange(this.observers.length);
    }
  }

  addObserver(observer: Observer<T>, getLastState: boolean = false): void {
    this.observers.push(observer);

    if (getLastState && this.lastState) {
      observer.update(this.lastState);
    }

    this.notifyCountChange();
  }

  removeObserver(observer: Observer<T>): void {
    const removeIndex = this.observers.findIndex((obs) => observer === obs);
    if (removeIndex !== -1) {
      this.observers.splice(removeIndex, 1);
    }

    this.notifyCountChange();
  }

  notify(params: T): void {
    this.lastState = params;
    for (const observer of this.observers) {
      observer.update(params);
    }
  }
}
