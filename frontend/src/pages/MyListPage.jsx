import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import Navbar from "../components/Navbar";
import { useProfileStore } from "../store/profileStore";
import { useUserDataStore } from "../store/userDataStore";
import { SMALL_IMG_BASE_URL } from "../utils/constants";
import { useContentStore } from "../store/content";

const MyListPage = () => {
	const { activeProfile } = useProfileStore();
	const { myList, removeFromWatchlist } = useUserDataStore();
	const { setContentType } = useContentStore();

	return (
		<div className='min-h-screen bg-zinc-950 text-white'>
			<Navbar />
			<div className='max-w-7xl mx-auto px-4 pt-28 pb-16'>
				<h1 className='text-3xl font-bold mb-2'>My List</h1>
				<p className='text-gray-400 mb-8'>
					{activeProfile?.name ? `${activeProfile.name}'s saved titles` : "Your saved titles"}
				</p>

				{myList.length === 0 ? (
					<div className='text-center py-24 text-gray-500'>
						<p className='text-xl mb-2'>Your list is empty</p>
						<p className='text-sm'>Browse movies and TV shows to add them here.</p>
						<Link
							to='/'
							className='mt-6 inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-semibold transition-colors'
						>
							Browse Content
						</Link>
					</div>
				) : (
					<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'>
						{myList.map((item) => (
							<div key={item.id} className='relative group'>
								<Link
									to={`/watch/${item.contentType}/${item.id}`}
									onClick={() => setContentType(item.contentType)}
									className='block'
								>
									{item.image ? (
										<img
											src={SMALL_IMG_BASE_URL + item.image}
											alt={item.title}
											className='w-full aspect-[2/3] object-cover rounded-lg group-hover:ring-2 ring-white/50 transition-all'
										/>
									) : (
										<div className='w-full aspect-[2/3] bg-zinc-800 rounded-lg flex items-center justify-center text-gray-500 text-xs text-center p-2'>
											{item.title}
										</div>
									)}
									<p className='mt-2 text-sm text-gray-300 truncate'>{item.title}</p>
									<p className='text-xs text-gray-500 capitalize'>{item.contentType}</p>
								</Link>
								<button
									onClick={() => removeFromWatchlist(activeProfile._id, item.id)}
									className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black/70 hover:bg-red-600 rounded-full p-1.5 transition-all'
									title='Remove from list'
								>
									<Trash2 className='size-3.5' />
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default MyListPage;
