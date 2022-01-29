import { Engine } from "./engine"
import { Instruction } from "./instruction"
import { MatchResult, Molecule } from "./molecule"

export class Reaction implements Instruction {

  constructor(
    public left: Molecule[],
    public right: Molecule[],
  ) {}

  execute(engine: Engine) {
    engine.reactions.push(this)
  }

  match(molecules: Molecule[]): [MatchResult, number[]][] {
    const results: [number, MatchResult][][] = new Array(this.left.length).fill(0).map(() => [])

    molecules.forEach((molecule, moleculeIndex) => {
      this.left.forEach((pattern, patternIndex) => {
        const res = pattern.match(molecule)
        if (res !== null) {
          results[patternIndex].push([moleculeIndex, res])
        }
      })
    })

    const combinations =
      results.reduce((a: [number, MatchResult][][], b) => a.flatMap(x => b.map(y => [...x, y])),
                     [[]])

    const fullResults: [MatchResult, number[]][] = []

    outer:
    for (let combination of combinations) {
      if (combination.some((v, i) => combination.findIndex(x => x[0] == v[0]) !== i)) {
        continue
      }
      const bindings: MatchResult = {}
      for (let [_, result] of combination) {
        for (let key of Object.keys(result)) {
          const next = result[key]
          if (key in bindings) {
            const prev = bindings[key]
            if (prev.length !== next.length) {
              continue outer
            }
            if (prev.some((a, i) => a.name !== next[i].name)) {
              continue outer
            }
          } else {
            bindings[key] = next
          }
        }
      }

      fullResults.push([bindings, combination.map(([i, _]) => i)])
    }

    return fullResults
  }

}
