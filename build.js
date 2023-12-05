await Bun.build({
  entrypoints: ['./src/background.js'],
  outdir: './build',
})

await Bun.build({
  entrypoints: ['./src/popup/popup.js'],
  outdir: './build/popup',
})

await Bun.build({
  entrypoints: ['./src/scripts/crab/audio.js'],
  outdir: './build/scripts/crab',
})

// haizzz, skill issue here
// this is stupid
const htmlFile = await Bun.file('./src/popup/popup.html')
await Bun.write('./build/popup/popup.html', htmlFile)
const imgFile = await Bun.file('./src/popup/img/never_give_up.png')
await Bun.write('./build/popup/img/never_give_up.png', imgFile)
const manifestFile = await Bun.file('./manifest.json')
await Bun.write('./build/manifest.json', manifestFile)
