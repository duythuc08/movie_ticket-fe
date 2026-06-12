"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Star } from "lucide-react";
import axios from "@/lib/axios"; // Adjust path if necessary

interface UnreviewedMovieResponse {
  movieId: number;
  movieName: string;
  posterUrl: string;
}

export function ReviewNotificationBanner() {
  const [unreviewedMovie, setUnreviewedMovie] = useState<UnreviewedMovieResponse | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchUnreviewedMovie = async () => {
      try {
        const res = await axios.get("/reviews/recent-unreviewed");
        if (res.data?.result) {
          const movie = res.data.result;
          const dismissedMovieId = localStorage.getItem("dismissedReviewMovieId");
          if (dismissedMovieId !== String(movie.movieId)) {
            setUnreviewedMovie(movie);
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error("Error fetching unreviewed movie:", error);
      }
    };

    fetchUnreviewedMovie();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (unreviewedMovie) {
      localStorage.setItem("dismissedReviewMovieId", String(unreviewedMovie.movieId));
    }
  };

  if (!isVisible || !unreviewedMovie) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 sm:px-6 lg:px-8 shadow-md relative">
      <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-4">
        <div className="flex items-center gap-4 flex-1">
          {unreviewedMovie.posterUrl && (
            <img 
              src={unreviewedMovie.posterUrl} 
              alt={unreviewedMovie.movieName} 
              className="w-12 h-16 object-cover rounded shadow-sm hidden sm:block"
            />
          )}
          <div>
            <p className="font-semibold text-sm sm:text-base flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              Bạn đã xem "{unreviewedMovie.movieName}" gần đây!
            </p>
            <p className="text-sm text-blue-100 hidden sm:block">
              Hãy chia sẻ cảm nghĩ của bạn về bộ phim này để giúp mọi người nhé.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Link 
            href={`/movie/${unreviewedMovie.movieId}#reviews`}
            className="bg-white text-blue-600 px-4 py-2 rounded-full font-medium text-sm hover:bg-blue-50 transition-colors shadow-sm flex-1 sm:flex-none text-center"
          >
            Đánh giá ngay
          </Link>
          <button 
            onClick={handleDismiss}
            className="p-2 hover:bg-white/20 rounded-full transition-colors focus:outline-none"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
