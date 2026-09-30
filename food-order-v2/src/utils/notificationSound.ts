// Single shared AudioContext — reusing avoids the autoplay policy error.
// Browsers require a user gesture before audio can play; we resume the
// suspended context on the first pointer interaction with the page.
let _audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  try {
    if (!_audioCtx) _audioCtx = new AudioContext();
    return _audioCtx;
  } catch {
    return null;
  }
}
// Warm up: resume the context on first user gesture so it's ready immediately
// when an order arrives (which may happen with no user action on the page).
if (typeof window !== "undefined") {
  const resume = () => {
    getAudioCtx()?.resume();
  };
  window.addEventListener("pointerdown", resume, { once: true });
  window.addEventListener("keydown", resume, { once: true });
}

/** Plays a two-tone ding once the AudioContext is allowed to run. */
export function playBeep() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  // Resume in case it was suspended between gestures
  ctx
    .resume()
    .then(() => {
      try {
        const gain = ctx.createGain();
        gain.connect(ctx.destination);

        [
          [880, 0, 0.12],
          [1100, 0.14, 0.13],
        ].forEach(([freq, start, dur]) => {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.value = freq;
          osc.connect(gain);
          gain.gain.setValueAtTime(0.5, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + start + dur,
          );
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + dur + 0.05);
        });
      } catch {
        // ignore
      }
    })
    .catch(() => {});
}
