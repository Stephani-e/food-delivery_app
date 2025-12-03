export const AVG_SPEED_KMH = 20;          // avg city traffic
export const MAX_DELIVERY_MIN = 60;       // normal limit
export const MAX_BAD_CONDITION_MIN = 90;  // extreme case

export const estimateTimeMinutes = (distanceKm: number) => {
    return (distanceKm / AVG_SPEED_KMH) * 60;
};
