export function secondsToFullTime(_seconds: number): string {
	const seconds = _seconds % 60;
	const minutes = Math.floor(_seconds / 60) % 60;
	const hours = Math.floor(_seconds / 60 / 60);

	let result = "";
	if (hours > 0) result += `${hours}h `;
	if (minutes > 0) result += `${minutes}m `;
	result += `${seconds}s`;
	return result;
}
