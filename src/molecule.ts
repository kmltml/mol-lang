import { Atom } from "./atom"

export type MatchResult = { [variable: string]: Atom[] }

export class Molecule {

  constructor(
    public atoms: Atom[]
  ) {}

  static parse(source: string): Molecule {
    return new Molecule([...source].map(x => new Atom(x)))
  }

  match(molecule: Molecule, alreadyMatched: MatchResult = {}): MatchResult | null {
    const result: MatchResult = alreadyMatched

    if (molecule.atoms.length < this.atoms.length - 1) {
      return null
    }

    for (let i = 0; i < this.atoms.length; i++) {
      const pattern = this.atoms[i]

      const atom = (i === this.atoms.length - 1) ? molecule.atoms.slice(i) : [molecule.atoms[i]]
      if ((i !== this.atoms.length - 1 || !pattern.variable) && i >= molecule.atoms.length) {
        return null
      }

      if (pattern.variable) {
        if (pattern.name in result) {
          const prev = result[pattern.name]
          if (prev.length !== atom.length) {
            return null
          }
          if (prev.some((a, i) => a.name !== atom[i].name)) {
            return null
          }
        } else {
          result[pattern.name] = atom
        }
      } else if (atom.length !== 1 || atom[0] === undefined || pattern.name !== atom[0].name) {
        return null
      }
    }

    return result
  }

  replaceVars(matchResult: MatchResult): Molecule {
    const atoms = this.atoms.flatMap(atom => {
      if (atom.variable && atom.name in matchResult) {
        return matchResult[atom.name]
      } else {
        return [atom]
      }
    })
    return new Molecule(atoms)
  }

  isOutput(): boolean {
    return this.atoms[0].name === "<"
  }

  isInput(): boolean {
    return this.atoms[0].name === ">"
  }

  toString(): string {
    return this.atoms.map(a => a.name).join("")
  }

  toHtml(element: HTMLElement): void {
    const groups: [string, number][] = []
    for (let atom of this.atoms) {
      const lastGroup = groups[groups.length - 1]
      if (lastGroup !== undefined && lastGroup[0] === atom.name) {
        lastGroup[1] += 1
      } else {
        groups.push([atom.name, 1])
      }
    }

    for (let [str, count] of groups) {
      element.append("\u200b") // zero width space
      element.append(str)
      if (count > 1) {
        const sub = document.createElement("sub")
        sub.textContent = count.toString()
        element.appendChild(sub)
      }
    }
  }

}
