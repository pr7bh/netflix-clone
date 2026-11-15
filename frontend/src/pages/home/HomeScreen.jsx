import { Link } from "react-router-dom";
import { Info, Play, Star } from "lucide-react";
import { useState } from "react";
import Navbar from "../../components/Navbar";
import useGetTrendingContent from "../../hooks/useGetTrendingContent";
import { MOVIE_CATEGORIES, ORIGINAL_IMG_BASE_URL, TV_CATEGORIES } from "../../utils/constants";
import { useContentStore } from "../../store/content";
import MovieSlider from "../../components/MovieSlider";
import ContinueWatchingRow from "../../components/ContinueWatchingRow";
import WatchlistButton from "../../components/WatchlistButton";

const HomeScreen = () => {
	const { trendingContent } = useGetTrendingContent();
	const { contentType } = useContentStore();
	const [imgLoaded, setImgLoaded] = useState(false);

	const year = trendingContent?.release_date?.split("-")[0] || trendingContent?.first_air_date?.split("-")[0];
	const rating = trendingContent?.vote_average;
	const overview = trendingContent?.overview?.length > 220
		? trendingContent.overview.slice(0, 220) + "…"
		: trendingContent?.overview;

	return (
		<div className='min-h-screen bg-zinc-950'>
			<Navbar />

			{/* ── Hero ── */}
			<div className='relative h-[85vh] min-h-[500px] overflow-hidden'>
				{!imgLoaded && (
					<div className='absolute inset-0 shimmer' />
				)}
				{trendingContent?.backdrop_path && (
					<img
						src={ORIGINAL_IMG_BASE_URL + trendingContent.backdrop_path}
						alt={trendingContent?.title || trendingContent?.name}
						className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
						onLoad={() => setImgLoaded(true)}
					/>
				)}

				{/* Gradient overlays */}
				<div className='absolute inset-0 hero-gradient' />
				<div className='absolute bottom-0 left-0 right-0 h-40 hero-bottom-fade' />
				<div className='absolute inset-0 bg-black/20' />

				{/* Hero content */}
				<div className='relative h-full flex items-end pb-20 px-6 sm:px-12 lg:px-20'>
					<div className='max-w-2xl fade-in'>
						{/* Type badge */}
						<span className='inline-block text-xs font-semibold tracking-widest uppercase text-red-500 mb-3'>
							{contentType === "movie" ? "Featured Movie" : "Featured Series"}
						</span>

						<h1 className='text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-balance mb-3'>
							{trendingContent?.title || trendingContent?.name}
						</h1>

						{/* Meta */}
						<div className='flex flex-wrap items-center gap-3 text-sm text-gray-300 mb-4'>
							{year && <span>{year}</span>}
							{rating > 0 && (
								<span className='flex items-center gap-1'>
									<Star className='size-3.5 fill-yellow-400 text-yellow-400' />
									{rating.toFixed(1)}
								</span>
							)}
							{trendingContent?.adult
								? <span className='border border-red-600/70 text-red-400 text-xs px-1.5 py-0.5 rounded'>18+</span>
								: <span className='border border-gray-500 text-gray-400 text-xs px-1.5 py-0.5 rounded'>PG-13</span>
							}
						</div>

						{overview && (
							<p className='text-gray-300 leading-relaxed mb-6 text-sm sm:text-base max-w-lg'>
								{overview}
							</p>
						)}

						<div className='flex flex-wrap gap-3'>
							<Link
								to={`/watch/${contentType}/${trendingContent?.id}`}
								className='flex items-center gap-2 bg-white hover:bg-white/90 text-black font-bold py-2.5 px-6 rounded-md text-sm transition-colors'
							>
								<Play className='size-5 fill-black' />Play
							</Link>
							<Link
								to={`/watch/${contentType}/${trendingContent?.id}`}
								className='flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold py-2.5 px-6 rounded-md text-sm backdrop-blur-sm transition-colors'
							>
								<Info className='size-5' />More Info
							</Link>
							<WatchlistButton content={trendingContent} contentType={contentType} />
						</div>
					</div>
				</div>
			</div>

			{/* ── Content rows ── */}
			<div className='relative z-10 -mt-8 pb-16 flex flex-col gap-10 bg-gradient-to-b from-transparent to-zinc-950'>
				<ContinueWatchingRow />
				{contentType === "movie"
					? MOVIE_CATEGORIES.map((cat) => <MovieSlider key={cat} category={cat} />)
					: TV_CATEGORIES.map((cat) => <MovieSlider key={cat} category={cat} />)}
			</div>
		</div>
	);
};

export default HomeScreen;
