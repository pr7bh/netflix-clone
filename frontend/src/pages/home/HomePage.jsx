import { Navigate } from "react-router-dom";
import { Loader } from "lucide-react";
import { useAuthStore } from "../../store/authUser";
import { useProfileStore } from "../../store/profileStore";
import AuthScreen from "./AuthScreen";
import HomeScreen from "./HomeScreen";

const HomePage = () => {
	const { user } = useAuthStore();
	const { activeProfile } = useProfileStore();

	if (!user) return <AuthScreen />;

	// User exists but has no profiles yet (old accounts before profile feature)
	if (user.profiles?.length === 0) return <Navigate to='/profiles' />;

	// Profiles exist but none selected yet — wait for auto-selection in App.jsx
	if (!activeProfile) return (
		<div className='h-screen flex justify-center items-center bg-black'>
			<Loader className='animate-spin text-red-600 size-10' />
		</div>
	);

	return <HomeScreen />;
};

export default HomePage;
