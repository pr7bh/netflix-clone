import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Play, Plus, Check } from "lucide-react";
import { useContentStore } from "../store/content";
import { useProfileStore } from "../store/profileStore";
import { useUserDataStore } from "../store/userDataStore";
import axios from "axios";
import { SMALL_IMG_BASE_URL } from "../utils/constants";

const LABEL_MAP = {
	now_playing: "Now Playing",
	top_rated: "Top Rated",
	popular: "Popular",
	upcoming: "Coming Soon",
	airing_today: "Airing Today",
	on_the_air: "Currently Airing",
};

const BACKDROP_BASE = "https://image.tmdb.org/t/p/w780";
const PREVIEW_W = 300;

const MovieCard = ({ item, contentType }) => {
	const cardRef = useRef(null);
	const hoverTimer = useRef(null);
	const leaveTimer = useRef(null);
	const trailerCache = useRef({});

	const [expanded, setExpanded] = useState(false);
	const [trailerKey, setTrailerKey] = useState(null);
	const [rect, setRect] = useState(null);

	const { activeProfile } = useProfileStore();
	const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useUserDataStore();
	const inList = isInWatchlist(item.id);

	useEffect(() => {
		return () => {
			clearTimeout(hoverTimer.current);
			clearTimeout(leaveTimer.current);
		};
	}, []);

	const handleList = (e) => {
		e.preventDefault();
		e.stopPropagation();
		if (!activeProfile) return;
		if (inList) {
			removeFromWatchlist(activeProfile._id, item.id);
		} else {
			addToWatchlist(activeProfile._id, {
				id: item.id,
				title: item.title || item.name,
				image: item.poster_path || item.backdrop_path,
				contentType,
			});
		}
	};

	const openPreview = () => {
		const r = cardRef.current?.getBoundingClientRect();
		if (!r) return;
		setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
		setExpanded(true);

		const cacheKey = `${contentType}-${item.id}`;
		if (cacheKey in trailerCache.current) {
			setTrailerKey(trailerCache.current[cacheKey] || null);
			return;
		}

		axios
			.get(`/api/v1/${contentType}/${item.id}/trailers`)
			.then((res) => {
				const trailers = res.data.trailers || [];
				const t =
					trailers.find((v) => v.type === "Trailer" && v.site === "YouTube") ||
					trailers.find((v) => v.site === "YouTube");
				const key = t?.key || "";
				trailerCache.current[cacheKey] = key;
				setTrailerKey(key || null);
			})
			.catch(() => {
				trailerCache.current[cacheKey] = "";
			});
	};

	const handleMouseEnter = () => {
		clearTimeout(leaveTimer.current);
		hoverTimer.current = setTimeout(openPreview, 600);
	};

	const handleMouseLeave = () => {
		clearTimeout(hoverTimer.current);
		leaveTimer.current = setTimeout(() => {
			setExpanded(false);
			setTrailerKey(null);
			setRect(null);
		}, 150);
	};

	const getPreviewStyle = () => {
		if (!rect) return {};
		const videoH = PREVIEW_W * (9 / 16);
		const infoH = 108;
		const totalH = videoH + infoH;

		let left = rect.left + rect.width / 2 - PREVIEW_W / 2;
		left = Math.max(8, Math.min(left, window.innerWidth - PREVIEW_W - 8));

		let top = rect.top + rect.height / 2 - totalH / 2;
		top = Math.max(70, Math.min(top, window.innerHeight - totalH - 8));

		return { position: "fixed", left, top, width: PREVIEW_W, zIndex: 100 };
	};

	const year = (item.release_date || item.first_air_date)?.split("-")[0];
	const match = item.vote_average > 0
		? Math.round(item.vote_average * 10) + "% Match"
		: null;

	return (
		<div
			ref={cardRef}
			className='relative flex-none w-[160px] sm:w-[180px]'
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<Link
				to={`/watch/${contentType}/${item.id}`}
				className='block rounded-md overflow-hidden'
			>
				<div className='aspect-[2/3] bg-zinc-800'>
					{item.poster_path || item.backdrop_path ? (
						<img
							src={SMALL_IMG_BASE_URL + (item.poster_path || item.backdrop_path)}
							alt={item.title || item.name}
							className='w-full h-full object-cover'
							loading='lazy'
						/>
					) : (
						<div className='w-full h-full flex items-center justify-center text-gray-500 text-xs text-center p-2'>
							{item.title || item.name}
						</div>
					)}
				</div>
			</Link>

			{expanded && rect && (
				<div
					style={getPreviewStyle()}
					className='card-preview rounded-xl overflow-hidden shadow-2xl bg-zinc-900 border border-white/10'
					onMouseEnter={() => clearTimeout(leaveTimer.current)}
					onMouseLeave={handleMouseLeave}
				>
					{/* Video / backdrop */}
					<div className='relative aspect-video bg-zinc-950'>
						{trailerKey ? (
							<iframe
								src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${trailerKey}&rel=0&iv_load_policy=3`}
								className='w-full h-full'
								allow='autoplay; encrypted-media'
								title={item.title || item.name}
							/>
						) : (
							<img
								src={BACKDROP_BASE + (item.backdrop_path || item.poster_path)}
								alt={item.title || item.name}
								className='w-full h-full object-cover'
							/>
						)}
						<div className='absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none' />
					</div>

					{/* Info */}
					<div className='px-3 pt-2 pb-3'>
						<div className='flex items-center gap-2 mb-2'>
							<Link
								to={`/watch/${contentType}/${item.id}`}
								onClick={(e) => e.stopPropagation()}
								className='flex items-center justify-center bg-white hover:bg-white/90 text-black rounded-full size-8 transition-colors flex-shrink-0'
							>
								<Play className='size-4 fill-black' />
							</Link>
							<button
								onClick={handleList}
								className='flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 text-white rounded-full size-8 border border-white/30 transition-colors flex-shrink-0'
							>
								{inList ? <Check className='size-4' /> : <Plus className='size-4' />}
							</button>
							{match && (
								<span className='ml-auto text-xs font-semibold text-green-400 truncate'>{match}</span>
							)}
						</div>
						<p className='text-white text-sm font-semibold truncate mb-0.5'>
							{item.title || item.name}
						</p>
						<div className='flex items-center gap-2 text-xs text-gray-400'>
							{year && <span>{year}</span>}
							{item.vote_average > 0 && (
								<>
									<span>·</span>
									<span>★ {item.vote_average.toFixed(1)}</span>
								</>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

const MovieSlider = ({ category }) => {
	const { contentType } = useContentStore();
	const [content, setContent] = useState([]);
	const [showArrows, setShowArrows] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const sliderRef = useRef(null);

	const label = LABEL_MAP[category]
		|| category.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());
	const typeSuffix = contentType === "movie" ? "Movies" : "TV Shows";

	useEffect(() => {
		setIsLoading(true);
		axios.get(`/api/v1/${contentType}/${category}`)
			.then((res) => setContent(res.data.content))
			.catch(() => setContent([]))
			.finally(() => setIsLoading(false));
	}, [contentType, category]);

	const scrollLeft = () =>
		sliderRef.current?.scrollBy({ left: -sliderRef.current.offsetWidth * 0.8, behavior: "smooth" });
	const scrollRight = () =>
		sliderRef.current?.scrollBy({ left: sliderRef.current.offsetWidth * 0.8, behavior: "smooth" });

	return (
		<div
			className='relative px-4 sm:px-8 lg:px-12'
			onMouseEnter={() => setShowArrows(true)}
			onMouseLeave={() => setShowArrows(false)}
		>
			<h2 className='text-white text-lg sm:text-xl font-bold mb-4'>
				{label} <span className='text-gray-400 font-normal text-base'>{typeSuffix}</span>
			</h2>

			<div className='flex gap-3 overflow-x-auto scrollbar-hide pb-2' ref={sliderRef}>
				{isLoading
					? Array.from({ length: 8 }).map((_, i) => (
						<div key={i} className='flex-none w-[160px] sm:w-[180px] aspect-[2/3] rounded-md shimmer' />
					))
					: content.map((item) => (
						<MovieCard key={item.id} item={item} contentType={contentType} />
					))}
			</div>

			{showArrows && content.length > 4 && (
				<>
					<button
						onClick={scrollLeft}
						className='absolute left-0 top-[55%] -translate-y-1/2 h-24 w-10 flex items-center justify-center
							bg-black/60 hover:bg-black/80 text-white transition-colors z-10 rounded-r-md'
					>
						<ChevronLeft className='size-6' />
					</button>
					<button
						onClick={scrollRight}
						className='absolute right-0 top-[55%] -translate-y-1/2 h-24 w-10 flex items-center justify-center
							bg-black/60 hover:bg-black/80 text-white transition-colors z-10 rounded-l-md'
					>
						<ChevronRight className='size-6' />
					</button>
				</>
			)}
		</div>
	);
};

export default MovieSlider;
