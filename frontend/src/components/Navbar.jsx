import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookMarked, LogOut, Menu, Search, UserCircle2, X } from "lucide-react";
import { useAuthStore } from "../store/authUser";
import { useContentStore } from "../store/content";
import { useProfileStore } from "../store/profileStore";

const Navbar = () => {
	const [scrolled, setScrolled] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const { user, logout } = useAuthStore();
	const { setContentType } = useContentStore();
	const { activeProfile, clearActiveProfile } = useProfileStore();
	const navigate = useNavigate();

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 20);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const handleSwitchProfile = () => {
		setMobileOpen(false);
		clearActiveProfile();
		navigate("/profiles");
	};

	const handleLogout = () => {
		setMobileOpen(false);
		clearActiveProfile();
		logout();
	};

	return (
		<header
			className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
				scrolled ? "navbar-dark" : "navbar-transparent"
			}`}
		>
			<div className='max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8 h-16'>
				{/* Logo */}
				<div className='flex items-center gap-8'>
					<Link to='/'>
						<img src='/netflix-logo.png' alt='Netflix' className='w-24 sm:w-28' />
					</Link>

					{/* Desktop nav */}
					<nav className='hidden md:flex items-center gap-6 text-sm font-medium text-gray-300'>
						<Link to='/' onClick={() => setContentType("movie")}
							className='hover:text-white transition-colors'>Movies</Link>
						<Link to='/' onClick={() => setContentType("tv")}
							className='hover:text-white transition-colors'>TV Shows</Link>
						<Link to='/my-list'
							className='hover:text-white transition-colors flex items-center gap-1.5'>
							<BookMarked className='size-4' />My List
						</Link>
						<Link to='/history'
							className='hover:text-white transition-colors'>Search History</Link>
					</nav>
				</div>

				{/* Right side */}
				<div className='flex items-center gap-4'>
					<Link to='/search' className='text-gray-300 hover:text-white transition-colors'>
						<Search className='size-5' />
					</Link>

					{/* Profile dropdown */}
					<div className='relative group hidden sm:block'>
						<img
							src={activeProfile?.avatar || user?.image || "/avatar1.png"}
							alt='Profile'
							className='h-8 w-8 rounded object-cover cursor-pointer ring-2 ring-transparent group-hover:ring-white/60 transition-all'
						/>
						<div className='absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-white/10 rounded-lg
							shadow-2xl py-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto
							transition-all duration-200 origin-top-right scale-95 group-hover:scale-100'>
							{activeProfile && (
								<div className='px-4 py-2.5 border-b border-white/10'>
									<p className='text-white font-medium text-sm truncate'>{activeProfile.name}</p>
									{activeProfile.isKids && (
										<span className='text-xs text-blue-400'>Kids Profile</span>
									)}
								</div>
							)}
							<button
								onClick={handleSwitchProfile}
								className='flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors'
							>
								<UserCircle2 className='size-4' />Switch Profile
							</button>
							<button
								onClick={handleLogout}
								className='flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors'
							>
								<LogOut className='size-4' />Sign Out
							</button>
						</div>
					</div>

					{/* Mobile hamburger */}
					<button
						className='md:hidden text-gray-300 hover:text-white'
						onClick={() => setMobileOpen((o) => !o)}
					>
						{mobileOpen ? <X className='size-6' /> : <Menu className='size-6' />}
					</button>
				</div>
			</div>

			{/* Mobile menu */}
			{mobileOpen && (
				<div className='md:hidden bg-zinc-950/98 border-t border-white/10'>
					<div className='flex flex-col'>
						{activeProfile && (
							<div className='px-6 py-3 border-b border-white/10 flex items-center gap-3'>
								<img src={activeProfile.avatar} alt='' className='h-8 w-8 rounded' />
								<span className='text-white font-medium text-sm'>{activeProfile.name}</span>
							</div>
						)}
						{[
							{ label: "Movies", to: "/", action: () => setContentType("movie") },
							{ label: "TV Shows", to: "/", action: () => setContentType("tv") },
							{ label: "My List", to: "/my-list" },
							{ label: "Search History", to: "/history" },
							{ label: "Search", to: "/search" },
						].map(({ label, to, action }) => (
							<Link
								key={label}
								to={to}
								onClick={() => { action?.(); setMobileOpen(false); }}
								className='px-6 py-3.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm'
							>
								{label}
							</Link>
						))}
						<button
							onClick={handleSwitchProfile}
							className='px-6 py-3.5 text-left text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm'
						>
							Switch Profile
						</button>
						<button
							onClick={handleLogout}
							className='px-6 py-3.5 text-left text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors text-sm'
						>
							Sign Out
						</button>
					</div>
				</div>
			)}
		</header>
	);
};

export default Navbar;
