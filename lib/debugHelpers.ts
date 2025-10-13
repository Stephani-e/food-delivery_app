import { useCallback } from "react";
import { account } from "./appwrite";

export const useAuth = () => {
    const quickLogout = useCallback(async () => {
        try {
            await account.deleteSession("current");
            console.log("✅ Logged out");
        } catch (err) {
            console.error("❌ Logout error:", err);
        }
    }, []);

    return { quickLogout };
};