import * as ace from "brace"
import { Engine } from "./engine"
import { parse } from "./instruction"

const editor = ace.edit("editor")
editor.setValue(window.localStorage["program"] ?? "")

const mixtureDisplay = document.getElementById("mixture") as HTMLDivElement
const outputDisplay = document.getElementById("output") as HTMLDivElement
const exampleSelect = document.getElementById("examples") as HTMLSelectElement
const inputField = document.getElementById("input-field") as HTMLInputElement
const statusDisplay = document.getElementById("status") as HTMLSpanElement

const examples: { [id: string]: string } = {
  "hello world":
`s1001000|1100101|1101100|1101100|1101111|101100|100000|1110111|1101111|1110010|1101100|1100100|100001|
a
s0X aA → bA cA sX
s1X aA → b1A cA sX
s|X aA → a <A sX

bB c1C → b1B cC
bB c → aB`,
  "hello world 3-nary":
`s2200|10202|11000|11000|11010|1122|1012|11102|11010|11020|11000|10201|1020|
a

s0X aA → b cA sX
s1X aA → b1 cA sX
s2X aA → b11 cA sX
s|X aA → a <A sX

bB c1C → b111B cC
bB c → aB`,
  "cat":
`a
a → >b
bB → <bB a`,
}

for (let exampleId of Object.keys(examples)) {
  const option = document.createElement("option")
  option.value = exampleId
  option.textContent = exampleId
  exampleSelect.appendChild(option)
}

exampleSelect.onchange = () => {
  if (exampleSelect.value !== "") {
    editor.setValue(examples[exampleSelect.value])
  }
}

let engine = new Engine()
let running = false

function run() {
  if (!running) {
    return
  }

  statusDisplay.textContent = "running"

  for (let i = 0; i < 100; i++) {
    const res = engine.step()
    if (res === "done") {
      running = false
      statusDisplay.textContent = "finished"
      break
    } else if (res === "need-input") {
      statusDisplay.textContent = "waiting for input"
      break
    }
  }

  updateMixtureDisplay()
  outputDisplay.textContent = engine.output

  if (running) {
    window.setTimeout(run, 0)
  }
}

editor.commands.addCommand({
  bindKey: "--",
  exec() {
    editor.insert("→")
  },
  name: "insert-arrow"
})

function updateMixtureDisplay() {
  mixtureDisplay.innerHTML = ""
  for (let molecule of engine.mixture) {
    const div = document.createElement("div")
    molecule.toHtml(div)
    mixtureDisplay.appendChild(div)
  }
}

;(document.getElementById("exec-btn") as HTMLButtonElement).onclick = () => {
  const lines = editor.getValue().split("\n")
    .map((str, i) => ({ source: str, line: i }))
    .filter(x => x.source.trim().length !== 0)
  const instructions = lines.map(x => parse(x.source, x.line))
  const annotations: ace.Annotation[] = []
  for (let i of instructions) {
    if ("tag" in i) {
      annotations.push({
        column: 0,
        row: i.line,
        type: "error",
        text: i.tag
      })
    }
  }
  editor.session.setAnnotations(annotations)

  engine = new Engine()
  ;(window as any).engine = engine
  for (let inst of instructions) {
    if ("execute" in inst) {
      inst.execute(engine)
    }
  }

  updateMixtureDisplay()
  outputDisplay.innerHTML = ""
  window.localStorage["program"] = editor.getValue()
}

;(document.getElementById("step-btn") as HTMLButtonElement).onclick = () => {
  engine.step()
  updateMixtureDisplay()
  outputDisplay.textContent = engine.output
}

;(document.getElementById("run-btn") as HTMLButtonElement).onclick = () => {
  running = true
  run()
}

;(document.getElementById("stop-btn") as HTMLButtonElement).onclick = () => {
  running = false
  statusDisplay.textContent = "idle"
}

;(document.getElementById("input-btn") as HTMLButtonElement).onclick = () => {
  engine.inputBuffer.push(...inputField.value)
  inputField.value = ""
  if (running) {
    run()
  }
}
