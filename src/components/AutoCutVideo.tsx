"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  poster?: string;
  className?: string;
  style?: React.CSSProperties;
};

// Plays 3–5s segments, then jump-cuts forward by another 3–5s. On a
// 90s source that compresses to ~45s of alternating play/skip.
const MIN_SEG = 3;
const MAX_SEG = 5;
const nextSeg = () => MIN_SEG + Math.random() * (MAX_SEG - MIN_SEG);

export default function AutoCutVideo({ src, poster, className, style }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cutAtRef = useRef<number>(nextSeg());

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const scheduleNextCut = () => {
      cutAtRef.current = video.currentTime + nextSeg();
    };

    const onPlay = scheduleNextCut;

    const onTimeUpdate = () => {
      if (video.currentTime < cutAtRef.current) return;
      const skip = nextSeg();
      const target = video.currentTime + skip;
      if (!Number.isFinite(video.duration) || target >= video.duration - 0.25) {
        video.currentTime = 0;
      } else {
        video.currentTime = target;
      }
      scheduleNextCut();
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      controls
      preload="auto"
      className={className}
      style={style}
    />
  );
}
