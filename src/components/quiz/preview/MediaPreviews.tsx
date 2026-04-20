import { logger } from '@/lib/logger';
import { useState, useEffect, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Play, Pause } from "lucide-react";

/** Player genérico de mídia (vídeo direto / áudio fallback) */
export const MediaPlayer = ({ url, type }: { url: string; type: 'video' | 'audio' }) => {
  const [error, setError] = useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement, Event>) => {
    logger.error(`❌ ${type} playback error:`, e);
    logger.error(`❌ URL:`, url);
    setError(true);
  };

  if (error || !url) {
    return (
      <Alert>
        <AlertDescription className="space-y-2">
          <p>Não foi possível reproduzir o {type === 'video' ? 'vídeo' : 'áudio'} diretamente.</p>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Clique aqui para abrir em nova aba →
          </a>
        </AlertDescription>
      </Alert>
    );
  }

  if (type === 'video') {
    return (
      <video
        src={url}
        controls
        crossOrigin="anonymous"
        preload="metadata"
        className="w-full rounded-lg"
        playsInline
        onError={handleError}
      >
        Seu navegador não suporta vídeo.
      </video>
    );
  }

  return <AudioPlayerWhatsApp url={url} />;
};

/** Player de áudio estilo WhatsApp */
export const AudioPlayerWhatsApp = ({ url }: { url: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); } else { audio.play(); }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const changeSpeed = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const speeds = [1, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    audio.playbackRate = nextSpeed;
    setPlaybackSpeed(nextSpeed);
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 bg-muted/50 rounded-full px-4 py-3 max-w-md">
      <audio ref={audioRef} src={url} preload="metadata" />
      <button
        onClick={togglePlay}
        className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>
      <div className="flex-1 space-y-1">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="cursor-pointer"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <button onClick={changeSpeed} className="hover:text-foreground transition-colors font-medium">
            {playbackSpeed}x
          </button>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
