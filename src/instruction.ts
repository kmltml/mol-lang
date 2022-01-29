import { Engine } from "./engine"
import { Molecule } from "./molecule"
import { Reaction } from "./reaction"

export interface Instruction {

  execute(engine: Engine): void

}

export class InitialMolecules implements Instruction {

  constructor(
    public molecules: Molecule[]
  ) {}

  execute(engine: Engine) {
    engine.mixture.push(...this.molecules)
  }

}

export type ParseError = {
  line: number
} & ({
  tag: "too-many-arrows"
} | {
  tag: "var-in-init-molecule"
})

export function parse(source: string, line: number): Instruction | ParseError {
  const sides = source.split(/[\-→]/)
  if (sides.length > 2) {
    return {
      tag: "too-many-arrows",
      line
    }
  }

  const sideMolecules = sides.map(side => {
    const moleculeStrs = side.split(/\s+/).map(s => s.trim()).filter(s => s.length !== 0)
    const molecules = moleculeStrs.map(s => Molecule.parse(s))
    return molecules
  })

  if (sides.length == 1) {
    const molecules = sideMolecules[0]
    if (molecules.some(m => m.atoms.some(a => a.variable))) {
      return {
        tag: "var-in-init-molecule",
        line
      }
    }
    return new InitialMolecules(sideMolecules[0])
  } else {
    return new Reaction(sideMolecules[0], sideMolecules[1])
  }
}
