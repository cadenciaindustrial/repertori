/* Definir IDs */

const ConvertirButtonId = "convertir_button"
const CopyButtonId = "copy_button"
const TitleInputId = "title_input"
const SongInputId = "song_input"
const InputCardId = "input_card"
const OutputTextId = "output"
const OutputCardId = "output_card"
const DropdownId = "dropdown_menu"
const RangeId = "space_range"
const SpaceRangeLabelId = "space_range_label"
const TransposeRangeLabelId = "transpose_range_label"
const BlocCheckboxId = "checkbox_bloc"
const NewpageCheckboxId = "checkbox_newpage"
const LenthInput = "lenght_input"
const DownloadButtonId = "download_button"
const iniciId = "inici"
const EdicioManualId = "edicio_manual"
const urlInputId = "url_input"
const statusId = "status"

// Variables Globals

let estat = false //False: mode introduir, True: mode latex generat
let space_threshold = 0.4
let length_threshold = 4
let transpose = 0
let title = ""

// Mètodes d'utilitat (getters i setters)

function setHidden(textId, state) {
  document.getElementById(textId).hidden = state
}

function setDisabled(textId, state) {
  document.getElementById(textId).disabled = state
}

function setText(textId, text) {
  document.getElementById(textId).innerHTML = text
}

function getText(textId) {
  return document.getElementById(textId).innerHTML
}

function getValue(elementId) {
  return document.getElementById(elementId).value
}

// Listeners dels botons

document.getElementById(CopyButtonId).addEventListener("click", function () {
  navigator.clipboard.writeText(getText(OutputTextId))

  // Alert the copied text
  alert("Text copiat al porta-retalls")
})

document.getElementById(DownloadButtonId).addEventListener("click", function () {
  descarregar(getText(OutputTextId)) // Crida a la funció descarregar amb el text de sortida
  convertir() // Tornar al mode introduir dades
  document.getElementById(SongInputId).value = "" // Netejar el camp de text de la cançó
  document.getElementById(TitleInputId).value = "" // Netejar el camp de text del títol
})

function updateSpaceRangeInput(val) {
  document.getElementById(SpaceRangeLabelId).value = val
  space_threshold = val / 100
}

function updateTransposeRangeInput(val) {
  document.getElementById(TransposeRangeLabelId).value = val
  transpose = val
}

function updateLenghtInput(val) {
  length_threshold = val
}

function manualEditButton() {
  setHidden(iniciId, true) // Oculta la secció d'inici
  setHidden(EdicioManualId, false) // Mostra la secció d'edició manual
  setText(OutputTextId, "") // Neteja el text de sortida
}

// Funcions quan es realitzen accions

function convertir() {
  if (estat) {
    setText(OutputTextId, "")
    setText(ConvertirButtonId, "Convertir")
    setDisabled(RangeId, false)
    setDisabled(BlocCheckboxId, false)
    setDisabled(NewpageCheckboxId, false)
    setDisabled(LenthInput, false)
    setHidden(InputCardId, false)
    setHidden(OutputCardId, true)
    estat = false
  } else {
    title = getValue(TitleInputId)
    setText(OutputTextId, compileSongManual(getValue(SongInputId)))
    setText(ConvertirButtonId, "Tornar")

    setDisabled(RangeId, true)
    setDisabled(BlocCheckboxId, true)
    setDisabled(NewpageCheckboxId, true)
    setDisabled(LenthInput, true)
    setHidden(InputCardId, true)
    setHidden(OutputCardId, false)
    estat = true
  }
}

async function carregar() {
  const url = document.getElementById(urlInputId).value.trim()
  const status = document.getElementById(statusId)
  if (!url || !url.startsWith("https://tabs.ultimate-guitar.com/tab/")) {
    status.textContent = "❌ Error: Introdueix una URL vàlida."
    return
  }

  status.textContent = ""
  status.innerHTML =
    '<span class="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></span> Carregant (si fa més de 15 min que no utilitzes el servei, pot trigar uns segons)...'

  const proxyBase = "https://server-repertori.onrender.com/scrape?url="

  try {
    const resposta = await fetch(proxyBase + encodeURIComponent(url))
    if (!resposta.ok) throw new Error("Error al descarregar la pàgina")

    const html = await resposta.text()
    const acords = extreureAcords(html)
    title = extreureTitol(html) || "Cançó sense títol"
    const latex = compileSongUltimate(acords)

    document.getElementById(SongInputId).value = acords // Mostra el contingut HTML original
    document.getElementById(TitleInputId).value = title // Mostra el títol extret o un valor per defecte
    document.getElementById(OutputTextId).value = latex // Mostra el contingut HTML original

    descarregar(latex) // Descarregar el contingut generat
    status.textContent = "✅ Contingut descarregat correctament."
    document.getElementById(urlInputId).value = "" // Netejar el camp de text de la URL
  } catch (error) {
    resultat.value = ""
    status.textContent = "❌ Error: " + error.message
  }
}

// Funcions d'utilitat

function descarregar(text) {
  // Crear un blob (objecte binari) amb el contingut i el tipus MIME
  const blob = new Blob([text], { type: "text/plain" })

  // Crear un enllaç temporal
  const enllac = document.createElement("a")
  enllac.href = URL.createObjectURL(blob)
  enllac.download = title + ".tex" // Nom del fitxer que es descarregarà

  // Afegir l’enllaç al DOM i clicar-lo automàticament
  document.body.appendChild(enllac)
  enllac.click()

  // Eliminar l’enllaç després de la descàrrega
  document.body.removeChild(enllac)
}

function extreureTitol(html) {
  // Cerca la línia amb "name":"..."
  const match = html.match(/},\s*"name"\s*:\s*"([^"]+)"/)
  if (match && match[1]) {
    return match[1]
  }
  return null // Si no es troba, retorna null
}

function extreureAcords(html) {
  try {
    // 1. Buscar el div amb data-content
    const regex = /<div[^>]*class="js-store"[^>]*data-content="([^"]+)"/
    const match = html.match(regex)
    if (!match || match.length < 2) {
      return "❌ No s’ha pogut trobar el div amb data-content."
    }

    // 2. Decodificar entitats HTML (&quot;, &aacute;, etc.)
    const decodificarHTML = (str) => {
      const textarea = document.createElement("textarea")
      textarea.innerHTML = str
      return textarea.value
    }

    const dataContent = decodificarHTML(match[1])

    // 3. Parsejar el JSON intern
    const json = JSON.parse(dataContent)

    // 4. Accedir al contingut amb acords
    const content = json?.store?.page?.data?.tab_view?.wiki_tab?.content
    if (!content) return "❌ No s’ha trobat la lletra amb acords."

    // 5. Netegem HTML i decodifiquem també les entitats dins la lletra
    const net = decodificarHTML(content.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?[^>]+>/gi, ""))

    return net.trim()
  } catch (e) {
    return "❌ Error en analitzar el contingut: " + e.message
  }
}

function separateLines(inputString) {
  let lines = []
  inputString.split("\n").forEach((line) => {
    if (line.trim() !== "") {
      lines.push(line) // Afegeix la línia si no està buida
    }
  })
  return lines
}

function listToString(list) {
  let str = ""
  if (document.getElementById(BlocCheckboxId).checked) {
    str += "\\subsection{" + title + "}\n"
  } else {
    str += "\\section{" + title + "}\n"
  }
  str +=
    `\\begin{multicols}{2} \\begin{guitar} \n \n \\transpose{` +
    transpose +
    `}    %%% CANVIAR PER TRANSPOSAR LA CANÇÓ (valor entre 0 i 11 semitons (ascendent)) %%% \n \n`
  list.forEach((x) => {
    str += x + "\n" // Afegeix cada línia a la cadena final
  })
  str += `\n \n \\end{guitar} \\end{multicols}`
  if (document.getElementById(NewpageCheckboxId).checked) {
    str += `\n \\newpage`
  }
  return str
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

  // Mapping of sharp to flat equivalents
  const sharpToFlat = {
    "A#": "Bb",
    "C#": "Db",
    "D#": "Eb",
    "F#": "Gb",
    "G#": "Ab",
  }

  // Valid chord prefixes
  const validChords = ["A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab"]

  // Transform a single chord to its LaTeX representation
  function transformChord(chord) {
    // Check for sharp chords and convert to flat equivalent
    for (const sharp in sharpToFlat) {
      if (chord.startsWith(sharp)) {
        chord = chord.replace(sharp, sharpToFlat[sharp])
        break
      }
    }

    // Extract prefix and the rest of the chord
    const match = chord.match(/^([A-G][b]?)(.*)$/) // Matches chord prefix and the rest
    if (match) {
      const [_, prefix, rest] = match // Destructure the prefix and the rest
      if (validChords.includes(prefix)) {
        return `\\${prefix} ${rest}`
      }
    }

    // If not a valid chord, return as is
    return chord
  }

  // Transform each chord in the list
  chordsList = chordsList.map(transformChord)

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

// Codi convertidor Manual
// Aquestes funció converteix una cançó en format text a un format LaTe

function compileSongManual(songStr) {
  return listToString(makeSongManual(separateLines(songStr))) // Compila la cançó utilitzant les funcions
}

function makeSongManual(lineList) {
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
  return (str.split(" ").length - 1) / str.length > space_threshold || str.length < length_threshold // Comprova si la línia conté més espais que lletres
}

//Convertidor d'acords automàtic

function compileSongUltimate(songStr) {
  return listToString(makeSongUltimate(separateLines(songStr))) // Compila la cançó utilitzant les funcions
}

function makeSongUltimate(lineList) {
  let outputList = []
  let skipFlag = false

  for (let i = 0; i < lineList.length; i++) {
    let line = lineList[i]

    if (skipFlag) {
      // Per saltar una iteració
      skipFlag = false
    } else if (!line.includes("[ch]") && !line.includes("[") && !line.includes(":")) {
      // Si aquesta línia és lletra i l'anterior no eren acords, afegeix la lletra sense acords
      outputList.push(line)
    } else if (line.includes("[ch]")) {
      // Si aquesta línia és acords, comprova cada cas per la línia següent
      if (line.includes("[tab]")) {
        // Si la següent és lletra, afegeix la combinació a la cançó i salta la següent iteració per no afegir-la dos cops
        outputList.push(mergeChords(maquetarUltimate(line), maquetarUltimate(lineList[i + 1])))
        skipFlag = true
      } else {
        // Si la següent no és lletra, afegeix aquesta línia sense lletra (" ")
        outputList.push(mergeChords(maquetarUltimate(line), " "))
      }
    } else if (line.includes("[") && line.includes("]")) {
      // Si aquesta línia és un títol l'afegeix en gran i negreta
      outputList.push(
        `\n {\\vspace{\\eap} \n \\large \\textbf{${line.substring(
          line.indexOf("[") + 1,
          line.indexOf("]")
        )}}} \n \\vspace{\\edp} \n`
      )
    } else if (line.includes(":")) {
      // Si aquesta línia és un títol l'afegeix en gran i negreta

      outputList.push(
        `\n {\\vspace{\\eap} \n \\large \\textbf{${line.substring(
          0,
          line.indexOf(":")
        )}}} \n \\vspace{\\edp} \n`
      )
    } else {
      outputList.push("Error 2") // En teoria hauria de ser impossible arribar a aquest cas
    }
  }
  return outputList
}

function maquetarUltimate(str) {
  return str
    .split("[ch]")
    .join("")
    .split("[tab]")
    .join("")
    .split("[/ch]")
    .join("")
    .split("[/tab]")
    .join("") // Elimina els tags i els espais sobrants
}
