export type When<T> = T | Promise<T>

export class Try<T> {
  static of<T>(fn: () => When<T>) {
    return new Try(fn)
  }

  constructor(private fn: () => When<T>) {
  }

  async getOrElse(fallback: () => T): Promise<T> {
    return new Option(await this.get()).getOrElse(fallback)
  }

  async get(): Promise<T | null> {
    try {
      return this.fn()
    } catch (e) {
      return null
    }
  }
}

class Option<T> {
  constructor(private t: T | null | undefined) {
  }

  get(): T | null | undefined {
    return this.t
  }

  getOrElse(fb: () => T): T {
    const t = this.get()
    return t == null ? fb() : t
  }
}
