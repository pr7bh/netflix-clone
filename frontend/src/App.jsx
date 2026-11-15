import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import WatchPage from "./pages/WatchPage";
import SearchPage from "./pages/SearchPage";
import SearchHistoryPage from "./pages/SearchHistoryPage";
import MyListPage from "./pages/MyListPage";
import ProfileSelectionPage from "./pages/ProfileSelectionPage";
import NotFoundPage from "./pages/404";
import Footer from "./components/Footer";

import { useAuthStore } from "./store/authUser";
import { useProfileStore } from "./store/profileStore";
import { useUserDataStore } from "./store/userDataStore";

function App() {
	const { user, isCheckingAuth, authCheck } = useAuthStore();
	const { activeProfile, setActiveProfile } = useProfileStore();

	useEffect(() => {
		authCheck();
	}, [authCheck]);

	// Restore active profile from localStorage after auth check and prefetch user data
	const { fetchWatchlist, fetchContinueWatching } = useUserDataStore();
	useEffect(() => {
		if (!user || activeProfile) return;
		if (!user.profiles?.length) return;

		let profile = null;
		try {
			const storedId = localStorage.getItem("activeProfileId");
			if (storedId) {
				profile = user.profiles.find((p) => p._id === storedId) || null;
			}
		} catch { /* localStorage unavailable */ }

		if (!profile && user.profiles.length === 1) profile = user.profiles[0];

		if (profile) {
			setActiveProfile(profile);
			fetchWatchlist(profile._id);
			fetchContinueWatching(profile._id);
		}
	}, [user, activeProfile, setActiveProfile, fetchWatchlist, fetchContinueWatching]);

	if (isCheckingAuth) {
		return (
			<div className='h-screen flex justify-center items-center bg-black'>
				<Loader className='animate-spin text-red-600 size-10' />
			</div>
		);
	}

	return (
		<>
			<Routes>
				<Route path='/' element={<HomePage />} />
				<Route path='/login' element={!user ? <LoginPage /> : <Navigate to='/' />} />
				<Route path='/signup' element={!user ? <SignUpPage /> : <Navigate to='/' />} />
				<Route
					path='/profiles'
					element={user ? <ProfileSelectionPage /> : <Navigate to='/login' />}
				/>
				{/* New URL format: /watch/:contentType/:id */}
				<Route
					path='/watch/:contentType/:id'
					element={user ? <WatchPage /> : <Navigate to='/login' />}
				/>
				{/* Backward compat: /watch/:id — WatchPage detects missing contentType */}
				<Route
					path='/watch/:id'
					element={user ? <WatchPage /> : <Navigate to='/login' />}
				/>
				<Route
					path='/search'
					element={user ? <SearchPage /> : <Navigate to='/login' />}
				/>
				<Route
					path='/history'
					element={user ? <SearchHistoryPage /> : <Navigate to='/login' />}
				/>
				<Route
					path='/my-list'
					element={user ? <MyListPage /> : <Navigate to='/login' />}
				/>
				<Route path='/*' element={<NotFoundPage />} />
			</Routes>
			<Footer />
			<Toaster />
		</>
	);
}

export default App;
