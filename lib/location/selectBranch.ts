import { haversineKm } from "@/lib/location/distance";
import { estimateTimeMinutes, MAX_BAD_CONDITION_MIN, MAX_DELIVERY_MIN } from "@/lib/location/deliveryRules";

export const selectBestBranch = (
    branches: any[],
    userLat: number,
    userLng: number
) => {
    if (!Array.isArray(branches) || branches.length === 0) throw new Error("Expected an array of branches");

    const withDistance = branches.map(branch => {
        const distanceKm = haversineKm(
            userLat,
            userLng,
            branch.latitude,
            branch.longitude
        );

        const timeMin = estimateTimeMinutes(distanceKm);
        const withinRadius =
            typeof branch.deliveryRadius === "number"
                ? distanceKm <= branch.deliveryRadius
                : true;
        
        const withinTime =
            timeMin <= MAX_DELIVERY_MIN ||
            timeMin <= MAX_BAD_CONDITION_MIN;

        return {
            ...branch,
            distanceKm,
            timeMin,
            canDeliver: withinRadius && withinTime,
        };
    });

    const valid = withDistance
        .filter(b => b.canDeliver)
        .sort((a, b) => a.distanceKm - b.distanceKm);

    return valid.length ? valid[0] : null;
};
