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

// For browsers with the Vibration API (Android). iPhones don't have it; their haptic comes from the
// native switch in TapTarget.
export function vibrateTap() {
  navigator.vibrate?.(10)
}
