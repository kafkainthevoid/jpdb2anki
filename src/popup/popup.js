let files = []
let fields = {}

let idx = 0

const downloadBtn = document.querySelector('#download')

chrome.runtime.onMessage.addListener(function (message) {
  console.log('popup:onMessage', idx++, message)

  if (message.filename) files.push(message.filename)
  if (message.data) fields = message.data

  downloadBtn.removeEventListener('click', postData)
  downloadBtn.addEventListener('click', postData)
})

const postData = () => {
  fetch('http://localhost:8765', {
    method: 'POST',
    body: JSON.stringify({
      action: 'addNote',
      version: 6,
      params: {
        note: {
          deckName: 'shit',
          modelName: 'yoooo',
          fields,
          audio: [
            {
              path: `/home/nand2ton618/fun/anki/${files[0]}`,
              filename: files[0],
              fields: ['mainAudio'],
            },
            ...files.slice(1).map((f) => ({
              path: `/home/nand2ton618/fun/anki/${f}`,
              filename: f,
              fields: ['exampleAudio'],
            })),
          ],
        },
      },
    }),

    headers: {
      'Content-type': 'application/json',
    },
  })
    .then((res) => res.json())
    .then((data) => console.log(data))
}

document.addEventListener('DOMContentLoaded', function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { type: 'popup_start_signal' },
      function (res) {
        if (res.data) {
          fields = res.data
        }
        if (res.audioFilename) {
          files = res.audioFilename
        }

        downloadBtn.removeEventListener('click', postData)
        downloadBtn.addEventListener('click', postData)
      }
    )
  })
})
