import { HomeBannerCarousel } from "@/components/home/components/HomeBannerCarousel";
import { MovieCarousel } from "@/components/home/components/MovieCarousel";
import { QuickBookingBar } from "@/components/home/components/QuickBookingBar";
import { ReviewNotificationBanner } from "@/components/home/components/ReviewNotificationBanner";
import {
  getBanners,
  getShowingMoviesPaged,
  getComingSoonMoviesPaged,
} from "@/lib/serverApi";

export default async function HomePage() {
  const [banners, showing, comingSoon] = await Promise.all([
    getBanners(),
    getShowingMoviesPaged(0, 4),
    getComingSoonMoviesPaged(0, 4),
  ]);

  return (
    <div className="min-h-screen">
      <ReviewNotificationBanner />
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
      </div>
    </div>
  );
}
