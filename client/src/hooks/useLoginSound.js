/**
 * useLoginSound — SAFEED-UP Command Center Authentication Sound
 *
 * Synthesizes a professional 2-tone digital confirmation chime using
 * the Web Audio API (no audio file required). Plays only once on
 * successful authentication and handles browser autoplay restrictions
 * gracefully with a silent fallback.
 */
export const useLoginSound = () => {
  const playLoginSuccess = () => {
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();

      // Resume context in case browser suspended it (autoplay policy)
      const resume = ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();

      resume.then(() => {
        /**
         * Plays a single sine-wave tone with a fast attack and
         * exponential decay — gives a clean, non-jarring digital feel.
         *
         * @param {number} frequency - Hz
         * @param {number} startTime - AudioContext timestamp (seconds)
         * @param {number} duration  - full life of the note (seconds)
         * @param {number} peak      - peak gain (0–1)
         */
        const tone = (frequency, startTime, duration, peak = 0.12) => {
          const osc  = ctx.createOscillator();
          const gain = ctx.createGain();

          // Very slight frequency wobble for a "digital" texture
          const lfo      = ctx.createOscillator();
          const lfoGain  = ctx.createGain();
          lfo.frequency.value = 8;          // 8 Hz modulation
          lfoGain.gain.value  = 3;          // ±3 Hz wobble
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(frequency, startTime);

          // Envelope: instant attack → hold briefly → exponential decay
          gain.gain.setValueAtTime(0,    startTime);
          gain.gain.linearRampToValueAtTime(peak, startTime + 0.018);
          gain.gain.setValueAtTime(peak,          startTime + 0.018);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

          lfo.start(startTime);
          osc.start(startTime);
          lfo.stop(startTime + duration);
          osc.stop(startTime + duration);
        };

        const now = ctx.currentTime;

        // ─── Two-tone command-center confirmation chime ────────────────
        //  • First tone  : 370 Hz  (low F#) — "system received"
        //  • Second tone : 554 Hz  (C#5)    — "access granted"
        //  Total duration ≈ 0.75 s
        tone(370, now,        0.35, 0.10);   // lower, slightly quieter
        tone(554, now + 0.28, 0.47, 0.13);   // higher, slightly louder

        // Tidy up the AudioContext after playback completes
        setTimeout(() => {
          ctx.close().catch(() => {});
        }, 1200);
      }).catch(() => {
        // Autoplay blocked — fail silently
      });
    } catch {
      // Unsupported browser or other error — fail silently
    }
  };

  return { playLoginSuccess };
};
