export class Atom {

  variable: boolean

  constructor(
    public name: string
  ) {
    this.variable = /^[A-Z]$/.exec(name) !== null
  }

  toString(): string {
    return this.name
  }

}
