import { useCallback, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import {
	Maximize,
	Minimize,
	Pause,
	Play,
	Volume2,
	VolumeX,
} from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { useUserDataStore } from "../store/userDataStore";

function formatTime(seconds) {
	if (!seconds || isNaN(seconds)) return "0:00";
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s.toString().padStart(2, "0")}`;
}

const VideoPlayer = ({ trailerKey, contentId, contentTitle, contentImage, contentType }) => {
	const playerRef = useRef(null);
	const containerRef = useRef(null);
	const saveTimerRef = useRef(null);
	const controlsTimerRef = useRef(null);
	const playedSecondsRef = useRef(0);
	const durationRef = useRef(0);
	const activeProfileRef = useRef(null);

	const [playing, setPlaying] = useState(true);
	const [volume, setVolume] = useState(0.8);
	const [muted, setMuted] = useState(false);
	const [played, setPlayed] = useState(0); // 0–1 fraction
	const [playedSeconds, setPlayedSeconds] = useState(0);
	const [duration, setDuration] = useState(0);
	const [buffering, setBuffering] = useState(false);
	const [seeking, setSeeking] = useState(false);
	const [showControls, setShowControls] = useState(true);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [hasResumed, setHasResumed] = useState(false);
	const [error, setError] = useState(false);

	const { activeProfile } = useProfileStore();
	const { getSavedProgress, updateProgress } = useUserDataStore();

	// Keep refs in sync so the unmount effect always has the latest values
	useEffect(() => { activeProfileRef.current = activeProfile; }, [activeProfile]);
	useEffect(() => { playedSecondsRef.current = playedSeconds; }, [playedSeconds]);
	useEffect(() => { durationRef.current = duration; }, [duration]);

	// Resume from saved position on first ready
	const handleReady = useCallback(() => {
		if (hasResumed || !contentId || !activeProfile) return;
		const saved = getSavedProgress(contentId);
		if (saved?.trailerKey === trailerKey && saved.progress > 5) {
			playerRef.current?.seekTo(saved.progress, "seconds");
		}
		setHasResumed(true);
	}, [hasResumed, contentId, activeProfile, getSavedProgress, trailerKey]);

	// Persist progress every 5 s during playback
	const persistProgress = useCallback(
		(seconds, totalDuration) => {
			if (!contentId || !activeProfile || seconds < 5) return;
			clearTimeout(saveTimerRef.current);
			saveTimerRef.current = setTimeout(() => {
				updateProgress(activeProfile._id, {
					id: contentId,
					title: contentTitle,
					image: contentImage,
					contentType,
					trailerKey,
					progress: seconds,
					duration: totalDuration,
				});
			}, 2000);
		},
		[contentId, activeProfile, contentTitle, contentImage, contentType, trailerKey, updateProgress]
	);

	const handleProgress = useCallback(
		(state) => {
			if (!seeking) {
				setPlayed(state.played);
				setPlayedSeconds(state.playedSeconds);
				persistProgress(state.playedSeconds, duration);
			}
		},
		[seeking, duration, persistProgress]
	);

	const handleDuration = (d) => setDuration(d);

	// Auto-hide controls after 3 s
	const resetControlsTimer = useCallback(() => {
		setShowControls(true);
		clearTimeout(controlsTimerRef.current);
		controlsTimerRef.current = setTimeout(() => {
			if (playing) setShowControls(false);
		}, 3000);
	}, [playing]);

	// Persist on unmount — uses refs so we always save the latest position, not the initial 0
	useEffect(() => {
		return () => {
			clearTimeout(saveTimerRef.current);
			clearTimeout(controlsTimerRef.current);
			const secs = playedSecondsRef.current;
			const prof = activeProfileRef.current;
			if (contentId && prof && secs > 5) {
				updateProgress(prof._id, {
					id: contentId,
					title: contentTitle,
					image: contentImage,
					contentType,
					trailerKey,
					progress: secs,
					duration: durationRef.current,
				});
			}
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // intentional empty deps: runs once on mount, reads latest values via refs at unmount

	// Keyboard shortcuts
	useEffect(() => {
		const onKey = (e) => {
			const tag = document.activeElement?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA") return;

			switch (e.key) {
				case " ":
					e.preventDefault();
					setPlaying((p) => !p);
					break;
				case "ArrowRight":
					playerRef.current?.seekTo(Math.min(playedSeconds + 10, duration), "seconds");
					break;
				case "ArrowLeft":
					playerRef.current?.seekTo(Math.max(playedSeconds - 10, 0), "seconds");
					break;
				case "m":
				case "M":
					setMuted((m) => !m);
					break;
				case "f":
				case "F":
					toggleFullscreen();
					break;
			}
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [playedSeconds, duration]);

	const toggleFullscreen = () => {
		if (!document.fullscreenElement) {
			containerRef.current?.requestFullscreen();
			setIsFullscreen(true);
		} else {
			document.exitFullscreen();
			setIsFullscreen(false);
		}
	};

	useEffect(() => {
		const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
		document.addEventListener("fullscreenchange", onFsChange);
		return () => document.removeEventListener("fullscreenchange", onFsChange);
	}, []);

	const handleSeekMouseDown = () => setSeeking(true);
	const handleSeekChange = (e) => setPlayed(parseFloat(e.target.value));
	const handleSeekMouseUp = (e) => {
		setSeeking(false);
		playerRef.current?.seekTo(parseFloat(e.target.value));
	};

	if (!trailerKey) {
		return (
			<div className='flex items-center justify-center bg-zinc-900 rounded-lg aspect-video text-gray-400 text-lg'>
				No trailer available
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className='relative bg-black rounded-lg overflow-hidden group'
			onMouseMove={resetControlsTimer}
			onMouseEnter={resetControlsTimer}
			onMouseLeave={() => playing && setShowControls(false)}
			onTouchStart={resetControlsTimer}
		>
			{/* Transparent click overlay – play/pause */}
			<div
				className='absolute inset-0 z-10 cursor-pointer'
				onClick={() => setPlaying((p) => !p)}
			/>

			{/* Buffering spinner */}
			{buffering && (
				<div className='absolute inset-0 z-20 flex items-center justify-center pointer-events-none'>
					<div className='size-14 rounded-full border-4 border-white/20 border-t-white animate-spin' />
				</div>
			)}

			{/* Error state */}
			{error && (
				<div className='absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 text-white gap-3'>
					<p className='text-lg font-semibold'>Failed to load video</p>
					<button
						className='bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm'
						onClick={() => { setError(false); setPlaying(true); }}
					>
						Retry
					</button>
				</div>
			)}

			<ReactPlayer
				ref={playerRef}
				url={`https://www.youtube.com/watch?v=${trailerKey}`}
				playing={playing}
				volume={muted ? 0 : volume}
				muted={muted}
				controls={false}
				width='100%'
				height='100%'
				style={{ aspectRatio: "16/9" }}
				config={{ youtube: { playerVars: { modestbranding: 1, rel: 0 } } }}
				onReady={handleReady}
				onProgress={handleProgress}
				onDuration={handleDuration}
				onBuffer={() => setBuffering(true)}
				onBufferEnd={() => setBuffering(false)}
				onError={() => setError(true)}
				onPlay={() => setPlaying(true)}
				onPause={() => setPlaying(false)}
			/>

			{/* Controls bar */}
			<div
				className={`absolute bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-10
					bg-gradient-to-t from-black via-black/60 to-transparent
					transition-opacity duration-300
					${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
			>
				{/* Seek bar */}
				<div className='relative mb-3 group/seek h-1 hover:h-1.5 transition-all'>
					<input
						type='range'
						min={0}
						max={1}
						step={0.001}
						value={played}
						onMouseDown={handleSeekMouseDown}
						onChange={handleSeekChange}
						onMouseUp={handleSeekMouseUp}
						className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
					/>
					<div className='absolute inset-0 rounded-full bg-white/20 overflow-hidden'>
						<div
							className='h-full bg-red-600 transition-none'
							style={{ width: `${played * 100}%` }}
						/>
					</div>
					<div
						className='absolute top-1/2 -translate-y-1/2 size-3 rounded-full bg-red-600 shadow-md
							opacity-0 group-hover/seek:opacity-100 transition-opacity pointer-events-none'
						style={{ left: `calc(${played * 100}% - 6px)` }}
					/>
				</div>

				{/* Buttons row */}
				<div className='flex items-center gap-3 text-white'>
					{/* Play/pause */}
					<button
						className='hover:text-red-500 transition-colors p-1'
						onClick={() => setPlaying((p) => !p)}
					>
						{playing ? <Pause className='size-5 fill-white' /> : <Play className='size-5 fill-white' />}
					</button>

					{/* Volume */}
					<div className='flex items-center gap-2 group/vol'>
						<button
							className='hover:text-red-400 transition-colors p-1'
							onClick={() => setMuted((m) => !m)}
						>
							{muted || volume === 0 ? <VolumeX className='size-5' /> : <Volume2 className='size-5' />}
						</button>
						<div className='w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-200'>
							<input
								type='range'
								min={0}
								max={1}
								step={0.05}
								value={muted ? 0 : volume}
								onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
								className='w-20 h-1 appearance-none bg-white/30 rounded cursor-pointer
									[&::-webkit-slider-thumb]:appearance-none
									[&::-webkit-slider-thumb]:w-2.5
									[&::-webkit-slider-thumb]:h-2.5
									[&::-webkit-slider-thumb]:rounded-full
									[&::-webkit-slider-thumb]:bg-white'
								style={{ background: `linear-gradient(to right, white ${(muted ? 0 : volume)*100}%, rgba(255,255,255,0.3) ${(muted ? 0 : volume)*100}%)` }}
							/>
						</div>
					</div>

					{/* Time */}
					<span className='text-xs text-gray-300 tabular-nums'>
						{formatTime(playedSeconds)} / {formatTime(duration)}
					</span>

					{/* Spacer */}
					<div className='flex-1' />

					{/* Fullscreen */}
					<button
						className='hover:text-red-500 transition-colors'
						onClick={toggleFullscreen}
					>
						{isFullscreen ? (
							<Minimize className='size-5' />
						) : (
							<Maximize className='size-5' />
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default VideoPlayer;
