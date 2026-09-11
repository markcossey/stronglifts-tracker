let audioContext: AudioContext | null = null

// iOS only allows audio from a context created or resumed during a user tap
export function unlockRestAlert() {
  try {
    audioContext ??= new AudioContext()
    if (audioContext.state === 'suspended') void audioContext.resume()
  } catch {
    audioContext = null
  }
}

export function playRestAlert() {
  navigator.vibrate?.([200, 100, 200])
  if (!audioContext) return
  const start = audioContext.currentTime
  for (const offset of [0, 0.3]) {
    const osc = audioContext.createOscillator()
    const gain = audioContext.createGain()
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, start + offset)
    gain.gain.exponentialRampToValueAtTime(0.001, start + offset + 0.2)
    osc.connect(gain).connect(audioContext.destination)
    osc.start(start + offset)
    osc.stop(start + offset + 0.2)
  }
}
