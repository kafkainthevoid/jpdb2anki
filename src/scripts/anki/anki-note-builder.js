class AnkiNoteBuilder {
  constructor() {}

  async createNote({
    deckName,
    checkForDuplicate,
    duplicateScope,
    fields: {
      primarySpelling,
      meanings,
      kanjiUsed,
      pitchAccent,
      vocabularyExample,
      plainExample,
      monolingualExample,
      frequency,
    },
    audio,
  }) {
    const note = {
      deckName,
      fields,
      options: {
        allowDuplicate: !checkForDuplicate,
        duplicateScope,
      },
      audio,
    }
    return note
  }
}
