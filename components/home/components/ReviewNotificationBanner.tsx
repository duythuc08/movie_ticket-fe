"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Star, BellRing } from "lucide-react";
import { apiFetch } from "@/lib/fetchApi";
import { useAuth } from "@/context/AuthContext";

interface UnreviewedMovieResponse {
  movieId: number;
  movieName: string;
  posterUrl: string;
}

export function ReviewNotificationBanner() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [allUnreviewed, setAllUnreviewed] = useState<UnreviewedMovieResponse[]>([]);
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMovieForDialog, setSelectedMovieForDialog] = useState<UnreviewedMovieResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"reviews" | "recommendations">("reviews");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    // Load dismissed IDs from local storage
    const stored = localStorage.getItem("dismissedReviewMovieIds");
    if (stored) {
      try {
        setDismissedIds(JSON.parse(stored));
      } catch (e) {
        setDismissedIds([]);
      }
    }

    const fetchUnreviewedMovies = async () => {
      try {
        const res = await apiFetch("/reviews/recent-unreviewed");
        const data = await res.json();
        if (data?.result && Array.isArray(data.result)) {
          setAllUnreviewed(data.result);
        }
      } catch (error) {
        console.error("Error fetching unreviewed movies:", error);
      }
    };

    fetchUnreviewedMovies();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDismissBanner = (movieId: number) => {
    const updated = [...dismissedIds, movieId];
    setDismissedIds(updated);
    localStorage.setItem("dismissedReviewMovieIds", JSON.stringify(updated));
  };

  // Find the first movie that is NOT dismissed to show in the main banner
  const bannerMovie = allUnreviewed.find(m => !dismissedIds.includes(m.movieId));
  
  // All movies that ARE dismissed (or we can just show all unreviewed in the bell)
  // According to requirements: "nếu nhấn X nữa thì đưa vô noti" -> only dismissed ones go to noti
  const notificationMovies = allUnreviewed.filter(m => dismissedIds.includes(m.movieId));

  const [dismissedRecommendations, setDismissedRecommendations] = useState<any[]>([]);

  useEffect(() => {
    // Load dismissed recommendations from sessionStorage
    const storedRecs = sessionStorage.getItem("dismissedRecommendationsCache");
    if (storedRecs) {
      try {
        setDismissedRecommendations(JSON.parse(storedRecs));
      } catch (e) {}
    }

    const handleRecommendationDismissed = (e: Event) => {
      const customEvent = e as CustomEvent;
      const recs = customEvent.detail;
      if (recs && recs.length > 0) {
        setDismissedRecommendations(recs);
        sessionStorage.setItem("dismissedRecommendationsCache", JSON.stringify(recs));
      }
    };

    window.addEventListener("recommendation:dismissed", handleRecommendationDismissed);
    return () => window.removeEventListener("recommendation:dismissed", handleRecommendationDismissed);
  }, []);

  const handleConfirmReview = () => {
    if (selectedMovieForDialog) {
      router.push(`/movie/${selectedMovieForDialog.movieId}#reviews`);
      setSelectedMovieForDialog(null);
      setIsDropdownOpen(false);
    }
  };

  if (!isAuthenticated && allUnreviewed.length === 0 && dismissedRecommendations.length === 0) return null;

  const totalNotifications = notificationMovies.length + dismissedRecommendations.length;

  return (
    <>
      {/* Main Banner for the first un-dismissed movie */}
      {bannerMovie && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 sm:px-6 lg:px-8 shadow-md relative z-40">
          <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-4">
            <div className="flex items-center gap-4 flex-1">
              {bannerMovie.posterUrl && (
                <img 
                  src={bannerMovie.posterUrl} 
                  alt={bannerMovie.movieName} 
                  className="w-12 h-16 object-cover rounded shadow-sm hidden sm:block"
                />
              )}
              <div>
                <p className="font-semibold text-sm sm:text-base flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                  Bạn đã xem "{bannerMovie.movieName}" gần đây!
                </p>
                <p className="text-sm text-blue-100 hidden sm:block">
                  Hãy chia sẻ cảm nghĩ của bạn về bộ phim này để giúp mọi người nhé.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Link 
                href={`/movie/${bannerMovie.movieId}#reviews`}
                className="bg-white text-blue-600 px-4 py-2 rounded-full font-medium text-sm hover:bg-blue-50 transition-colors shadow-sm flex-1 sm:flex-none text-center"
              >
                Đánh giá ngay
              </Link>
              <button 
                onClick={() => handleDismissBanner(bannerMovie.movieId)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors focus:outline-none"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bell Notification for dismissed movies & recommendations */}
      {totalNotifications > 0 && (
        <div className="fixed bottom-6 right-6 z-50" ref={dropdownRef}>
          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-5 fade-in-20">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700 text-sm">Thông báo</h3>
                <button onClick={() => setIsDropdownOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                <button
                  className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider text-center transition-colors ${
                    activeTab === "reviews" 
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" 
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveTab("reviews")}
                >
                  Chờ đánh giá ({notificationMovies.length})
                </button>
                <button
                  className={`relative flex-1 py-2 text-xs font-semibold uppercase tracking-wider text-center transition-colors ${
                    activeTab === "recommendations" 
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" 
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveTab("recommendations")}
                >
                  Phim gợi ý
                  {dismissedRecommendations.length > 0 && (
                    <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                      !
                    </span>
                  )}
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto bg-white">
                
                {/* 1. Reviews Tab */}
                {activeTab === "reviews" && (
                  <div>
                    {notificationMovies.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 text-sm">
                        Chưa có phim nào chờ đánh giá.
                      </div>
                    ) : (
                      notificationMovies.map(movie => (
                        <button
                          key={`rev-${movie.movieId}`}
                          onClick={() => setSelectedMovieForDialog(movie)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-50 transition-colors text-left"
                        >
                          <img src={movie.posterUrl} alt={movie.movieName} className="w-10 h-14 object-cover rounded" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{movie.movieName}</p>
                            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-blue-600" /> Nhấn để đánh giá
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* 2. Recommendations Tab */}
                {activeTab === "recommendations" && (
                  <div>
                    {dismissedRecommendations.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 text-sm">
                        Chưa có phim gợi ý nào.
                      </div>
                    ) : (
                      dismissedRecommendations.map((movie: any) => (
                        <Link
                          key={`rec-${movie.movieId}`}
                          href={`/movie/${movie.movieId}`}
                          onClick={() => setIsDropdownOpen(false)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 border-b border-gray-50 transition-colors text-left"
                        >
                          <img src={movie.posterUrl} alt={movie.title} className="w-10 h-14 object-cover rounded" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{movie.title}</p>
                            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-blue-600" /> Nhấn để xem
                            </p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Bell Button */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="bg-white text-blue-600 p-4 rounded-full shadow-xl border border-gray-100 hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center group relative"
            aria-label="Thông báo"
          >
            <BellRing className={`w-6 h-6 ${!isDropdownOpen ? 'animate-pulse group-hover:animate-none' : ''}`} />
            {notificationMovies.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold shadow-sm ring-2 ring-white">
                {notificationMovies.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Confirmation Dialog */}
      {selectedMovieForDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden scale-in-95 animate-in zoom-in-95">
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-24 mb-4 rounded shadow-md overflow-hidden">
                <img src={selectedMovieForDialog.posterUrl} alt="Poster" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Đánh giá phim</h3>
              <p className="text-gray-600 text-sm mb-6">
                Bạn có muốn chuyển đến trang đánh giá cho bộ phim <span className="font-semibold text-gray-900">"{selectedMovieForDialog.movieName}"</span> không?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedMovieForDialog(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Để sau
                </button>
                <button
                  onClick={handleConfirmReview}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20"
                >
                  Đánh giá ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
