import Link from "next/link";
import { MovieListGrid } from "@/components/home/components/MovieListGrid";
import { getShowingMoviesPaged, getComingSoonMoviesPaged } from "@/lib/serverApi";

const PAGE_SIZE = 12;

interface MoviesPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function MoviesPage({ searchParams }: MoviesPageProps) {
  const { status } = await searchParams;
  const movieStatus = status === "comingSoon" ? "comingSoon" : "showing";

  const initial = await (movieStatus === "comingSoon"
    ? getComingSoonMoviesPaged(0, PAGE_SIZE)
    : getShowingMoviesPaged(0, PAGE_SIZE));

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-16 xl:px-24 2xl:px-32 py-8 sm:py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-primary rounded-full shrink-0" />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {movieStatus === "comingSoon" ? "Phim Sắp Chiếu" : "Phim Đang Chiếu"}
          </h1>
        </div>

        <div className="flex items-center gap-2 border-b border-border mb-8">
          <Link
            href="/movies?status=showing"
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              movieStatus === "showing"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Phim Đang Chiếu
          </Link>
          <Link
            href="/movies?status=comingSoon"
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              movieStatus === "comingSoon"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Phim Sắp Chiếu
          </Link>
        </div>

        <MovieListGrid
          key={movieStatus}
          movieStatus={movieStatus}
          initialMovies={initial.movies}
          initialTotalPages={initial.totalPages}
          initialTotalElements={initial.totalElements}
        />
      </div>
    </div>
  );
}
