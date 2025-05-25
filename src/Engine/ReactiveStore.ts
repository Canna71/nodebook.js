class CalculatedValueStore {
  private values: { [key: string]: any };
  private dependencies: { [key: string]: string[] };
  private subscribers: { update: () => void }[];

  constructor() {
    this.values = {};
    this.dependencies = {}; // track which values depend on others
    this.subscribers = []; // cells that need updates
  }

setValue(name: string, value: any, dependencies: string[] = []): void {
    this.values[name] = value;
    this.dependencies[name] = dependencies;
    this.notifySubscribers(name);
}

  getValue(name: string) {
    return this.values[name];
  }

notifySubscribers(changedValue: string): void {
    // TODO: Recalculate dependent values and update UI
    // this.recalculateDependencies(changedValue);
    this.subscribers.forEach(subscriber => subscriber.update());
}
}