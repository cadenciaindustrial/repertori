/* Definir IDs */

const ButtonId = "convertir_button"
const TitleInputId = "title_input"
const SongInputId = "song_input"
const InputDivId = "input_div"
const TextId = "output"
const DropdownId = "dropdown_menu"
const RangeId = "range"
const RangeLabelId = "range_label"
const CheckboxId = "checkbox"

// Variables Globals

let estat = false //False: mode introduir, True: mode latex generat
let chord_threshold = 0.5
let inBlock = true
let title = ""

// Mètodes d'utilitat

function setHidden(textId, state) {
  document.getElementById(textId).hidden = state
}

function setDisabled(textId, state) {
  document.getElementById(textId).disabled = state
}

function setText(textId, text) {
  document.getElementById(textId).innerHTML = text
}

function getValue(elementId) {
  return document.getElementById(elementId).value
}

// Listeners dels botons

document.getElementById(ButtonId).addEventListener("click", function () {
  convertir()
})

document.getElementById(DropdownId).addEventListener("click", function () {})

function updateTextInput(val) {
  document.getElementById(RangeLabelId).value = val
  chord_threshold = val / 100
}

// Funcions quan es realitzen accions

function convertir() {
  if (estat) {
    setText(TextId, "")
    setText(ButtonId, "Convertir")
    setDisabled(RangeId, false)
    setDisabled(CheckboxId, false)
    setHidden(InputDivId, false)
    setHidden(TextId, true)
    estat = false
  } else {
    inBlock = document.getElementById(CheckboxId).checked
    title = getValue(TitleInputId)
    setText(TextId, compileSong(getValue(SongInputId)))
    setText(ButtonId, "Tornar")

    setDisabled(RangeId, true)
    setDisabled(CheckboxId, true)
    setHidden(InputDivId, true)
    setHidden(TextId, false)
    estat = true
  }
}

/* Codi*/

function separateLines(inputString) {
  let lines = []
  inputString.split("\n").forEach((line) => {
    if (line.trim() !== "") {
      lines.push(line) // Afegeix la línia si no està buida
    }
  })
  return lines
}

function makeSong(lineList) {
  let outputList = []
  let skipFlag = false

  for (let i = 0; i < lineList.length; i++) {
    let line = lineList[i]

    if (skipFlag) {
      // Per saltar una iteració
      skipFlag = false
    } else if (line.includes("[") && line.includes("]")) {
      // Si aquesta línia és un títol l'afegeix en gran i negreta
      outputList.push(
        `\n {\\vspace{\\eap} \n \\large \\textbf{${line.substring(
          line.indexOf("[") + 1,
          line.indexOf("]")
        )}}} \n \\vspace{\\edp} \n`
      )
    } else if (!isChords(line)) {
      // Si aquesta línia és lletra i l'anterior no eren acords, afegeix la lletra sense acords
      outputList.push(mergeChords(" ", line))
    } else if (isChords(line)) {
      // Si aquesta línia és acords, comprova cada cas per la línia següent
      if (i + 1 === lineList.length) {
        // Primer comprova si aquesta és l'última línia per evitar errors
        outputList.push(mergeChords(line, " "))
      } else if (lineList[i + 1].includes("[") && lineList[i + 1].includes("]")) {
        // Si la següent és un títol, afegeix aquesta línia sense lletra (" ")
        outputList.push(mergeChords(line, " "))
      } else if (isChords(lineList[i + 1])) {
        // Si la següent és acords, afegeix aquesta línia sense lletra (" ")
        outputList.push(mergeChords(line, " "))
      } else {
        // Si la següent és lletra, afegeix la combinació a la cançó i salta la següent iteració per no afegir-la dos cops
        outputList.push(mergeChords(line, lineList[i + 1]))
        skipFlag = true
      }
    } else {
      outputList.push("Error 2") // En teoria hauria de ser impossible arribar a aquest cas
    }
  }
  return outputList
}

function isChords(str) {
  return (str.split(" ").length - 1) / str.length > chord_threshold // Comprova si la línia conté més espais que lletres
}

function mergeChords(chordsStr, lyricsStr) {
  let chordsList = []
  chordsStr.split(" ").forEach((chord) => {
    if (chord !== "") {
      chordsList.push(chord) // Afegeix la línia si no està buida
    }
  })
  let chordFlag = false
  let output = ""

  chordsList = chordsList.map((chord) => "[" + chord + "]") // Afegeix claudàtors als acords

  for (let i = 0; i < Math.max(chordsStr.length, lyricsStr.length); i++) {
    if (i < chordsStr.length) {
      if (chordsStr[i] !== " ") {
        if (!chordFlag) {
          // Si no està activa la chord_flag, l'activa i posa l'acord
          chordFlag = true
          output += chordsList.shift() // Afegir el primer acord a la llista
        }
      } else {
        chordFlag = false
      }
      if (i < lyricsStr.length) {
        output += lyricsStr[i] // Afegeix la lletra
      } else {
        output += "\\, " // Afegeix un espai si no hi ha lletra
      }
    } else {
      output += lyricsStr.slice(i) // Afegeix la resta de la lletra si no hi ha més acords
      break
    }
  }
  return output
}

function listToString(list) {
  let str = ""
  if (inBlock) {
    str += "\\subsection{" + title + "}\n"
  } else {
    str += "\\section{" + title + "}\n"
  }
  str += `\\begin{multicols}{2} \\begin{guitar} \n \n`
  list.forEach((x) => {
    str += x + "\n" // Afegeix cada línia a la cadena final
  })
  str += `\n \n \\end{guitar} \\end{multicols}`
  return str
}

function compileSong(songStr) {
  return listToString(makeSong(separateLines(songStr))) // Compila la cançó utilitzant les funcions
}
