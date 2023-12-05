const getPrimarySpelling = () => {
  const primarySpelling = document.querySelector('.primary-spelling')
  if (!primarySpelling) return ''
  return primarySpelling.outerHTML
}

const getMeanings = () => {
  const subsectionMeaning = document.querySelector('.subsection-meanings')
  if (!subsectionMeaning) return ''
  return subsectionMeaning.outerHTML
}

const getKanjiUsed = () => {
  const kanjiUsed = document.querySelector('.subsection-composed-of-kanji')
  if (!kanjiUsed) return ''
  return kanjiUsed.outerHTML
}

const getPitchAccent = () => {
  const pitchAccent = document.querySelector(
    '.subsection-pitch-accent > .subsection > div > div > div'
  )
  if (!pitchAccent) return ''
  return pitchAccent.outerHTML
}

const getVocabularyExample = () => {
  const vocabularyExample = document.querySelector(
    '.subsection-used-in > .subsection'
  )
  // debugger
  if (!vocabularyExample) return ''
  return vocabularyExample.outerHTML
}

const getPlainExample = () => {
  const subsectionExampes = document.querySelectorAll('.subsection-examples')
  const plainExampleSubsection = Array.from(subsectionExampes).find((el) =>
    el.querySelector('h6').innerText.startsWith('Examples')
  )

  // debugger
  if (!plainExampleSubsection || plainExampleSubsection.length === 0) return ''

  const plainExample = plainExampleSubsection.querySelectorAll(
    '.subsection > div > .used-in'
  )

  return Array.from(plainExample)
    .map((el) => el.outerHTML)
    .join('')
}

const getMonolingualExample = () => {
  const subsectionExampes = document.querySelectorAll('.subsection-examples')
  const monolingualExampleSubsection = Array.from(subsectionExampes).find(
    (el) => el.querySelector('h6').innerText.startsWith('Mono')
  )

  if (
    !monolingualExampleSubsection ||
    monolingualExampleSubsection.length === 0
  )
    return ''

  const monolingualExample =
    monolingualExampleSubsection.querySelectorAll('.used-in')

  return Array.from(monolingualExample)
    .map((el) => el.outerHTML)
    .join('')
}

export {
  getPrimarySpelling,
  getMeanings,
  getKanjiUsed,
  getPitchAccent,
  getVocabularyExample,
  getPlainExample,
  getMonolingualExample,
}
