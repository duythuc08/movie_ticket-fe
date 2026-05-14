import { HomeBannerCarousel } from "@/components/home/components/HomeBannerCarousel";
import { MovieCarousel } from "@/components/home/components/MovieCarousel";
import { QuickBookingBar } from "@/components/home/components/QuickBookingBar";
import {
  getBanners,
  getShowingMoviesPaged,
  getComingSoonMoviesPaged,
  getImaxMoviesPaged,
} from "@/lib/serverApi";

export default async function HomePage() {
  const [banners, showing, comingSoon, imax] = await Promise.all([
    getBanners(),
    getShowingMoviesPaged(0, 4),
    getComingSoonMoviesPaged(0, 4),
    getImaxMoviesPaged(0, 4),
  ]);

  return (
    <div className="min-h-screen">
      <HomeBannerCarousel banners={banners} />
      <QuickBookingBar />
      <div className="py-8 sm:py-12">
        <MovieCarousel
          title="Phim đang chiếu"
          movieStatus="showing"
          initialMovies={showing.movies}
          initialTotalPages={showing.totalPages}
          initialTotalElements={showing.totalElements}
        />
        <MovieCarousel
          title="Phim sắp chiếu"
          movieStatus="comingSoon"
          initialMovies={comingSoon.movies}
          initialTotalPages={comingSoon.totalPages}
          initialTotalElements={comingSoon.totalElements}
        />
        <MovieCarousel
          title="Phim IMAX"
          movieStatus="imax"
          initialMovies={imax.movies}
          initialTotalPages={imax.totalPages}
          initialTotalElements={imax.totalElements}
        />
      </div>
    </div>
  );
}
