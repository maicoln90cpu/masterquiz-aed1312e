import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  Settings,
  RotateCcw,
  SkipBack,
  SkipForward,
  Subtitles,
  Loader2
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useVideoAnalytics } from '@/hooks/useVideoAnalytics';

interface CustomVideoPlayerProps {
  src: string;
  poster?: string;
  captionsUrl?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  hideControls?: boolean;
  hidePlayButton?: boolean;
  startTime?: number;
  endTime?: number;
  playbackSpeed?: number;
  showCaptions?: boolean;
  aspectRatio?: '16:9' | '4:3' | '1:1' | '9:16';
  // Analytics props
  quizId?: string;
  videoId?: string;
  enableAnalytics?: boolean;
  // Event callbacks
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number, percentage: number) => void;
  onProgress?: (percentage: number) => void;
  onSpeedChange?: (speed: number) => void;
  className?: string;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const CustomVideoPlayer = ({
  src,
  poster,
  captionsUrl,
  autoplay = false,
  muted: initialMuted = false,
  loop = false,
  hideControls = false,
  hidePlayButton = false,
  startTime = 0,
  endTime,
  playbackSpeed: initialSpeed = 1,
  showCaptions = true,
  aspectRatio = '16:9',
  quizId,
  videoId,
  enableAnalytics = true,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onProgress,
  onSpeedChange,
  className,
}: CustomVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchTimeRef = useRef<number>(0);

  // Video analytics hook
  const analytics = useVideoAnalytics();

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [volume, setVolume] = useState(initialMuted ? 0 : 1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(initialSpeed);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCaptionsTrack, setShowCaptionsTrack] = useState(showCaptions);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);

  // Analytics helper
  const trackAnalytics = useCallback((eventType: 'play' | 'pause' | 'ended' | 'seek' | 'speedChange') => {
    if (!enableAnalytics) return;
    
    const analyticsParams = {
      quiz_id: quizId,
      video_id: videoId,
      video_url: src,
    };

    switch (eventType) {
      case 'play':
        analytics.trackPlay(analyticsParams);
        break;
      case 'pause':
        analytics.trackPause({
          ...analyticsParams,
          watch_time_seconds: Math.round(watchTimeRef.current),
          percentage_watched: duration > 0 ? Math.round((currentTime / duration) * 100) : 0,
        });
        break;
      case 'ended':
        analytics.trackEnded({
          ...analyticsParams,
          watch_time_seconds: Math.round(watchTimeRef.current),
        });
        break;
    }
  }, [enableAnalytics, quizId, videoId, src, analytics, duration, currentTime]);

  // Track progress at milestones
  const trackProgressMilestones = useCallback((percentage: number) => {
    if (!enableAnalytics) return;
    
    analytics.trackProgress({
      quiz_id: quizId,
      video_id: videoId,
      video_url: src,
      percentage,
      watch_time_seconds: Math.round(watchTimeRef.current),
    });
  }, [enableAnalytics, quizId, videoId, src, analytics]);

  // Aspect ratio classes
  const aspectRatioClass = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
    '9:16': 'aspect-[9/16]',
  }[aspectRatio];

  // Format time helper
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = playbackSpeed;
    video.muted = isMuted;
    video.volume = volume;

    if (startTime > 0) {
      video.currentTime = startTime;
    }

    if (autoplay) {
      video.play().catch(() => {
        // Autoplay blocked, require user interaction
        setIsPlaying(false);
      });
    }
  }, [src]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      if (startTime > 0) {
        video.currentTime = startTime;
      }
    };

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      setCurrentTime(current);
      
      // Update watch time
      watchTimeRef.current = current - startTime;
      
      // Check end time
      if (endTime && current >= endTime) {
        video.pause();
        if (loop) {
          video.currentTime = startTime;
          video.play();
        } else {
          setIsPlaying(false);
          trackAnalytics('ended');
          onEnded?.();
        }
      }

      const percentage = video.duration ? (current / video.duration) * 100 : 0;
      onTimeUpdate?.(current, video.duration, percentage);
      
      // Track progress milestones
      trackProgressMilestones(percentage);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferedPercent = (bufferedEnd / video.duration) * 100;
        setBuffered(bufferedPercent);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      trackAnalytics('play');
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      trackAnalytics('pause');
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (loop) {
        video.currentTime = startTime;
        video.play();
      } else {
        trackAnalytics('ended');
        onEnded?.();
      }
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setError('Erro ao carregar o vídeo');
      setIsLoading(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [startTime, endTime, loop, onPlay, onPause, onEnded, onTimeUpdate, trackAnalytics, trackProgressMilestones]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) && 
          document.activeElement !== containerRef.current) return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekRelative(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekRelative(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'j':
          e.preventDefault();
          seekRelative(-10);
          break;
        case 'l':
          e.preventDefault();
          seekRelative(10);
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault();
          const percent = parseInt(e.key) * 10;
          seekToPercent(percent);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (hideControls) return;

    const showControls = () => {
      setShowControlsOverlay(true);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      if (isPlaying) {
        hideControlsTimeoutRef.current = setTimeout(() => {
          setShowControlsOverlay(false);
        }, 3000);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', showControls);
      container.addEventListener('mouseenter', showControls);
      container.addEventListener('mouseleave', () => {
        if (isPlaying) setShowControlsOverlay(false);
      });
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', showControls);
        container.removeEventListener('mouseenter', showControls);
      }
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [isPlaying, hideControls]);

  // Control functions
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const newMuted = !isMuted;
    video.muted = newMuted;
    setIsMuted(newMuted);
    if (!newMuted && volume === 0) {
      setVolume(0.5);
      video.volume = 0.5;
    }
  }, [isMuted, volume]);

  const adjustVolume = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = Math.max(0, Math.min(1, volume + delta));
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    video.muted = newVolume === 0;
  }, [volume]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0];
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    video.muted = newVolume === 0;
  }, []);

  const seekRelative = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = Math.max(startTime, Math.min(endTime || video.duration, video.currentTime + seconds));
    video.currentTime = newTime;
  }, [startTime, endTime]);

  const seekToPercent = useCallback((percent: number) => {
    const video = videoRef.current;
    if (!video) return;

    const effectiveDuration = (endTime || video.duration) - startTime;
    const newTime = startTime + (effectiveDuration * percent / 100);
    video.currentTime = newTime;
  }, [startTime, endTime]);

  const handleSeek = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = value[0];
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const effectiveDuration = (endTime || duration) - startTime;
    video.currentTime = startTime + (effectiveDuration * percent);
  }, [duration, startTime, endTime]);

  const handleProgressHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressRef.current;
    if (!progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const effectiveDuration = (endTime || duration) - startTime;
    const time = startTime + (effectiveDuration * percent);
    
    setHoverTime(time);
    setHoverPosition(e.clientX - rect.left);
  }, [duration, startTime, endTime]);

  const changePlaybackSpeed = useCallback((speed: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = speed;
    setPlaybackSpeed(speed);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    if (isFullscreen) {
      await document.exitFullscreen();
    } else {
      await container.requestFullscreen();
    }
  }, [isFullscreen]);

  const restart = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = startTime;
    video.play();
  }, [startTime]);

  // Calculate effective progress
  const effectiveDuration = (endTime || duration) - startTime;
  const effectiveCurrentTime = currentTime - startTime;
  const progressPercent = effectiveDuration > 0 ? (effectiveCurrentTime / effectiveDuration) * 100 : 0;

  if (error) {
    return (
      <div className={cn('rounded-lg flex items-center justify-center p-8', className)}>
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative group rounded-lg overflow-hidden focus:outline-none',
        className
      )}
      tabIndex={0}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        loop={loop}
        playsInline
        className="w-full h-full object-contain"
        crossOrigin={captionsUrl ? "anonymous" : undefined}
      >
        {captionsUrl && showCaptionsTrack && (
          <track
            kind="captions"
            src={captionsUrl}
            srcLang="pt"
            label="Português"
            default
          />
        )}
      </video>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      )}

      {/* Center Play Button */}
      {!hidePlayButton && !isPlaying && !isLoading && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group/play"
        >
          <div className="h-20 w-20 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center transition-transform group-hover/play:scale-110">
            <Play className="h-10 w-10 text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Controls Overlay */}
      {!hideControls && (
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-300',
            showControlsOverlay || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          {/* Progress Bar */}
          <div
            ref={progressRef}
            className="relative h-1 bg-white/30 rounded-full cursor-pointer mb-3 group/progress"
            onClick={handleProgressClick}
            onMouseMove={handleProgressHover}
            onMouseLeave={() => setHoverTime(null)}
          >
            {/* Buffered */}
            <div
              className="absolute h-full bg-white/50 rounded-full"
              style={{ width: `${buffered}%` }}
            />
            {/* Progress */}
            <div
              className="absolute h-full bg-primary rounded-full"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
            {/* Hover indicator */}
            <div
              className="absolute h-full w-1 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `${hoverPosition}px`, transform: 'translateX(-50%)' }}
            />
            {/* Hover time tooltip */}
            {hoverTime !== null && (
              <div
                className="absolute -top-8 px-2 py-1 bg-black/80 text-white text-xs rounded transform -translate-x-1/2"
                style={{ left: `${hoverPosition}px` }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
            {/* Scrubber */}
            <div
              className="absolute top-1/2 h-3 w-3 bg-primary rounded-full transform -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-4">
            {/* Left Controls */}
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" fill="currentColor" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
                )}
              </Button>

              {/* Skip Back */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => seekRelative(-10)}
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              {/* Skip Forward */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => seekRelative(10)}
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              {/* Volume */}
              <div className="flex items-center gap-1 group/volume">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-200">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.05}
                    onValueChange={handleVolumeChange}
                    className="w-20"
                  />
                </div>
              </div>

              {/* Time */}
              <span className="text-white text-sm tabular-nums">
                {formatTime(effectiveCurrentTime)} / {formatTime(effectiveDuration)}
              </span>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1">
              {/* Restart */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={restart}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              {/* Captions Toggle */}
              {captionsUrl && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8 text-white hover:bg-white/20',
                    showCaptionsTrack && 'bg-white/20'
                  )}
                  onClick={() => setShowCaptionsTrack(!showCaptionsTrack)}
                >
                  <Subtitles className="h-4 w-4" />
                </Button>
              )}

              {/* Settings (Speed) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuLabel>Velocidade</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {PLAYBACK_SPEEDS.map((speed) => (
                    <DropdownMenuItem
                      key={speed}
                      onClick={() => changePlaybackSpeed(speed)}
                      className={cn(playbackSpeed === speed && 'bg-accent')}
                    >
                      {speed === 1 ? 'Normal' : `${speed}x`}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      {!hideControls && !isPlaying && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
            Espaço: Play | F: Tela cheia | M: Mudo
          </span>
        </div>
      )}
    </div>
  );
};
