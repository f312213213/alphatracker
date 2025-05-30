export function calculateAlphaPoints(volume: number): number {
    if (volume <= 0) return 0;

    // Calculate points using logarithmic scale
    // 1 point for first $2, +1 point for each doubling
    const points = Math.floor(Math.log2(volume / 2)) + 1;

    // Ensure minimum of 1 point for any volume above 0
    return Math.max(1, points);
}

export function getNextPointsThreshold(currentPoints: number): number {
    // Calculate the volume needed for the next point
    return Math.pow(2, currentPoints) * 2;
} 