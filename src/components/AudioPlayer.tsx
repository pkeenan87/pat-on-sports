import { useCallback, useEffect, useId, useRef, useState } from "react";

type AudioPlayerProps = {
  src: string;
  title: string;
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({ src, title }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressId = useId();
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDuration = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDuration);
    audio.addEventListener("loadedmetadata", onDuration);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDuration);
      audio.removeEventListener("loadedmetadata", onDuration);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }, []);

  const seek = useCallback((value: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(value)) return;
    audio.currentTime = value;
    setCurrentTime(value);
  }, []);

  const max = duration > 0 ? duration : 0;
  const label = playing ? "Pause" : "Listen to this article";

  return (
    <div className="rounded-xl border border-silver/40 bg-white p-3 sm:p-4">
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        aria-label={`Audio recording of ${title}`}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={label}
          aria-pressed={playing}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-white transition-colors hover:bg-navy-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
        >
          {playing ? (
            <PauseIcon />
          ) : (
            <PlayIcon />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy">
            Listen to this article
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="w-10 shrink-0 text-xs tabular-nums text-navy-muted">
              {formatTime(currentTime)}
            </span>
            <input
              id={progressId}
              type="range"
              min={0}
              max={max || 1}
              step="0.1"
              value={currentTime}
              disabled={max === 0}
              aria-label="Playback position"
              aria-valuetext={formatTime(currentTime)}
              onChange={(event) => seek(Number(event.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-silver/40 accent-navy disabled:cursor-default disabled:opacity-60"
            />
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-navy-muted">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 translate-x-px"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7 5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H7Zm7 0a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-3Z" />
    </svg>
  );
}
