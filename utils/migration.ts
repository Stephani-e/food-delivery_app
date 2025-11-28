import { databases, Query } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwriteConfig";
import useAuthStore from "@/store/auth.store";
import { Board } from "@/type";

export const migrateBoardsUserId = async () => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
        console.error("❌ No logged-in user");
        return;
    }

    const accountId = currentUser.accountId;

    console.log("🚀 Starting board migration for accountId:", accountId);

    const response = await databases.listDocuments<Board>(
        appwriteConfig.databaseId,
        appwriteConfig.customizationsBoardsCollectionId!,
        [
            Query.limit(100), // increase if needed
        ]
    );

    let migrated = 0;

    for (const board of response.documents) {
        // ✅ Already correct → skip
        if (board.userId === accountId) continue;

        console.log(
            `🔄 Migrating board ${board.$id}: ${board.userId} → ${accountId}`
        );

        await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.customizationsBoardsCollectionId!,
            board.$id,
            {
                userId: accountId,
            }
        );

        migrated++;
    }

    console.log(`✅ Migration complete. Updated ${migrated} boards.`);
};
