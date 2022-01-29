import { MatchResult, Molecule } from "./molecule"
import { Reaction } from "./reaction"

type EngineStepResult = "continue" | "need-input" | "done"

export class Engine {

  reactions: Reaction[] = []
  mixture: Molecule[] = []
  output: string = ""
  inputBuffer: string[] = []

  step(): EngineStepResult {
    type PossibleStep = { reaction: Reaction, match: MatchResult, molecules: number[] }

    const inputMolecules = this.mixture.filter(m => m.isInput())
    if (inputMolecules.length !== 0) {
      const input = this.inputBuffer.shift()
      if (input === undefined) {
        return "need-input"
      }
      const molecule = inputMolecules[Math.floor(Math.random() * inputMolecules.length)]
      const tail = molecule.atoms.slice(1)
      const inputCode = input.charCodeAt(0)
      const newMolecule = new Molecule(new Array(inputCode).fill(tail).flat())
      const index = this.mixture.indexOf(molecule)
      this.mixture[index] = newMolecule
      return "continue"
    }

    const possibilities: PossibleStep[] = this.reactions.flatMap(reaction => {
      const matches = reaction.match(this.mixture)
      return matches.map(([match, molecules]) => ({ reaction, match, molecules }))
    })

    if (possibilities.length === 0) {
      return "done"
    }

    const step = possibilities[Math.floor(Math.random() * possibilities.length)]
    this.mixture = this.mixture.filter((_, i) => !step.molecules.includes(i))

    const newMolecules = step.reaction.right.map(m => m.replaceVars(step.match))
    const outputMolecules = newMolecules.filter(m => m.isOutput())

    this.mixture.push(...newMolecules.filter(m => !m.isOutput()))
    for (let output of outputMolecules) {
      this.output += String.fromCharCode(output.atoms.length - 1)
    }
    return "continue"
  }

}
