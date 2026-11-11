import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SpeechToTextProps {
  onTranscript: (text: string) => void;
}

export const SpeechToText = ({ onTranscript }: SpeechToTextProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart + ' ';
        } else {
          interimTranscript += transcriptPart;
        }
      }

      const fullTranscript = (finalTranscript || interimTranscript).trim();
      setTranscript(fullTranscript);
      onTranscript(fullTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to use speech-to-text.",
          variant: "destructive"
        });
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast, onTranscript]);

  const toggleRecording = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive"
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setTranscript("");
        onTranscript("");
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (error) {
        toast({
          title: "Microphone Error",
          description: "Could not access microphone. Please check permissions.",
          variant: "destructive"
        });
      }
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted rounded-lg">
        <AlertCircle className="w-4 h-4" />
        Speech-to-text not supported in this browser
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={toggleRecording}
        variant={isRecording ? "destructive" : "secondary"}
        size="sm"
        className="flex items-center gap-2"
        data-testid="stt-button"
      >
        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </Button>
      {isRecording && (
        <p className="text-sm text-muted-foreground animate-pulse">
          Listening... Speak now
        </p>
      )}
      {transcript && !isRecording && (
        <p className="text-sm text-foreground bg-primary/5 p-2 rounded">
          "{transcript}"
        </p>
      )}
    </div>
  );
};
