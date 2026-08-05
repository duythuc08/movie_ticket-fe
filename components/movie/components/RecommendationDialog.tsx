"use client";

import { useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Star, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { ImageWithFallback } from "@/components/movie/components/ImageWithFallback";

export interface RecommendationItemResponse {
  movieId: number;
  title: string;
  posterUrl: string;
  description: string;
  duration: number;
  genres?: string[];
  predictedScore: number;
  neighborCount: number;
  averageRating: number;
  source: string;
}

export interface GenreProfileItem {
  genreName: string;
  likedCount: number;
  weightPct: number;
}

interface RecommendationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendations: RecommendationItemResponse[];
  usedColdStart?: boolean;
  genreProfile?: GenreProfileItem[];
}

export function RecommendationDialog({ open, onOpenChange, recommendations, usedColdStart = false, genreProfile = [] }: RecommendationDialogProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isColdStartRecommendation =
    usedColdStart ||
    (recommendations.length > 0 && recommendations.every((item) => item.source === "cold_start_popularity"));

  // Dispatch event when dialog closes so ReviewNotificationBanner can pick it up
  useEffect(() => {
    if (!open && recommendations.length > 0) {
      const event = new CustomEvent("recommendation:dismissed", { detail: recommendations });
      window.dispatchEvent(event);
    }
  }, [open, recommendations]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 bg-white">
        <div className="relative w-full h-full px-6 py-8 sm:px-8 flex flex-col">
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-50 p-2.5 bg-gray-50 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>

          <DialogHeader className="mb-4 flex flex-col items-center text-center space-y-3">
            <DialogTitle className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {isColdStartRecommendation ? "Phim phù hợp dành cho người dùng mới" : "Phim phù hợp dành cho bạn"}
            </DialogTitle>
            {isColdStartRecommendation || genreProfile.length === 0 ? (
              <p className="text-sm sm:text-base text-gray-500 max-w-[80%] mx-auto leading-relaxed">
                Dựa trên sở thích và đánh giá của bạn, chúng tôi đã tinh chọn những bộ phim đặc biệt này.
              </p>
            ) : (
              <p className="text-sm sm:text-base text-gray-500 max-w-[80%] mx-auto leading-relaxed">
                Bạn thường đánh giá cao các phim thuộc thể loại{" "}
                <span className="text-gray-700 font-semibold">
                  {genreProfile
                    .map((g) => g.genreName)
                    .join(", ")}
                </span>
                {" "}— đây là những bộ phim chúng tôi tin bạn sẽ thích.
              </p>
            )}
          </DialogHeader>

          {recommendations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Chưa có gợi ý nào cho bạn lúc này.
            </div>
          ) : (
            <div className="relative flex-1 min-h-[400px]">
              {/* Scroll buttons */}
              <button 
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-40 -ml-4 p-3 bg-white hover:bg-gray-50 text-gray-700 rounded-full shadow-xl border border-gray-200 transition-all hover:scale-110"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <button 
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-40 -mr-4 p-3 bg-white hover:bg-gray-50 text-gray-700 rounded-full shadow-xl border border-gray-200 transition-all hover:scale-110"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              <div 
                ref={scrollRef}
                className="flex overflow-x-auto gap-6 pb-6 pt-2 px-2 snap-x snap-mandatory hide-scrollbar h-full items-center"
              >
                {recommendations.map((item) => (
                  <div
                    key={item.movieId}
                    className="relative group cursor-pointer flex-none w-[260px] snap-start"
                    onClick={() => {
                      onOpenChange(false);
                      router.push(`/movie/${item.movieId}`);
                    }}
                  >
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg transition-all duration-300 ease-in-out group-hover:-translate-y-2 group-hover:shadow-2xl">
                      <ImageWithFallback
                        src={item.posterUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Always-on gradient overlay for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <h3 className="text-white text-sm font-semibold mb-1 line-clamp-2 leading-tight">
                          {item.title}
                        </h3>
                        {item.genres && item.genres.length > 0 && (
                          <p className="text-primary/90 text-[11px] font-medium mb-1.5 line-clamp-1">
                            {item.genres
                              .map((g) => g)
                              .join(" · ")}
                          </p>
                        )}
                        <p className="text-white/70 text-xs mb-2 line-clamp-2">{item.description}</p>

                        <div className="flex items-center gap-2 mb-3">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-yellow-400 text-xs font-semibold">
                            {item.averageRating > 0 ? item.averageRating.toFixed(1) : "—"}
                          </span>
                          <span className="text-white/60 text-xs">•</span>
                          <span className="text-white/60 text-xs">{item.duration} phút</span>
                        </div>

                        <div className="flex gap-2 relative z-10">
                          <div className="flex-1 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 shadow-lg">
                            <Play className="w-3 h-3 fill-current" />
                            <span className="text-xs font-semibold">Đặt Vé</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
