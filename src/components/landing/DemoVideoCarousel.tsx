import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

// Define interface locally to avoid dependency on generated types during build
interface DemoVideo {
  _id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  duration: string;
  tier: string;
  featured: boolean;
}

interface DemoVideoCarouselProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTier: (tier: string) => void;
}

export default function DemoVideoCarousel({
  open,
  onOpenChange,
  onSelectTier,
}: DemoVideoCarouselProps) {
  // This useQuery is causing the error if context is missing
  const videos = useQuery(api.demoVideos.getFeaturedVideos) || [];

  const [selectedVideo, setSelectedVideo] = React.useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            See Pikar AI in Action
          </DialogTitle>
          <DialogDescription>
            Watch how our AI agents transform businesses across different stages.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {videos.map((video: any) => (
            <motion.div
              key={video._id}
              whileHover={{ scale: 1.02 }}
              className="relative group cursor-pointer rounded-xl overflow-hidden border border-border/50 bg-card"
              onClick={() => setSelectedVideo(video.url)}
            >
              <div className="aspect-video bg-muted relative">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground">
                    <Play className="w-6 h-6 fill-current" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-xs text-white font-medium">
                  {video.duration}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1">{video.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {video.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {video.tier}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTier(video.tier);
                      onOpenChange(false);
                    }}
                  >
                    Select Plan
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Video Player Overlay */}
        {selectedVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-white/20 transition-colors"
              >
                ✕
              </button>
              <iframe
                src={selectedVideo}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}