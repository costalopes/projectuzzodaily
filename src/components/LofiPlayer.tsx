import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Radio, Wind, Music } from "lucide-react";
import { cn } from "@/lib/utils";

type AudioMode = "lofi-hiphop" | "lofi-study" | "white-noise";

const MODE_CONFIG: Record<AudioMode, { label: string; icon: typeof Radio; streams?: string[] }> = {
  "lofi-hiphop": {
    label: "hip hop",
    icon: Radio,
    streams: [
      "https://streams.ilovemusic.de/iloveradio17.mp3",
      "https://play.streamafrica.net/lofiradio",
    ],
  },
  "lofi-study": {
    label: "study",
    icon: Music,
    streams: [
      "https://play.streamafrica.net/lofiradio",
      "https://streams.ilovemusic.de/iloveradio17.mp3",
    ],
  },
  "white-noise": {
    label: "ruído",
    icon: Wind,
  },
};

interface LofiPlayerProps {
  onPlayingChange?: (playing: boolean) => void;
}

export const LofiPlayer = ({ onPlayingChange }: LofiPlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<AudioMode>("lofi-hiphop");
  const [volume, setVolume] = useState(0.4);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const noiseCtxRef = useRef<AudioContext | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [barHeights, setBarHeights] = useState([3, 3, 3, 3, 3]);

  // Animate visualizer bars
  useEffect(() => {
    if (!playing) {
      setBarHeights([3, 3, 3, 3, 3]);
      return;
    }
    const interval = setInterval(() => {
      setBarHeights(prev => prev.map(() => 4 + Math.random() * 10));
    }, 180);
    return () => clearInterval(interval);
  }, [playing]);

  const stopLofi = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }, []);

  const stopNoise = useCallback(() => {
    if (noiseSourceRef.current) {
      try { noiseSourceRef.current.stop(); } catch {}
      noiseSourceRef.current = null;
    }
    if (noiseCtxRef.current) {
      noiseCtxRef.current.close();
      noiseCtxRef.current = null;
      noiseGainRef.current = null;
    }
  }, []);

  const stopAll = useCallback(() => {
    stopLofi();
    stopNoise();
  }, [stopLofi, stopNoise]);

  const playLofi = useCallback((m: AudioMode) => {
    stopAll();
    const cfg = MODE_CONFIG[m];
    if (!cfg.streams) return;
    const audio = new Audio(cfg.streams[0]);
    audio.crossOrigin = "anonymous";
    audio.volume = muted ? 0 : volume;
    audio.loop = true;
    audio.play().catch(() => {
      if (cfg.streams![1]) {
        audio.src = cfg.streams![1];
        audio.play().catch(() => {});
      }
    });
    audioRef.current = audio;
  }, [volume, muted, stopAll]);

  const playWhiteNoise = useCallback(() => {
    stopAll();
    const ctx = new AudioContext();
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.015 * white) / 1.015;
      data[i] = last * 2.5;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = muted ? 0 : volume * 0.6;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    noiseCtxRef.current = ctx;
    noiseGainRef.current = gain;
    noiseSourceRef.current = source;
  }, [volume, muted, stopAll]);

  const toggle = useCallback(() => {
    if (playing) {
      stopAll();
      setPlaying(false);
      onPlayingChange?.(false);
    } else {
      if (mode === "white-noise") playWhiteNoise();
      else playLofi(mode);
      setPlaying(true);
      onPlayingChange?.(true);
    }
  }, [playing, mode, playLofi, playWhiteNoise, stopAll, onPlayingChange]);

  const switchMode = useCallback((newMode: AudioMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    if (playing) {
      stopAll();
      setTimeout(() => {
        if (newMode === "white-noise") playWhiteNoise();
        else playLofi(newMode);
      }, 50);
    }
  }, [mode, playing, stopAll, playLofi, playWhiteNoise]);

  useEffect(() => {
    const vol = muted ? 0 : volume;
    if (audioRef.current) audioRef.current.volume = vol;
    if (noiseGainRef.current) noiseGainRef.current.gain.value = mode === "white-noise" ? vol * 0.6 : vol;
  }, [volume, muted, mode]);

  useEffect(() => () => stopAll(), [stopAll]);

  return (
    <div className="fixed bottom-4 left-4 z-50 select-none">
      <div className="bg-card/95 backdrop-blur-2xl border border-border/40 rounded-2xl shadow-2xl overflow-hidden animate-fade-in w-[220px]">
        {/* Mode tabs */}
        <div className="flex gap-0.5 p-1.5 bg-muted/20">
          {(Object.keys(MODE_CONFIG) as AudioMode[]).map((m) => {
            const cfg = MODE_CONFIG[m];
            const Icon = cfg.icon;
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-mono transition-all",
                  active
                    ? "bg-card shadow-sm border border-border/40 text-primary font-semibold"
                    : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Play button */}
          <button
            onClick={toggle}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-all border-2 shrink-0",
              playing
                ? "bg-primary/15 border-primary/40 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                : "border-border/50 text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 hover:bg-muted/20"
            )}
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          {/* Visualizer bars */}
          <div className="flex items-end gap-[3px] h-5 min-w-[23px]">
            {barHeights.map((h, i) => (
              <div
                key={i}
                className={cn(
                  "w-[3px] rounded-full transition-all",
                  playing ? "bg-primary/70" : "bg-muted-foreground/15"
                )}
                style={{
                  height: `${h}px`,
                  transitionDuration: "150ms",
                }}
              />
            ))}
          </div>

          {/* Volume */}
          <button
            onClick={() => setMuted(!muted)}
            className="text-muted-foreground/50 hover:text-foreground transition-colors shrink-0"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Volume slider */}
          <div className="flex-1 relative flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
              className="w-full h-1 rounded-full appearance-none cursor-pointer bg-muted/50 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-[0_0_6px_hsl(var(--primary)/0.3)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary/60 [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-110"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
