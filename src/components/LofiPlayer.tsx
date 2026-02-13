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
    // Lighter brown noise
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
    gain.gain.value = muted ? 0 : volume * 0.6; // lighter

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
    <div className="fixed bottom-4 left-4 z-50 select-none group">
      <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
        {/* Mode tabs */}
        <div className="flex border-b border-border/30">
          {(Object.keys(MODE_CONFIG) as AudioMode[]).map((m) => {
            const cfg = MODE_CONFIG[m];
            const Icon = cfg.icon;
            return (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 px-2 py-2 text-[9px] font-mono transition-all",
                  mode === m ? "text-primary bg-primary/5" : "text-muted-foreground/50 hover:text-muted-foreground"
                )}
              >
                <Icon className="w-3 h-3" />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button
            onClick={toggle}
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center transition-all border",
              playing
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          {/* Visualizer bars */}
          <div className="flex items-end gap-[2px] h-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-[3px] rounded-full transition-all duration-300",
                  playing ? "bg-primary/60" : "bg-muted-foreground/15"
                )}
                style={{
                  height: playing ? `${8 + Math.sin(Date.now() / 300 + i * 1.5) * 6}px` : "3px",
                  animationDuration: `${0.4 + i * 0.1}s`,
                }}
              />
            ))}
          </div>

          <button
            onClick={() => setMuted(!muted)}
            className="text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
            className="w-14 h-1 accent-primary bg-muted/40 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:appearance-none"
          />
        </div>
      </div>
    </div>
  );
};
