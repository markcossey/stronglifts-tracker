let audioContext: AudioContext | null = null

// iOS only allows audio from a context created or resumed during a user tap
export function unlockAudio() {
  try {
    audioContext ??= new AudioContext()
    if (audioContext.state === 'suspended') void audioContext.resume()
  } catch {
    audioContext = null
  }
}

function playTone(frequency: number, duration: number, delay = 0, volume = 0.3) {
  if (!audioContext) return
  const start = audioContext.currentTime + delay
  const osc = audioContext.createOscillator()
  const gain = audioContext.createGain()
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(volume, start)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
  osc.connect(gain).connect(audioContext.destination)
  osc.start(start)
  osc.stop(start + duration)
}

export function playRestAlert() {
  navigator.vibrate?.([200, 100, 200])
  playTone(880, 0.2)
  playTone(880, 0.2, 0.3)
}

export type TapKind = 'complete' | 'fail' | 'reset'

export function playTapSound(kind: TapKind) {
  if (kind === 'complete') playTone(1320, 0.06, 0, 0.2)
  else if (kind === 'fail') playTone(330, 0.12, 0, 0.25)
  else playTone(660, 0.04, 0, 0.12)
}

// iPhones ignore navigator.vibrate, but on iOS 18+ toggling a native switch control gives a
// haptic tick. Unofficial, so it may stop working in a future iOS release.
export function tapHaptic() {
  if (typeof navigator.vibrate === 'function' && navigator.vibrate(10)) return
  const label = document.createElement('label')
  label.ariaHidden = 'true'
  label.style.display = 'none'
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  label.appendChild(input)
  document.head.appendChild(label)
  label.click()
  label.remove()
}
