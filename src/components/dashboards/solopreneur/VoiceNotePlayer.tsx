import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2 } from "lucide-react";

interface VoiceNotePlayerProps {
  audioUrl: string;
  transcript?: string;
  summary?: string;
}

export function VoiceNotePlayer({ audioUrl, transcript, summary }: VoiceNotePlayerProps) {
  const [playing, setPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={togglePlay}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} />
        </div>
        
        {summary && (
          <div className="p-3 bg-blue-50 rounded-md">
            <p className="text-sm font-medium mb-1">Summary</p>
            <p className="text-sm text-muted-foreground">{summary}</p>
          </div>
        )}
        
        {transcript && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium mb-1">Transcript</p>
            <p className="text-sm text-muted-foreground">{transcript}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}