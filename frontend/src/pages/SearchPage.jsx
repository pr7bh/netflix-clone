import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Loader, Film, Tv, User } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

import Navbar from "../components/Navbar";
import { useContentStore } from "../store/content";
import { useDebounce } from "../hooks/useDebounce";
import { ORIGINAL_IMG_BASE_URL, SMALL_IMG_BASE_URL } from "../utils/constants";

const TABS = [
	{ id: "movie", label: "Movies", icon: Film },
	{ id: "tv", label: "TV Shows", icon: Tv },
	{ id: "person", label: "People", icon: User },
];

const SearchPage = () => {
	const [activeTab, setActiveTab] = useState("movie");
	const [searchTerm, setSearchTerm] = useState("");
	const [results, setResults] = useState([]);
	const [isSearching, setIsSearching] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);

	const { setContentType } = useContentStore();
	const debouncedTerm = useDebounce(searchTerm, 450);

	const handleTabClick = (tab) => {
		setActiveTab(tab);
		if (tab === "movie") setContentType("movie");
		else if (tab === "tv") setContentType("tv");
		setResults([]);
		setHasSearched(false);
	};

	useEffect(() => {
		if (!debouncedTerm.trim()) {
			setResults([]);
			setHasSearched(false);
			return;
		}
		const run = async () => {
			setIsSearching(true);
			setHasSearched(true);
			try {
				const res = await axios.get(`/api/v1/search/${activeTab}/${encodeURIComponent(debouncedTerm.trim())}`);
				setResults(res.data.content);
			} catch (err) {
				if (err.response?.status === 404) setResults([]);
				else toast.error("Search failed. Please try again.");
			} finally {
				setIsSearching(false);
			}
		};
		run();
	}, [debouncedTerm, activeTab]);

	return (
		<div className='min-h-screen bg-zinc-950 text-white'>
			<Navbar />

			{/* Header */}
			<div className='pt-24 pb-8 px-4 max-w-5xl mx-auto'>
				<h1 className='text-3xl font-bold mb-6'>Search</h1>

				{/* Search input */}
				<form onSubmit={(e) => e.preventDefault()} className='relative mb-6'>
					<Search className='absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-500' />
					<input
						type='text'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder={`Search for ${activeTab === "tv" ? "TV shows" : activeTab === "person" ? "people" : "movies"}…`}
						className='w-full bg-zinc-800 border border-zinc-700 focus:border-zinc-500 rounded-xl
							pl-12 pr-12 py-3.5 text-white placeholder-gray-500 outline-none transition-colors text-sm'
					/>
					{isSearching && (
						<Loader className='absolute right-4 top-1/2 -translate-y-1/2 size-4 animate-spin text-gray-400' />
					)}
				</form>

				{/* Tabs */}
				<div className='flex gap-2'>
					{TABS.map(({ id, label, icon: Icon }) => (
						<button
							key={id}
							onClick={() => handleTabClick(id)}
							className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
								activeTab === id
									? "bg-red-600 text-white"
									: "bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700"
							}`}
						>
							<Icon className='size-4' />{label}
						</button>
					))}
				</div>
			</div>

			<div className='max-w-5xl mx-auto px-4 pb-16'>
				{/* Empty/initial states */}
				{!hasSearched && !searchTerm && (
					<div className='text-center py-24 text-gray-600'>
						<Search className='size-16 mx-auto mb-4 opacity-20' />
						<p className='text-lg'>Start typing to search</p>
					</div>
				)}

				{hasSearched && !isSearching && results.length === 0 && (
					<div className='text-center py-24 text-gray-500'>
						<p className='text-xl mb-2'>No results for &ldquo;{debouncedTerm}&rdquo;</p>
						<p className='text-sm'>Try a different keyword or category.</p>
					</div>
				)}

				{/* Results grid */}
				<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
					{results.map((result) => {
						if (!result.poster_path && !result.profile_path) return null;
						return (
							<div key={result.id} className='group cursor-pointer'>
								{activeTab === "person" ? (
									<div className='text-center'>
										<div className='overflow-hidden rounded-xl mb-2'>
											<img
												src={ORIGINAL_IMG_BASE_URL + result.profile_path}
												alt={result.name}
												className='w-full aspect-square object-cover object-top transition-transform duration-300 group-hover:scale-105'
											/>
										</div>
										<p className='text-sm font-semibold truncate'>{result.name}</p>
										{result.known_for_department && (
											<p className='text-xs text-gray-500 mt-0.5'>{result.known_for_department}</p>
										)}
									</div>
								) : (
									<Link
										to={`/watch/${activeTab}/${result.id}`}
										onClick={() => setContentType(activeTab)}
									>
										<div className='overflow-hidden rounded-xl mb-2'>
											<img
												src={SMALL_IMG_BASE_URL + (result.poster_path || result.backdrop_path)}
												alt={result.title || result.name}
												className='w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105'
											/>
										</div>
										<p className='text-sm font-semibold truncate'>{result.title || result.name}</p>
										{(result.release_date || result.first_air_date) && (
											<p className='text-xs text-gray-500 mt-0.5'>
												{(result.release_date || result.first_air_date).split("-")[0]}
											</p>
										)}
									</Link>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default SearchPage;
