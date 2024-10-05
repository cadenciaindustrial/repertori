/* Utilitats */

const ButtonId = "convertir"
const InputId = "text_input"
const TextId = "output"

function setHidden(textId, state) {
  document.getElementById(textId).hidden = state
}

function setText(textId, text) {
  document.getElementById(textId).innerHTML = text
}

document.getElementById(ButtonId).addEventListener("click", function () {
  click()
})

function click() {
  setText(TextId, compileSong(document.getElementById(InputId).value))
  setHidden(InputId, true)
  setHidden(TextId, false)
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
  return (str.split(" ").length - 1) / str.length > 0.5 // Comprova si la línia conté més espais que lletres
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
  let str = `\\begin{multicols}{2} \\begin{guitar} \n \n`
  list.forEach((x) => {
    str += x + "\n" // Afegeix cada línia a la cadena final
  })
  str += `\n \n \\end{guitar} \\end{multicols}`
  return str
}

function compileSong(songStr) {
  return listToString(makeSong(separateLines(songStr))) // Compila la cançó utilitzant les funcions
}
