import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { useUserDataStore } from "../store/userDataStore";
import { useContentStore } from "../store/content";
import { SMALL_IMG_BASE_URL } from "../utils/constants";

const ContinueWatchingRow = () => {
	const sliderRef = useRef(null);
	const [showArrows, setShowArrows] = useState(false);

	const { activeProfile } = useProfileStore();
	const { continueWatching, fetchContinueWatching, removeFromContinueWatching } =
		useUserDataStore();
	const { setContentType } = useContentStore();

	useEffect(() => {
		if (activeProfile) {
			fetchContinueWatching(activeProfile._id);
		}
	}, [activeProfile]); // eslint-disable-line react-hooks/exhaustive-deps

	if (!continueWatching?.length) return null;

	const scrollLeft = () =>
		sliderRef.current?.scrollBy({ left: -sliderRef.current.offsetWidth, behavior: "smooth" });
	const scrollRight = () =>
		sliderRef.current?.scrollBy({ left: sliderRef.current.offsetWidth, behavior: "smooth" });

	return (
		<div
			className='bg-black text-white relative px-5 md:px-20'
			onMouseEnter={() => setShowArrows(true)}
			onMouseLeave={() => setShowArrows(false)}
		>
			<h2 className='mb-4 text-2xl font-bold'>Continue Watching</h2>

			<div className='flex space-x-4 overflow-x-scroll scrollbar-hide' ref={sliderRef}>
				{continueWatching.map((item) => {
					const pct = item.duration > 0 ? (item.progress / item.duration) * 100 : 0;
					return (
						<Link
							key={item.id}
							to={`/watch/${item.contentType}/${item.id}`}
							className='min-w-[250px] relative group'
							onClick={() => setContentType(item.contentType)}
						>
							<div className='rounded-lg overflow-hidden relative'>
								{item.image ? (
									<img
										src={SMALL_IMG_BASE_URL + item.image}
										alt={item.title}
										className='w-full transition-transform duration-300 ease-in-out group-hover:scale-105'
									/>
								) : (
									<div className='w-full h-36 bg-zinc-800 flex items-center justify-center text-gray-500 text-sm'>
										No image
									</div>
								)}

								{/* Progress bar */}
								{pct > 0 && (
									<div className='absolute bottom-0 left-0 w-full h-1 bg-gray-600'>
										<div
											className='h-full bg-red-600 transition-all'
											style={{ width: `${Math.min(pct, 100)}%` }}
										/>
									</div>
								)}

								{/* Remove button */}
								<button
									className='absolute top-1 right-1 opacity-0 group-hover:opacity-100
										bg-black/70 hover:bg-black rounded-full p-1 transition-all z-10'
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										removeFromContinueWatching(activeProfile._id, item.id);
									}}
									title='Remove'
								>
									<X className='size-3' />
								</button>
							</div>
							<p className='mt-2 text-center text-sm truncate'>{item.title}</p>
						</Link>
					);
				})}
			</div>

			{showArrows && continueWatching.length > 3 && (
				<>
					<button
						className='absolute top-1/2 -translate-y-1/2 left-5 md:left-24 flex items-center justify-center
							size-12 rounded-full bg-black bg-opacity-50 hover:bg-opacity-75 text-white z-10'
						onClick={scrollLeft}
					>
						<ChevronLeft size={24} />
					</button>
					<button
						className='absolute top-1/2 -translate-y-1/2 right-5 md:right-24 flex items-center justify-center
							size-12 rounded-full bg-black bg-opacity-50 hover:bg-opacity-75 text-white z-10'
						onClick={scrollRight}
					>
						<ChevronRight size={24} />
					</button>
				</>
			)}
		</div>
	);
};

export default ContinueWatchingRow;
