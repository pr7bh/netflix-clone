import { Check, Plus } from "lucide-react";
import { useEffect } from "react";
import { useProfileStore } from "../store/profileStore";
import { useUserDataStore } from "../store/userDataStore";

const WatchlistButton = ({ content, contentType, className = "" }) => {
	const { activeProfile } = useProfileStore();
	const { myList, fetchWatchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } =
		useUserDataStore();

	const inList = isInWatchlist(content?.id);

	useEffect(() => {
		if (activeProfile && myList.length === 0) {
			fetchWatchlist(activeProfile._id);
		}
	}, [activeProfile]); // eslint-disable-line react-hooks/exhaustive-deps

	if (!content || !activeProfile) return null;

	const handleClick = (e) => {
		e.preventDefault();
		e.stopPropagation();
		if (inList) {
			removeFromWatchlist(activeProfile._id, content.id);
		} else {
			addToWatchlist(activeProfile._id, {
				id: content.id,
				title: content.title || content.name,
				image: content.poster_path || content.backdrop_path,
				contentType,
			});
		}
	};

	return (
		<button
			onClick={handleClick}
			className={`flex items-center gap-2 border border-white/60 hover:border-white
				text-white py-2 px-4 rounded font-semibold transition-all
				${inList ? "bg-white/10" : "bg-transparent hover:bg-white/10"}
				${className}`}
			title={inList ? "Remove from My List" : "Add to My List"}
		>
			{inList ? <Check className='size-5' /> : <Plus className='size-5' />}
			My List
		</button>
	);
};

export default WatchlistButton;
