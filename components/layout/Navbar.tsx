"use client";

import { useState, useEffect, useCallback } from "react";
import { Film, Search, User, LogOut, User2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useAuth } from "@/components/auth/hooks/use-auth";
import { apiFetch } from "@/lib/fetchApi";

export function Navbar() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [showingRes, comingSoonRes] = await Promise.all([
          apiFetch("/movies/showing").then(res => res.json()),
          apiFetch("/movies/comingSoon").then(res => res.json())
        ]);
        
        const showingMovies = showingRes.result || [];
        const comingSoonMovies = comingSoonRes.result || [];
        
        const allMovies = [...showingMovies, ...comingSoonMovies];
        
        const uniqueMoviesMap = new Map();
        allMovies.forEach(m => uniqueMoviesMap.set(m.movieId, m));
        const uniqueMovies = Array.from(uniqueMoviesMap.values());
        
        const query = searchQuery.toLowerCase().trim();
        const filtered = uniqueMovies.filter((m: any) => 
          m.title?.toLowerCase().includes(query)
        );
        
        setSearchResults(filtered.slice(0, 5));
      } catch (err) {
        console.error("Lỗi khi tìm kiếm phim", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = useCallback(() => {
    logout();
    localStorage.removeItem("user");
    sessionStorage.removeItem("pendingOrder");
    if (window.location.pathname !== "/") {
      router.push("/login");
    }
  }, [logout, router]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 10) setIsVisible(true);
      else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
        setShowUserMenu(false);
        setShowSearch(false);
      } else setIsVisible(true);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const isActive = (path: string) => pathname === path;

  const BOOKING_PREFIXES = ["/seat-selection/", "/food-selection/", "/payment/"];
  if (pathname === "/login" || pathname === "/signup") return null;
  if (BOOKING_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav
      className={`sticky top-0 w-full z-50 transition-transform duration-300 bg-black border-b border-white/10 shadow-lg backdrop-blur-md ${isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-16 xl:px-24 2xl:px-32">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/" className="flex items-center gap-1 sm:gap-2 group">
              <Film className="w-6 h-6 sm:w-8 sm:h-8 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(229,115,22,0.7)] shrink-0" />
              <span className="text-base sm:text-xl md:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 whitespace-nowrap">
                INFINITY CINEMA
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {(["/", "/event"] as const).map((path) => (
                <Link
                  key={path}
                  href={path}
                  className={`text-base font-medium transition-colors hover:text-primary ${isActive(path) ? "text-primary" : "text-white"
                    }`}
                >
                  {path === "/" ? "Trang Chủ" : "Sự kiện"}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="relative flex items-center gap-1">
              {showSearch && (
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm phim..."
                    autoFocus
                    className="hidden sm:block h-9 w-48 lg:w-72 rounded-full bg-white/10 border border-white/20 px-4 text-base text-white placeholder:text-white/50 focus:outline-none focus:border-primary focus:bg-white/15 transition-all"
                  />
                  
                  {searchQuery.trim() !== "" && (
                    <div className="absolute top-full mt-2 left-0 w-full bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl z-50">
                      {isSearching ? (
                        <div className="p-4 text-sm text-white/50 text-center">Đang tìm kiếm...</div>
                      ) : searchResults.length > 0 ? (
                        <div className="flex flex-col max-h-[300px] overflow-y-auto">
                          {searchResults.map((m) => (
                            <button
                              key={m.movieId}
                              onClick={() => {
                                setShowSearch(false);
                                setSearchQuery("");
                                router.push(`/movie/${m.movieId}`);
                              }}
                              className="flex items-center gap-3 p-2 hover:bg-white/10 transition-colors text-left"
                            >
                              {m.posterUrl ? (
                                <img src={m.posterUrl} alt={m.title} className="w-10 h-14 object-cover rounded bg-white/5" />
                              ) : (
                                <div className="w-10 h-14 rounded bg-white/10" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{m.title}</p>
                                <p className="text-xs text-white/50 mt-0.5">
                                  {m.movieStatus === 'SHOWING' ? 'Đang chiếu' : m.movieStatus === 'COMING_SOON' ? 'Sắp chiếu' : ''}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-sm text-white/50 text-center">Không tìm thấy phim.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => {
                  setShowSearch(!showSearch);
                  if (showSearch) setSearchQuery("");
                }}
                className="cursor-pointer p-2 hover:text-primary transition-colors rounded-full hover:bg-white/10 text-white shrink-0"
              >
                <Search className="w-5 h-5 sm:w-5 sm:h-5" />
              </button>
            </div>

            <ThemeToggle />

            {isAuthenticated && user ? (
              <div
                className="relative"
                onMouseEnter={() => setShowUserMenu(true)}
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <button className="cursor-pointer flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 shrink-0">
                    <User2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <span className="hidden lg:block text-base font-medium text-white whitespace-nowrap">{user.firstname}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
                      <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                        <p className="text-xl text-white">
                          {user.firstname} {user.lastname}
                        </p>
                        <p className="text-sm uppercase tracking-tighter font-semibold text-primary mt-1">
                          {user.memberShipTierName}
                        </p>
                      </div>

                      <div className="p-1">
                        <button
                          onClick={() => router.push("/profile")}
                          className="cursor-pointer w-full px-3 py-2 text-left text-base text-white hover:bg-white/10 rounded-md transition-colors flex items-center gap-3"
                        >
                          <User className="w-4 h-4 text-white" />
                          Tài khoản của tôi
                        </button>
                        <button
                          onClick={handleLogout}
                          className="cursor-pointer w-full px-3 py-2 text-left text-base hover:bg-red-500/10 text-red-400 rounded-md transition-colors flex items-center gap-3"
                        >
                          <LogOut className="w-4 h-4" />
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="cursor-pointer px-4 py-1.5 sm:px-6 sm:py-2 text-sm sm:text-base bg-primary hover:bg-primary/90 text-white font-bold rounded-full transition-all active:scale-95 whitespace-nowrap shrink-0"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
