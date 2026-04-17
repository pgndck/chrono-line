export const playVictorySound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playTone = (freq: number, startDelay: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle'; // Soft, marimba/bell-like body
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + startDelay);
      // Quick attack
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + startDelay + 0.02);
      // Exponential decay
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startDelay + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + startDelay);
      osc.stop(ctx.currentTime + startDelay + duration);
    };

    // Upward C Major Arpeggio (C5, E5, G5, C6)
    playTone(523.25, 0, 0.3);      
    playTone(659.25, 0.1, 0.3);    
    playTone(783.99, 0.2, 0.3);    
    playTone(1046.50, 0.3, 0.8);   

  } catch (e) {
    console.error("Audio playback not supported", e);
  }
};
