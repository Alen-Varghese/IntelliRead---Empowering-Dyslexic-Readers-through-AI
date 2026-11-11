import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2 } from "lucide-react";

interface TextToSpeechProps {
  text: string;
  onWordHighlight?: (wordIndex: number) => void;
}

export const TextToSpeech = ({ text, onWordHighlight }: TextToSpeechProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlay = () => {
    if (!text.trim()) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;
    utterance.lang = 'en-US';

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleSpeedChange = (value: number[]) => {
    setSpeed(value[0]);
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button
          onClick={handlePlay}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          data-testid="tts-button"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground min-w-[60px]">
            Speed: {speed.toFixed(2)}x
          </span>
          <Slider
            value={[speed]}
            onValueChange={handleSpeedChange}
            min={0.75}
            max={1.5}
            step={0.25}
            className="w-32"
          />
        </div>
      </div>
    </div>
  );
};
