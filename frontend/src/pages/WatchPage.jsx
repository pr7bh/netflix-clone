import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useContentStore } from "../store/content";
import axios from "axios";
import Navbar from "../components/Navbar";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import VideoPlayer from "../components/VideoPlayer";
import WatchlistButton from "../components/WatchlistButton";
import { ORIGINAL_IMG_BASE_URL, SMALL_IMG_BASE_URL } from "../utils/constants";
import { formatReleaseDate } from "../utils/dateFunction";
import WatchPageSkeleton from "../components/skeletons/WatchPageSkeleton";

const WatchPage = () => {
	const { id, contentType: paramContentType } = useParams();
	const [trailers, setTrailers] = useState([]);
	const [currentTrailerIdx, setCurrentTrailerIdx] = useState(0);
	const [loading, setLoading] = useState(true);
	const [content, setContent] = useState({});
	const [similarContent, setSimilarContent] = useState([]);
	const [cast, setCast] = useState([]);
	const { contentType: storeContentType, setContentType } = useContentStore();

	// Prefer URL param; fall back to store for backward-compat old links
	const contentType = (paramContentType === "movie" || paramContentType === "tv")
		? paramContentType
		: storeContentType;

	// Keep store in sync so navbar/sliders reflect current content type
	useEffect(() => {
		if (paramContentType === "movie" || paramContentType === "tv") {
			setContentType(paramContentType);
		}
	}, [paramContentType, setContentType]);

	const sliderRef = useRef(null);

	useEffect(() => {
		const getTrailers = async () => {
			try {
				const res = await axios.get(`/api/v1/${contentType}/${id}/trailers`);
				setTrailers(res.data.trailers);
			} catch {
				setTrailers([]);
			}
		};
		getTrailers();
	}, [contentType, id]);

	useEffect(() => {
		const getSimilarContent = async () => {
			try {
				const res = await axios.get(`/api/v1/${contentType}/${id}/similar`);
				setSimilarContent(res.data.similar);
			} catch {
				setSimilarContent([]);
			}
		};
		getSimilarContent();
	}, [contentType, id]);

	useEffect(() => {
		const getCredits = async () => {
			try {
				const res = await axios.get(`/api/v1/${contentType}/${id}/credits`);
				setCast(res.data.cast || []);
			} catch {
				setCast([]);
			}
		};
		getCredits();
	}, [contentType, id]);

	useEffect(() => {
		const getContentDetails = async () => {
			try {
				const res = await axios.get(`/api/v1/${contentType}/${id}/details`);
				setContent(res.data.content);
			} catch {
				setContent(null);
			} finally {
				setLoading(false);
			}
		};
		getContentDetails();
	}, [contentType, id]);

	const handleNext = () => {
		if (currentTrailerIdx < trailers.length - 1) setCurrentTrailerIdx(currentTrailerIdx + 1);
	};
	const handlePrev = () => {
		if (currentTrailerIdx > 0) setCurrentTrailerIdx(currentTrailerIdx - 1);
	};

	const scrollLeft = () =>
		sliderRef.current?.scrollBy({ left: -sliderRef.current.offsetWidth, behavior: "smooth" });
	const scrollRight = () =>
		sliderRef.current?.scrollBy({ left: sliderRef.current.offsetWidth, behavior: "smooth" });

	if (loading) {
		return (
			<div className='min-h-screen bg-zinc-950 pt-16'>
				<Navbar />
				<div className='max-w-6xl mx-auto px-4 pt-8'>
					<WatchPageSkeleton />
				</div>
			</div>
		);
	}

	if (!content) {
		return (
			<div className='bg-zinc-950 text-white min-h-screen'>
				<Navbar />
				<div className='flex flex-col items-center justify-center h-[80vh] text-center px-4'>
					<h2 className='text-3xl sm:text-5xl font-bold mb-4'>Content Not Found</h2>
					<p className='text-gray-400 mb-8'>The title you're looking for doesn't exist or was removed.</p>
					<Link to='/' className='bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded font-semibold transition-colors'>
						Back to Home
					</Link>
				</div>
			</div>
		);
	}

	const runtime =
		content.runtime
			? `${Math.floor(content.runtime / 60)}h ${content.runtime % 60}m`
			: content.episode_run_time?.[0]
			? `~${content.episode_run_time[0]}m / ep`
			: null;

	const seasons =
		content.number_of_seasons
			? `${content.number_of_seasons} Season${content.number_of_seasons > 1 ? "s" : ""}`
			: null;

	const currentTrailer = trailers[currentTrailerIdx];

	return (
		<div className='bg-zinc-950 min-h-screen text-white'>
			<Navbar />

			{/* Backdrop header */}
			{content?.backdrop_path && (
				<div className='relative h-[35vh] overflow-hidden'>
					<img
						src={ORIGINAL_IMG_BASE_URL + content.backdrop_path}
						alt=''
						className='w-full h-full object-cover object-top'
					/>
					<div className='absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-black/40' />
				</div>
			)}

			<div className='max-w-6xl mx-auto px-4 sm:px-8 pb-16'
				style={{ marginTop: content?.backdrop_path ? "-80px" : "80px" }}>

				{/* Trailer nav */}
				{trailers.length > 1 && (
					<div className='flex justify-between items-center mb-3'>
						<button
							disabled={currentTrailerIdx === 0}
							onClick={handlePrev}
							className='bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white p-2 rounded transition-colors'
						>
							<ChevronLeft size={20} />
						</button>
						<span className='text-gray-400 text-sm'>
							Trailer {currentTrailerIdx + 1} of {trailers.length}
						</span>
						<button
							disabled={currentTrailerIdx === trailers.length - 1}
							onClick={handleNext}
							className='bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white p-2 rounded transition-colors'
						>
							<ChevronRight size={20} />
						</button>
					</div>
				)}

				{/* Video Player */}
				<div className='mb-10'>
					{currentTrailer ? (
						<VideoPlayer
							trailerKey={currentTrailer.key}
							contentId={Number(id)}
							contentTitle={content?.title || content?.name}
							contentImage={content?.poster_path}
							contentType={contentType}
						/>
					) : (
						<div className='aspect-video bg-zinc-900 rounded-xl flex flex-col items-center justify-center text-gray-500 gap-2'>
							<span className='text-4xl'>🎬</span>
							<p>No trailers available for <strong className='text-gray-300'>{content?.title || content?.name}</strong></p>
						</div>
					)}
				</div>

				{/* Details */}
				<div className='flex flex-col lg:flex-row gap-10'>
					{/* Left */}
					<div className='flex-1 min-w-0'>
						<h1 className='text-3xl sm:text-4xl font-bold mb-3 text-balance'>
							{content?.title || content?.name}
						</h1>

						<div className='flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-400 mb-3'>
							<span className='text-gray-200'>{formatReleaseDate(content?.release_date || content?.first_air_date)}</span>
							{runtime && <span className='text-gray-200'>{runtime}</span>}
							{seasons && <span className='text-gray-200'>{seasons}</span>}
							{content?.vote_average > 0 && (
								<span className='flex items-center gap-1 text-yellow-400 font-semibold'>
									<Star className='size-3.5 fill-yellow-400' />
									{content.vote_average.toFixed(1)}
								</span>
							)}
							{content?.adult
								? <span className='border border-red-600/70 text-red-400 text-xs px-1.5 py-0.5 rounded'>18+</span>
								: <span className='border border-gray-600 text-gray-500 text-xs px-1.5 py-0.5 rounded'>PG-13</span>
							}
						</div>

						{content?.genres?.length > 0 && (
							<div className='flex flex-wrap gap-1.5 mb-4'>
								{content.genres.map((g) => (
									<span key={g.id} className='bg-zinc-800 text-gray-300 text-xs px-2.5 py-1 rounded-full border border-zinc-700'>
										{g.name}
									</span>
								))}
							</div>
						)}

						<p className='text-gray-300 leading-relaxed text-sm sm:text-base mb-6'>{content?.overview}</p>

						<WatchlistButton content={content} contentType={contentType} />

						{/* Cast */}
						{cast.length > 0 && (
							<div className='mt-10'>
								<h2 className='text-lg font-semibold text-gray-200 mb-4'>Top Cast</h2>
								<div className='grid grid-cols-4 sm:grid-cols-6 gap-3'>
									{cast.map((actor) => (
										<div key={actor.id} className='text-center'>
											{actor.profile_path ? (
												<img
													src={SMALL_IMG_BASE_URL + actor.profile_path}
													alt={actor.name}
													className='w-full aspect-square object-cover object-top rounded-lg mb-1 ring-1 ring-white/10'
												/>
											) : (
												<div className='w-full aspect-square bg-zinc-800 rounded-lg mb-1 flex items-center justify-center text-xs text-gray-500'>
													N/A
												</div>
											)}
											<p className='text-xs font-medium text-gray-300 truncate'>{actor.name}</p>
											<p className='text-xs text-gray-500 truncate'>{actor.character}</p>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Right: poster */}
					{content?.poster_path && (
						<div className='flex-shrink-0 self-start'>
							<img
								src={ORIGINAL_IMG_BASE_URL + content.poster_path}
								alt='Poster'
								className='w-44 sm:w-56 rounded-xl shadow-2xl ring-1 ring-white/10'
							/>
						</div>
					)}
				</div>

				{/* Similar content */}
				{similarContent.length > 0 && (
					<div className='mt-14 relative'>
						<h2 className='text-2xl font-bold mb-5'>More Like This</h2>
						<div className='flex overflow-x-auto scrollbar-hide gap-3 pb-3 group' ref={sliderRef}>
							{similarContent.map((item) => {
								if (!item.poster_path) return null;
								return (
									<Link
										key={item.id}
										to={`/watch/${contentType}/${item.id}`}
										className='flex-none w-32 sm:w-36 group/card'
									>
										<div className='overflow-hidden rounded-lg mb-2'>
											<img
												src={SMALL_IMG_BASE_URL + item.poster_path}
												alt={item.title || item.name}
												className='w-full aspect-[2/3] object-cover transition-transform duration-200 group-hover/card:scale-105'
											/>
										</div>
										<p className='text-xs font-medium text-gray-300 truncate'>{item.title || item.name}</p>
									</Link>
								);
							})}
						</div>
						<button
							onClick={scrollLeft}
							className='absolute top-[55%] left-0 -translate-y-1/2 h-20 w-8 bg-black/60 hover:bg-black/80
								flex items-center justify-center text-white rounded-r-md opacity-0 group-hover:opacity-100 transition-opacity'
						>
							<ChevronLeft size={18} />
						</button>
						<button
							onClick={scrollRight}
							className='absolute top-[55%] right-0 -translate-y-1/2 h-20 w-8 bg-black/60 hover:bg-black/80
								flex items-center justify-center text-white rounded-l-md opacity-0 group-hover:opacity-100 transition-opacity'
						>
							<ChevronRight size={18} />
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default WatchPage;
