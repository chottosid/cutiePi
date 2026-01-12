// Audio utilities for the cute alarm clock

let audioContext: AudioContext | null = null;
let alarmOscillators: OscillatorNode[] = [];
let alarmGainNode: GainNode | null = null;
let alarmIntervalId: number | null = null;

export function initAudio(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

// Mechanical tick sound for clock hand movement
export function playTickSound(intensity: number = 1): void {
  const ctx = initAudio();
  const tickOsc = ctx.createOscillator();
  const tickGain = ctx.createGain();
  const tickFilter = ctx.createBiquadFilter();

  tickOsc.type = 'square';
  tickOsc.frequency.setValueAtTime(800, ctx.currentTime);
  tickOsc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.03);

  tickFilter.type = 'highpass';
  tickFilter.frequency.setValueAtTime(1000, ctx.currentTime);

  const volume = 0.15 * intensity;
  tickGain.gain.setValueAtTime(volume, ctx.currentTime);
  tickGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);

  tickOsc.connect(tickFilter);
  tickFilter.connect(tickGain);
  tickGain.connect(ctx.destination);

  tickOsc.start(ctx.currentTime);
  tickOsc.stop(ctx.currentTime + 0.04);
}

// Start escalating alarm sound
export function startAlarm(onVolumeChange?: (level: number) => void): void {
  stopAlarm();

  const ctx = initAudio();

  // Ensure audio context is running (may be suspended without user interaction)
  if (ctx.state === 'suspended') {
    ctx.resume().catch(err => console.error('Failed to resume audio context:', err));
  }

  alarmGainNode = ctx.createGain();
  alarmGainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  alarmGainNode.connect(ctx.destination);

  let volumeLevel = 1;
  const startTime = Date.now();

  const playMelody = () => {
    if (!alarmGainNode) return;

    const isAnnoying = volumeLevel >= 4;
    const notes = isAnnoying
      ? [523, 659, 784, 523, 659, 784]
      : [523, 587, 659, 698];

    const tempo = volumeLevel >= 3 ? 150 : (volumeLevel >= 2 ? 200 : 300);

    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (alarmGainNode) {
          playTone(freq, 0.15);
        }
      }, i * tempo);
    });

    // Repeat
    if (alarmGainNode) {
      setTimeout(playMelody, notes.length * tempo);
    }
  };

  playMelody();

  // Volume escalation
  alarmIntervalId = window.setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const newLevel = Math.floor(elapsed / 10) + 1;

    if (newLevel !== volumeLevel && alarmGainNode) {
      volumeLevel = newLevel;
      const newGain = Math.min(0.3 + (volumeLevel * 0.15), 1);
      alarmGainNode.gain.setValueAtTime(newGain, ctx.currentTime);

      if (onVolumeChange) {
        onVolumeChange(volumeLevel);
      }

      // Add annoying beeps at higher levels
      if (volumeLevel >= 4) {
        playAlarmBeep();
      }
    }
  }, 1000);
}

function playTone(freq: number, duration: number): void {
  if (!alarmGainNode || !audioContext) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, audioContext.currentTime);

  gain.gain.setValueAtTime(0.2, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  osc.connect(alarmGainNode);
  alarmOscillators.push(osc);

  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + duration);
}

function playAlarmBeep(): void {
  if (!audioContext || !alarmGainNode) return;

  const beepOsc = audioContext.createOscillator();
  const beepGain = audioContext.createGain();

  beepOsc.type = 'square';
  beepOsc.frequency.setValueAtTime(880, audioContext.currentTime);

  beepGain.gain.setValueAtTime(0.2, audioContext.currentTime);
  beepGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

  beepOsc.connect(beepGain);
  beepGain.connect(audioContext.destination);

  beepOsc.start(audioContext.currentTime);
  beepOsc.stop(audioContext.currentTime + 0.15);
}

// Stop alarm sound
export function stopAlarm(): void {
  alarmOscillators.forEach(osc => {
    try { osc.stop(); } catch(e) {}
  });
  alarmOscillators = [];

  if (alarmIntervalId !== null) {
    clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }

  if (alarmGainNode) {
    alarmGainNode.gain.setValueAtTime(0, audioContext?.currentTime || 0);
  }
}
