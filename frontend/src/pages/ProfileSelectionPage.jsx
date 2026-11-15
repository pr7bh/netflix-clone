import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authUser";
import { useProfileStore } from "../store/profileStore";
import { useUserDataStore } from "../store/userDataStore";

const AVATARS = ["/avatar1.png", "/avatar2.png", "/avatar3.png"];

const ProfileCard = ({ profile, onSelect, onEdit, onDelete, editMode }) => (
	<div className='flex flex-col items-center gap-3 group'>
		<div className='relative cursor-pointer' onClick={() => !editMode && onSelect(profile)}>
			<img
				src={profile.avatar}
				alt={profile.name}
				className={`w-28 h-28 sm:w-32 sm:h-32 rounded-xl object-cover ring-4 ring-transparent
					group-hover:ring-white/70 transition-all duration-200
					${editMode ? "opacity-60" : ""}`}
			/>
			{editMode && (
				<div className='absolute inset-0 flex items-center justify-center gap-2'>
					<button
						className='bg-white/20 hover:bg-white/40 rounded-full p-2 backdrop-blur-sm'
						onClick={(e) => { e.stopPropagation(); onEdit(profile); }}
					>
						<Pencil className='size-4 text-white' />
					</button>
					<button
						className='bg-red-600/80 hover:bg-red-700 rounded-full p-2 backdrop-blur-sm'
						onClick={(e) => { e.stopPropagation(); onDelete(profile); }}
					>
						<Trash2 className='size-4 text-white' />
					</button>
				</div>
			)}
		</div>
		<span className='text-gray-400 group-hover:text-white transition-colors text-lg font-medium'>
			{profile.name}
		</span>
		{profile.isKids && (
			<span className='text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full'>Kids</span>
		)}
	</div>
);

const ProfileModal = ({ initial, onClose, onSave }) => {
	const [name, setName] = useState(initial?.name || "");
	const [avatar, setAvatar] = useState(initial?.avatar || AVATARS[0]);
	const [isKids, setIsKids] = useState(initial?.isKids || false);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!name.trim()) return toast.error("Profile name is required");
		setLoading(true);
		await onSave({ name: name.trim(), avatar, isKids });
		setLoading(false);
	};

	return (
		<div className='fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4'>
			<div className='bg-zinc-900 border border-zinc-700 rounded-xl p-8 w-full max-w-md'>
				<div className='flex items-center justify-between mb-6'>
					<h2 className='text-white text-2xl font-bold'>
						{initial ? "Edit Profile" : "New Profile"}
					</h2>
					<button onClick={onClose} className='text-gray-400 hover:text-white'>
						<X className='size-6' />
					</button>
				</div>

				<form onSubmit={handleSubmit} className='space-y-5'>
					{/* Avatar picker */}
					<div>
						<label className='text-gray-300 text-sm block mb-2'>Avatar</label>
						<div className='flex gap-3'>
							{AVATARS.map((av) => (
								<button
									key={av}
									type='button'
									onClick={() => setAvatar(av)}
									className={`rounded overflow-hidden ring-2 transition-all
										${avatar === av ? "ring-red-500 scale-110" : "ring-transparent hover:ring-white/50"}`}
								>
									<img src={av} alt='avatar' className='w-16 h-16 object-cover' />
								</button>
							))}
						</div>
					</div>

					{/* Name */}
					<div>
						<label className='text-gray-300 text-sm block mb-1'>Name</label>
						<input
							type='text'
							value={name}
							onChange={(e) => setName(e.target.value)}
							maxLength={20}
							placeholder='Profile name'
							className='w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-white
								focus:outline-none focus:border-red-500'
						/>
					</div>

					{/* Kids toggle */}
					<div className='flex items-center justify-between'>
						<span className='text-gray-300 text-sm'>Kids profile</span>
						<button
							type='button'
							onClick={() => setIsKids((k) => !k)}
							className={`w-12 h-6 rounded-full transition-colors ${isKids ? "bg-red-600" : "bg-zinc-600"}`}
						>
							<div
								className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5
									${isKids ? "translate-x-6" : "translate-x-0"}`}
							/>
						</button>
					</div>

					<button
						type='submit'
						disabled={loading}
						className='w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded
							disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
					>
						{loading ? "Saving…" : "Save"}
					</button>
				</form>
			</div>
		</div>
	);
};

const ProfileSelectionPage = () => {
	const navigate = useNavigate();
	const { user, authCheck } = useAuthStore();
	const { setActiveProfile } = useProfileStore();
	const { fetchWatchlist, fetchContinueWatching } = useUserDataStore();

	const [editMode, setEditMode] = useState(false);
	const [modalProfile, setModalProfile] = useState(null); // null = closed, {} = new, {...} = edit
	const [showModal, setShowModal] = useState(false);
	const [isMutating, setIsMutating] = useState(false);

	const profiles = user?.profiles || [];

	const handleSelect = (profile) => {
		setActiveProfile(profile);
		fetchWatchlist(profile._id);
		fetchContinueWatching(profile._id);
		navigate("/");
	};

	const handleCreate = async ({ name, avatar, isKids }) => {
		if (isMutating || profiles.length >= 5) return;
		setIsMutating(true);
		try {
			await axios.post("/api/v1/user/profiles", { name, avatar, isKids });
			await authCheck();
			setShowModal(false);
			toast.success("Profile created");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to create profile");
		} finally {
			setIsMutating(false);
		}
	};

	const handleEdit = async ({ name, avatar, isKids }) => {
		if (isMutating) return;
		setIsMutating(true);
		try {
			await axios.put(`/api/v1/user/profiles/${modalProfile._id}`, { name, avatar, isKids });
			await authCheck();
			setShowModal(false);
			setModalProfile(null);
			toast.success("Profile updated");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to update profile");
		} finally {
			setIsMutating(false);
		}
	};

	const handleDelete = async (profile) => {
		if (profiles.length <= 1) return toast.error("Cannot delete the last profile");
		if (isMutating) return;
		if (!confirm(`Delete profile "${profile.name}"? This cannot be undone.`)) return;
		setIsMutating(true);
		try {
			await axios.delete(`/api/v1/user/profiles/${profile._id}`);
			await authCheck();
			toast.success("Profile deleted");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to delete profile");
		} finally {
			setIsMutating(false);
		}
	};

	return (
		<div className='min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white px-4'>
			<img src='/netflix-logo.png' alt='Netflix' className='w-32 mb-10' />

			<h1 className='text-3xl sm:text-4xl font-semibold mb-10 tracking-tight'>
				{editMode ? "Manage Profiles" : "Who's watching?"}
			</h1>

			<div className='flex flex-wrap justify-center gap-6 max-w-3xl'>
				{profiles.map((profile) => (
					<ProfileCard
						key={profile._id}
						profile={profile}
						onSelect={handleSelect}
						onEdit={(p) => { setModalProfile(p); setShowModal(true); }}
						onDelete={handleDelete}
						editMode={editMode}
					/>
				))}

				{!editMode && profiles.length < 5 && (
					<div
						className={`flex flex-col items-center gap-3 group ${isMutating ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
						onClick={() => { if (!isMutating) { setModalProfile({}); setShowModal(true); } }}
					>
						<div className='w-28 h-28 sm:w-32 sm:h-32 rounded-xl bg-zinc-800 border-2 border-dashed border-zinc-600
							group-hover:border-white/50 group-hover:bg-zinc-700 flex items-center justify-center transition-all duration-200'>
							<Plus className='size-10 text-zinc-500 group-hover:text-white transition-colors' />
						</div>
						<span className='text-gray-400 group-hover:text-white transition-colors text-sm'>
							Add Profile
						</span>
					</div>
				)}
			</div>

			<button
				className='mt-10 border border-zinc-600 hover:border-white text-gray-400 hover:text-white
					px-7 py-2 rounded font-semibold tracking-widest uppercase text-xs transition-all duration-200'
				onClick={() => setEditMode((e) => !e)}
			>
				{editMode ? (
					<span className='flex items-center gap-2'><Check className='size-3.5' /> Done</span>
				) : (
					"Manage Profiles"
				)}
			</button>

			{showModal && (
				<ProfileModal
					initial={modalProfile?._id ? modalProfile : null}
					onClose={() => { setShowModal(false); setModalProfile(null); }}
					onSave={modalProfile?._id ? handleEdit : handleCreate}
				/>
			)}
		</div>
	);
};

export default ProfileSelectionPage;
