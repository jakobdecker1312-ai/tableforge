"use client";

import { useEffect, useRef } from "react";
import type { Mood } from "@/liveblocks.config";

type Handle = { stop: () => void };

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function noiseBuffer(ctx: AudioContext, brown: boolean): AudioBuffer {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    } else {
      data[i] = white;
    }
  }
  return buf;
}

/** Gezupfte Saite (Karplus-Strong), klingt wie eine Laute. */
function pluckBuffer(ctx: AudioContext, freq: number, seconds = 1.8): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(1, len, rate);
  const data = buf.getChannelData(0);
  const period = Math.max(2, Math.round(rate / freq));
  const line = new Float32Array(period);
  for (let i = 0; i < period; i++) line[i] = Math.random() * 2 - 1;
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const next = (idx + 1) % period;
    data[i] = line[idx];
    line[idx] = (line[idx] + line[next]) * 0.4975;
    idx = next;
  }
  return buf;
}

/** Ein Schwerthieb: Metallklang aus unharmonischen Obertönen plus kurzem Rauschen. */
function swordClash(ctx: AudioContext, dest: AudioNode, volume = 0.5) {
  const t = ctx.currentTime;
  const base = rand(850, 1500);
  const out = ctx.createGain();
  out.gain.value = volume;
  out.connect(dest);
  [1, 2.76, 5.4, 8.93].forEach((ratio, i) => {
    const osc = ctx.createOscillator();
    osc.type = i === 0 ? "triangle" : "sine";
    osc.frequency.value = base * ratio;
    const g = ctx.createGain();
    const decay = rand(0.25, 0.6) / (1 + i * 0.5);
    g.gain.setValueAtTime(0.35 / (1 + i * 0.4), t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + decay);
    osc.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + decay + 0.05);
  });
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, false);
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 2500;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.7, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  src.connect(hp).connect(ng).connect(out);
  src.start(t);
  src.stop(t + 0.15);
}

function drumHit(ctx: AudioContext, dest: AudioNode, volume = 0.4) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(110, t);
  osc.frequency.exponentialRampToValueAtTime(42, t + 0.3);
  const g = ctx.createGain();
  g.gain.setValueAtTime(volume, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  osc.connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + 0.55);
}

function mugClink(ctx: AudioContext, dest: AudioNode) {
  const t = ctx.currentTime;
  [2350, 3140].forEach((f) => {
    const osc = ctx.createOscillator();
    osc.frequency.value = f * rand(0.97, 1.03);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.25);
    osc.connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

/** Optionale echte Aufnahme aus /public/sounds/<stimmung>.mp3 (falls vorhanden). */
async function loadFile(ctx: AudioContext, mood: Mood): Promise<AudioBuffer | null> {
  for (const ext of ["mp3", "ogg", "wav"]) {
    try {
      const res = await fetch(`/sounds/${mood}.${ext}`);
      const type = res.headers.get("content-type") ?? "";
      if (!res.ok || type.includes("text/html")) continue;
      return await ctx.decodeAudioData(await res.arrayBuffer());
    } catch {
      // nächste Endung probieren
    }
  }
  return null;
}

/** Baut die Geräuschkulisse im Browser. Gibt ein Handle zum Beenden zurück. */
function startMood(ctx: AudioContext, mood: Mood): Handle {
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 1.5);

  let stopped = false;
  const sources: { stop: () => void }[] = [];
  const timers: number[] = [];

  const loopTimer = (fn: () => number) => {
    const tick = () => {
      if (stopped) return;
      const wait = fn();
      timers.push(window.setTimeout(tick, wait));
    };
    timers.push(window.setTimeout(tick, 400));
  };

  const noise = (brown: boolean, type: BiquadFilterType, freq: number, gain: number, q = 1) => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, brown);
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(filter).connect(g).connect(master);
    src.start();
    sources.push(src);
    return g;
  };

  const lfo = (target: AudioParam, freq: number, depth: number) => {
    const osc = ctx.createOscillator();
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = depth;
    osc.connect(g).connect(target);
    osc.start();
    sources.push(osc);
  };

  // Echte Aufnahme hat Vorrang, falls vorhanden.
  void loadFile(ctx, mood).then((buffer) => {
    if (!buffer || stopped) return;
    stopAllGenerated();
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(master);
    src.start();
    sources.push(src);
  });

  function stopAllGenerated() {
    timers.splice(0).forEach((t) => window.clearTimeout(t));
    stopped = false; // Aufnahme darf weiterlaufen, Generator-Timer sind weg
    sources.splice(0).forEach((s) => {
      try {
        s.stop();
      } catch {
        // schon gestoppt
      }
    });
  }

  if (mood === "storm") {
    noise(false, "highpass", 1800, 0.12);
    const wind = noise(true, "lowpass", 500, 0.9);
    lfo(wind.gain, 0.15, 0.5);
    loopTimer(() => {
      // fernes Donnergrollen
      const t = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx, true);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 200;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(1.2, t + 0.4);
      g.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
      src.connect(lp).connect(g).connect(master);
      src.start(t);
      src.stop(t + 3.6);
      return rand(8000, 16000);
    });
  } else if (mood === "tavern") {
    // Stimmengewirr: Rauschen, das wie Gesprächsfetzen an- und abschwillt
    const babbleA = noise(true, "bandpass", 420, 0.9, 1.2);
    lfo(babbleA.gain, 0.35, 0.35);
    lfo(babbleA.gain, 3.7, 0.18);
    const babbleB = noise(true, "bandpass", 950, 0.35, 1.5);
    lfo(babbleB.gain, 0.5, 0.2);
    lfo(babbleB.gain, 4.6, 0.12);

    // Laute: zufällige Melodie in D-dorisch
    const scale = [146.83, 164.81, 174.61, 196, 220, 246.94, 261.63, 293.66, 329.63, 349.23, 392];
    const buffers = scale.map((f) => pluckBuffer(ctx, f));
    const lute = ctx.createGain();
    lute.gain.value = 0.55;
    lute.connect(master);
    let degree = 4;
    let step = 0;
    loopTimer(() => {
      step += 1;
      if (Math.random() < 0.22) return rand(300, 600); // Pause
      degree = Math.min(scale.length - 1, Math.max(0, degree + Math.round(rand(-2, 2))));
      if (step % 8 === 0) degree = [0, 3, 4][Math.floor(Math.random() * 3)]; // Ruhepunkt
      const src = ctx.createBufferSource();
      src.buffer = buffers[degree];
      const g = ctx.createGain();
      g.gain.value = rand(0.5, 0.9);
      src.connect(g).connect(lute);
      src.start();
      if (step % 8 === 0) {
        // Begleitton eine Oktave tiefer
        const bass = ctx.createBufferSource();
        bass.buffer = buffers[Math.max(0, degree - 3)];
        bass.connect(lute);
        bass.start();
      }
      return [260, 260, 520, 390][Math.floor(Math.random() * 4)];
    });
    loopTimer(() => {
      mugClink(ctx, master);
      return rand(9000, 20000);
    });
  } else if (mood === "dungeon") {
    noise(true, "lowpass", 160, 1.0);
    const drone = ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.value = 55;
    const dg = ctx.createGain();
    dg.gain.value = 0.12;
    drone.connect(dg).connect(master);
    drone.start();
    sources.push(drone);
    loopTimer(() => {
      // Tropfen
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(rand(900, 1400), t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.12);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 0.2);
      osc.connect(g).connect(master);
      osc.start(t);
      osc.stop(t + 0.25);
      return rand(2500, 7000);
    });
  } else if (mood === "battle") {
    // Kriegstrommel im Hintergrund
    let beat = 0;
    loopTimer(() => {
      drumHit(ctx, master, beat % 4 === 0 ? 0.45 : 0.28);
      beat += 1;
      return 520;
    });
    // Aufeinanderschlagende Schwerter, mal einzeln, mal als Schlagabtausch
    loopTimer(() => {
      const hits = Math.random() < 0.35 ? 3 : Math.random() < 0.5 ? 2 : 1;
      for (let i = 0; i < hits; i++) {
        timers.push(
          window.setTimeout(() => {
            if (!stopped) swordClash(ctx, master, rand(0.35, 0.7));
          }, i * rand(140, 260))
        );
      }
      return rand(600, 1900);
    });
  }

  return {
    stop: () => {
      stopped = true;
      timers.forEach((t) => window.clearTimeout(t));
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      window.setTimeout(() => {
        sources.forEach((s) => {
          try {
            s.stop();
          } catch {
            // schon gestoppt
          }
        });
        master.disconnect();
      }, 700);
    },
  };
}

/** Spielt die Stimmung ab, solange `enabled` gesetzt ist (Browser verlangen vorher einen Klick). */
export function useAmbience(mood: Mood, enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!enabled || mood === "none") return;
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    void ctx.resume();
    const handle = startMood(ctx, mood);
    return () => handle.stop();
  }, [mood, enabled]);

  useEffect(() => {
    return () => {
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);
}
