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

const MovieCard = ({ item, contentType }) => {
	const { activeProfile } = useProfileStore();
	const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useUserDataStore();
	const inList = isInWatchlist(item.id);

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

	const year = (item.release_date || item.first_air_date)?.split("-")[0];

	return (
		<Link
			to={`/watch/${contentType}/${item.id}`}
			className='relative flex-none w-[160px] sm:w-[180px] group rounded-md overflow-hidden block'
		>
			{/* Poster */}
			<div className='aspect-[2/3] overflow-hidden rounded-md bg-zinc-800'>
				{item.poster_path ? (
					<img
						src={SMALL_IMG_BASE_URL + item.poster_path}
						alt={item.title || item.name}
						className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-110'
						loading='lazy'
					/>
				) : item.backdrop_path ? (
					<img
						src={SMALL_IMG_BASE_URL + item.backdrop_path}
						alt={item.title || item.name}
						className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-110'
						loading='lazy'
					/>
				) : (
					<div className='w-full h-full flex items-center justify-center text-gray-500 text-xs text-center p-2'>
						{item.title || item.name}
					</div>
				)}
			</div>

			{/* Hover overlay */}
			<div className='absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent
				opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md'>
				<div className='absolute bottom-0 left-0 right-0 p-2.5'>
					<p className='text-white text-xs font-semibold truncate mb-1'>{item.title || item.name}</p>
					{year && <p className='text-gray-400 text-xs mb-2'>{year}</p>}
					<div className='flex items-center gap-1.5'>
						<span className='flex items-center justify-center bg-white hover:bg-white/90 text-black rounded-full size-7 transition-colors'>
							<Play className='size-3 fill-black' />
						</span>
						<button
							onClick={handleList}
							className='flex items-center justify-center bg-zinc-700/80 hover:bg-zinc-600 text-white rounded-full size-7 border border-white/20 transition-colors'
						>
							{inList ? <Check className='size-3' /> : <Plus className='size-3' />}
						</button>
					</div>
				</div>
			</div>
		</Link>
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

			{/* Nav arrows */}
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
