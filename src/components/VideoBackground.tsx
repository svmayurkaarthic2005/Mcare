import { useState, useEffect, useRef, useMemo } from "react";

interface VideoBackgroundProps {
  src: string;
  className?: string;
}

export const VideoBackground = ({ src, className = "" }: VideoBackgroundProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use intersection observer to only load when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || !videoRef.current) return;

    const video = videoRef.current;

    // Attempt to play the video with fallback
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Auto-play failed (common on mobile), video will still load
        console.debug("Video autoplay prevented");
      });
    }

    // Mark as loaded once we have data
    const handleLoadedMetadata = () => {
      setIsLoaded(true);
    };

    const handleCanPlay = () => {
      setIsLoaded(true);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", handleCanPlay);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, [isVisible]);

  // Memoize the fallback gradient to avoid re-renders
  const fallbackGradient = useMemo(
    () => (
      <div
        className={`${className} bg-gradient-to-br from-primary/20 to-accent/20 absolute inset-0 transition-opacity duration-500 ${
          isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      />
    ),
    [className, isLoaded]
  );

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {isVisible && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className={`${className} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-500`}
          aria-hidden="true"
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
      {fallbackGradient}
    </div>
  );
};
