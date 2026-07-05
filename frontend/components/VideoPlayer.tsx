"use client";

import React, { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

// Declare types for Video.js Player to avoid compilation errors
type VideoJSPlayer = ReturnType<typeof videojs>;

interface VideoPlayerProps {
  src: string;
  autoplay?: boolean | "play" | "muted" | "any";
  onReady?: (player: VideoJSPlayer) => void;
}

export const VideoPlayer = ({ src, autoplay = "any", onReady }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<VideoJSPlayer | null>(null);

  // Helper to determine stream mime type
  const getSourceType = (url: string) => {
    return url.includes(".m3u8") ? "application/x-mpegURL" : "video/mp4";
  };

  useEffect(() => {
    const playerOptions = {
      autoplay,
      controls: true,
      responsive: true,
      fluid: true,
      sources: [
        {
          src: src,
          type: getSourceType(src),
        },
      ],
      html5: {
        vhs: {
          overrideNative: true,
        },
      },
    };

    if (!playerRef.current && videoRef.current) {
      // Create a new video-js element and append it to the container ref
      const videoElement = document.createElement("video-js");
      videoElement.classList.add("vjs-big-play-centered", "vjs-theme-forest");
      videoRef.current.appendChild(videoElement);

      const player = (playerRef.current = videojs(videoElement, playerOptions, () => {
        videojs.log("Player is initialized and ready");
        if (onReady) {
          onReady(player);
        }
      }));
    } else if (playerRef.current) {
      // If the player already exists, dynamically update its settings
      const player = playerRef.current;
      player.autoplay(autoplay);
      player.src({
        src: src,
        type: getSourceType(src),
      });
    }
  }, [src, autoplay, onReady]);

  // Dispose of player on unmount
  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player className="w-full overflow-hidden rounded-xl border border-zinc-800 bg-black">
      <div ref={videoRef} />
    </div>
  );
};

export default VideoPlayer;
