let audioFilename = []

const [play_audio, preload_audio, get_playing_audio_element] = (function () {
  let ae = null
  let fetches = {}
  let queue = []
  let ctr = 0
  let ctx
  let downloadFileIdx = 0
  let is_safari = false
  if (
    document.createElement('audio').canPlayType('audio/ogg; codecs=opus') === ''
  ) {
    if (document.createElement('audio').canPlayType('audio/x-caf') !== '') {
      is_safari = true
    }
  }
  function to_wav(b) {
    var xs = b.getChannelData(0)
    var out = new ArrayBuffer(44 + xs.length * 4 + 10000)
    new Uint32Array(out).set([
      0x46464952,
      36 + xs.length * 4,
      0x45564157,
      0x20746d66,
      16,
      0x00010003,
      b.sampleRate,
      b.sampleRate * 4,
      0x00200002,
      0x61746164,
      xs.length * 4,
    ])
    new Float32Array(out).set(xs, 11)
    return out
  }
  function preload(audio) {
    if (!Array.isArray(audio) && typeof audio === 'object') {
      audio = audio.audio
    }
    if (fetches[audio]) {
      return
    }
    const args = {
      headers: {},
    }
    if (is_safari) {
      args.headers['X-ForceCAF'] = '1'
    }
    let url
    let mime
    let enc
    if (audio.startsWith('/static/user/')) {
      url = audio
      mime = 'audio/mpeg'
      enc = false
    } else {
      args.headers['X-Access'] = "please don't steal these files"
      mime = 'audio/ogg; codecs=opus'
      if (is_safari) {
        mime = 'audio/x-caf'
      }
      url = '/static/v/' + audio
      enc = true
    }
    fetches[audio] = fetch(url, args)
      .then((r) => {
        if (r.ok) {
          const content_type = r.headers.get('content-type')
          if (content_type) {
            mime = content_type
          }
        }
        return r.arrayBuffer()
      })
      .then((a) => {
        if (enc) {
          let ua = new Uint8Array(a)
          ua.set([ua[0] ^ 0x06, ua[1] ^ 0x23, ua[2] ^ 0x54, ua[3] ^ 0x0f])
          a = ua.buffer
          // this code does run
        }
        return new Promise((ok, err) => {
          if (mime === 'audio/x-caf') {
            if (ctx === undefined) {
              ctx = new AudioContext()
            }
            ctx.decodeAudioData(a, (b) => ok([to_wav(b), 'audio/wav']), err)
          } else {
            ok([a, mime])
          }

          if (ctx === undefined) {
            ctx = new AudioContext()
          }
          ctx.decodeAudioData(
            a,
            (b) => {
              const wav = to_wav(b)
              // const textDecoder = new TextDecoder('utf-8')
              // const final_final_text = textDecoder.decode(wav)

              const blob = new Blob([wav])
              const final_final = URL.createObjectURL(blob)
              let download_link = document.createElement('a')
              download_link.href = final_final

              // let fileName = `${downloadFileIdx++}_${new Date()
              //   .toLocaleDateString()
              //   .split('/')
              //   .join('-')}_${crypto.randomUUID()}.wav`
              const primarySpelling = document.querySelector(
                '.primary-spelling > .spelling'
              ).innerText

              const filename = `${downloadFileIdx++}_${primarySpelling}_${new Date()
                .toLocaleDateString()
                .split('/')
                .join('-')}.wav`

              download_link.download = filename
              download_link.innerHTML = filename

              const frequencyEl =
                document.getElementsByClassName('tags xbox')[0]

              frequencyEl.appendChild(download_link)

              audioFilename.push({ filename, data: final_final })

              // chrome.runtime.onMessage.addListener(function (
              //   request,
              //   sender,
              //   sendResponse
              // ) {
              //   if (request['type'] == 'popup_start_signal') {
              //     sendResponse({ filename })
              //   }
              // })

              ok(wav)
            },
            err
          )
        })
      })
  }
  function play_next() {
    let audio = queue.shift()
    console.log('play_next audio', audio)
    if (!audio) {
      return
    }
    let volume = undefined
    if (!Array.isArray(audio) && typeof audio === 'object') {
      volume = audio.volume
      audio = audio.audio
    }
    if (typeof volume == 'function') {
      volume = volume()
    } else if (volume === undefined) {
      volume = 1.0
    }
    console.log('play_next audio2', audio, volume)
    preload(audio)
    const promise = fetches[audio]
    const expected_ctr = ctr
    promise.then(
      ([a, mime]) => {
        console.log('play_next promise', [a, mime])
        if (ctr !== expected_ctr) {
          return
        }
        // debugger
        console.log('a', a)
        const blob = new Blob([a])
        const se = document.createElement('source')
        se.src = window.URL.createObjectURL(blob)
        se.type = mime
        if (ae) {
          ae.pause()
          ae = null
        }
        ae = document.createElement('audio')
        ae.volume = volume
        ae.appendChild(se)
        ae.onended = function () {
          // window.URL.revokeObjectURL(blob)
          // if (ctr !== expected_ctr) {
          //   return
          // }
          // play_next()
        }
        // debugger
        ae.controls = true
        // ae.play().then(undefined, function (err) {
        //   console.log(err)
        // })
      },
      () => {
        delete fetches[audio]
      }
    )
  }
  const play_audio = function (list) {
    ctr += 1
    queue = Array.from(list)
    console.log('queue', queue)
    play_next()
  }
  const preload_audio = function (list) {
    list.forEach(preload)
  }
  const get_playing_audio_element = function () {
    return ae
  }
  return [play_audio, preload_audio, get_playing_audio_element]
})()

// document.addEventListener('DOMContentLoaded', function () {
function get_group(g) {
  if (g.startsWith('.') || g.startsWith('#')) {
    return document.querySelectorAll(g)
  } else {
    return document.querySelectorAll("*[data-group='" + g + "']")
  }
}
function run_for_group(g, fn) {
  get_group(g).forEach(fn)
}
function update_class(g, v, k) {
  run_for_group(g, function (e) {
    if (v) {
      e.classList.add(k)
    } else {
      e.classList.remove(k)
    }
  })
}
let global_listeners = []
function add_event_listener(e, ev, fn) {
  global_listeners.push([e, ev, fn])
  e.addEventListener(ev, fn)
}
function add_and_run_event_listener(e, ev, fn) {
  global_listeners.push([e, ev, fn])
  e.addEventListener(ev, fn)
  fn()
}
// function refresh() {
document.querySelectorAll('*[data-when-checked-hide]').forEach(function (e) {
  add_and_run_event_listener(e, 'change', function () {
    update_class(e.dataset.whenCheckedHide, e.checked, 'hidden')
  })
  if (e.type === 'radio' && e.form) {
    e.form.querySelectorAll("[type='radio']").forEach((node) => {
      if (node.name === e.name && node !== e) {
        add_and_run_event_listener(node, 'change', function () {
          if (node.checked) {
            update_class(e.dataset.whenCheckedHide, false, 'hidden')
          }
        })
      }
    })
  }
})
document.querySelectorAll('*[data-when-unchecked-hide]').forEach(function (e) {
  add_and_run_event_listener(e, 'change', function () {
    update_class(e.dataset.whenUncheckedHide, !e.checked, 'hidden')
  })
})
document.querySelectorAll('*[data-when-checked-disable]').forEach(function (e) {
  add_and_run_event_listener(e, 'change', function () {
    run_for_group(e.dataset.whenCheckedDisable, function (c) {
      c.disabled = e.checked
    })
  })
})
document
  .querySelectorAll('*[data-only-show-when-enabled]')
  .forEach(function (e) {
    const t = document.querySelector(e.dataset.onlyShowWhenEnabled)
    add_and_run_event_listener(t, 'change', function () {
      e.classList.toggle('hidden', !t.checked)
    })
  })
document
  .querySelectorAll('*[data-only-show-when-disabled]')
  .forEach(function (e) {
    const t = document.querySelector(e.dataset.onlyShowWhenDisabled)
    add_and_run_event_listener(t, 'change', function () {
      e.classList.toggle('hidden', !!t.checked)
    })
  })
document
  .querySelectorAll('*[data-ensure-one-is-checked]')
  .forEach(function (e) {
    add_event_listener(e, 'change', function () {
      const g = get_group(e.dataset.group)
      for (let i = 0; i < g.length; ++i) {
        if (g[i].checked) {
          return
        }
      }
      for (let i = 0; i < g.length; ++i) {
        if (g[i].disabled || e === g[i]) {
          continue
        }
        g[i].checked = true
        return
      }
      g[0].checked = true
    })
  })
const audio_tags = Array.from(document.querySelectorAll('*[data-audio]'))
let static_random = (function () {
  const xs = {}
  return function (key) {
    if (key in xs) {
      return xs[key]
    }
    const x = Math.random()
    xs[key] = x
    return x
  }
})()
let autoplayed = []
audio_tags.forEach(function (e) {
  function volume() {
    if (e.dataset.audioVolume !== undefined) {
      return parseFloat(e.dataset.audioVolume)
    }
    return 1.0
  }
  const list = e.dataset.audio.split(',').map((xs) =>
    xs.split('+').map((x) => ({
      audio: x,
      volume,
    }))
  )
  if (e.dataset.audioRandomize !== undefined) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(static_random(i) * (i + 1))
      ;[list[i], list[j]] = [list[j], list[i]]
    }
  }
  function on_click() {
    window.event.preventDefault()
    console.log('list[0]', list[0])
    play_audio(list[0], volume())
    list.push(list.shift())
  }
  function on_mouseover() {
    e.removeEventListener('mouseover', on_mouseover)
    list.forEach((xs) => preload_audio(xs))
  }
  if (/iPhone|iPod|iPad|Safari/.test(navigator.userAgent)) {
    new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio > 0) {
          list.forEach((xs) => preload_audio(xs))
          obs.disconnect()
        }
      })
    }).observe(e)
  }
  add_event_listener(e, 'click', on_click)
  if (e.dataset.audioPreload !== undefined) {
    list.forEach((xs) => preload_audio(xs))
  } else {
    add_event_listener(e, 'mouseover', on_mouseover)
  }
  if (e.dataset.audioAutoplay !== undefined) {
    autoplayed = autoplayed.concat(list[0])
    list.push(list.shift())
  }
})
if (autoplayed.length > 0) {
  play_audio(autoplayed)
}
document.querySelectorAll('*[data-virtual]').forEach(function (e) {
  let url = (function () {
    let obj = {}
    for (let pair of new FormData(e.form).entries()) {
      obj[pair[0]] = pair[1]
    }
    let r = new RegExp('(#.?)$')
    return (
      e.form.action.replace(r, '') +
      '?' +
      encode(obj) +
      ((r.exec(e.form.action) || [])[0] || '')
    )
  })()
  let preloaded = null
  let busy = false
  if (e.dataset.preload !== undefined) {
    preloaded = fetch(url)
  }
  console.log('blamemememe')
  add_event_listener(e, 'click', function () {
    if (busy) {
      window.event.preventDefault()
      return
    }
    let p
    if (preloaded !== null) {
      p = preloaded
      preloaded = null
    } else {
      p = fetch(url)
    }
    p.then((req) => req.text()).then(
      (rsp) => {
        busy = false
        history.pushState({}, '', url)
        update_with_html(rsp)
      },
      function () {
        busy = false
        window.location = url
      }
    )
    busy = true
    window.event.preventDefault()
  })
})
// }
// refresh()
document.addEventListener(
  'virtual-refresh',
  function () {
    global_listeners.forEach(function (l) {
      l[0].removeEventListener(l[1], l[2])
    })
    global_listeners.length = 0
    refresh()
  },
  false
)
window.onpopstate = function (e) {
  window.location.reload()
}
// })

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
  const vocabularyExample = document.querySelectorAll(
    '.subsection-used-in > .subsection > .used-in'
  )
  // debugger
  if (!vocabularyExample || vocabularyExample.length == 0) return ''
  return Array.from(vocabularyExample)
    .map((el) => el.outerHTML)
    .join('')
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

// document.addEventListener('DOMContentLoaded', function () {
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request['type'] == 'popup_start_signal') {
    const data = {
      primarySpelling: getPrimarySpelling(),
      meanings: getMeanings(),
      kanjiUsed: getKanjiUsed(),
      pitchAccent: getPitchAccent(),
      vocabularyExample: getVocabularyExample(),
      plainExample: getPlainExample(),
      monolingualExample: getMonolingualExample(),
    }

    console.log({ audioFilename, data })

    // sendResponse({
    //   audioFilename,
    //   data,
    // })
  }
  return true
})
// })
