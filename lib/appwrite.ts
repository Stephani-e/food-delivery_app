import {
    Account,
    Avatars,
    Client,
    Databases,
    ID,
    OAuthProvider,
    Permission,
    Query, Role,
    Storage
} from "react-native-appwrite";
import {
    Board, CartCustomization,
    Category,
    CreateUserParams,
    Customization,
    GetMenuParams,
    MenuItem,
    Offer,
    SavedBoardPayload,
    SignInParams,
    User,
} from "@/type";
import * as Linking from 'expo-linking';
import { useCartStore } from "@/store/cart.store";
import {openAuthSessionAsync} from "expo-web-browser";
import { appwriteConfig } from "@/lib/appwriteConfig";
import useAuthStore from "@/store/auth.store";

export const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform)

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { Permission, Role, Query, ID }
const avatars = new Avatars(client);

// Maps a raw Appwrite document to your app's User type
export function toUser(doc: any): User {
    return {
        $id: doc.$id,
        $databaseId: doc.$databaseId ?? "",
        $collectionId: doc.$collectionId ?? "",
        $createdAt: doc.$createdAt ?? "",
        $updatedAt: doc.$updatedAt ?? "",
        accountId: doc.accountId || doc.$id,
        name: doc.name,
        email: doc.email,
        avatar: doc.avatar,
        provider: Array.isArray(doc.provider)
            ? doc.provider
            : (doc.provider ? [doc.provider] : []),
        $sequence: 0,
        $permissions: []
    };
}

// Create a user manually (email + password)
export const createUser = async ({ email, password, name }: CreateUserParams) => {
    try {
        console.log("🟡 Creating new account with:", { email, name });

        //Ensure no active session before starting
        await account.deleteSessions().catch(() => {});

        //Create the account
        const newAccount = await account.create(ID.unique(), email, password, name);
        if (!newAccount) throw new Error("Failed to create user account");

        //Sign in (create a session)
        await signIn({email, password});
        console.log("✅ Signed in successfully");

        //Generate avatar as a URL string
        const avatarUrl = `${appwriteConfig.endpoint}/avatars/initials?name=${encodeURIComponent(name || "User")}`;
        console.log("🟢 Avatar URL generated:", avatarUrl);

        // 🟢 Sync to DB (same logic for email-password or Google)
        const newUser = await syncUserWithDB({
            accountId: newAccount.$id,
            email,
            name,
            avatar: avatarUrl,
            provider: "email-password",
        });

        console.log("✅ User document created successfully:", newUser);
        return newUser;
    } catch (err: any) {
        console.error("❌ Error creating user document:", err);

        // 🔹 Safety cleanup: destroy any half-created session
        try {
            await account.deleteSessions().catch(() => {});
        } catch (cleanupError) {
            console.warn("⚠️ Cleanup failed:", cleanupError);
        }
        throw new Error(err?.message || "Failed to create user");
    }
};

export const signIn = async ({email, password}: SignInParams ) => {
    try {
       await account.createEmailPasswordSession(email, password);
       const currentUser = await account.get();

        const userAvatar = `${appwriteConfig.endpoint}/avatars/initials?name=${encodeURIComponent(
            currentUser.name || "User"
        )}`;

        await syncUserWithDB({
            accountId: currentUser.$id,
            email: currentUser.email,
            name: currentUser.name,
            avatar: userAvatar,
            provider: "email-password",
        });

        return currentUser;

    } catch (err) {
        throw new Error(err as string);
    }
}

// Google Login
export async function goggleLogin() {
    try {
        await account.deleteSessions().catch(() => {});

        const redirectUri = Linking.createURL('/');

        // 1️⃣ Request Google OAuth token
        const response = await account.createOAuth2Token(
            OAuthProvider.Google,
            redirectUri
        );

        if (!response) throw new Error('Login Failed');

        // 2️⃣ Open browser for authentication
        const browserResult = await openAuthSessionAsync(
            response.toString(),
            redirectUri
        );
        if (browserResult.type !== 'success') throw new Error('User canceled or login failed');

        // 3️⃣ Extract Appwrite session data from redirect
        const url = new URL(browserResult.url);
        const secret = url.searchParams.get('secret');
        const userId = url.searchParams.get('userId');
        if (!secret || !userId) throw new Error('None');

        // 4️⃣ Create the session
        const session = await account.createSession(userId, secret);
        if (!session) throw new Error('Failed to create session');

        // 5️⃣ Fetch the user from Appwrite Auth
        const currentUser = await account.get();

        // 6️⃣ Create a user document if not already in database
        // 🟢 Sync to DB safely (no duplicates)
        const userAvatar = `${appwriteConfig.endpoint}/avatars/initials?name=${encodeURIComponent(
            currentUser.name || "User"
        )}`;

        const userDoc = await syncUserWithDB({
            accountId: currentUser.$id,
            email: currentUser.email,
            name: currentUser.name,
            avatar: userAvatar,
            provider: "google",
        });

        return {
            ...currentUser,
            avatar: userDoc.avatar,
            docId: userDoc.$id,
        }
    } catch (err) {
        console.error("❌ Google login error:", err);
        return false;
    }
}

// NEW — Unified Sync Helper (prevents duplicates)
export async function syncUserWithDB({ accountId, email, name, avatar, provider }: any) {
    try {
        // 1️⃣ Check if a user exists
        const existingUsers = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [
                Query.equal("email", email)
            ]
        );

        if (existingUsers.total > 0) {
            console.log("🟢 User already exists, reusing existing document");
            const existingUser = existingUsers.documents[0];

            // 2️⃣ If the provider doesn’t match, merge it
            if (!existingUser.provider.includes(provider)) {
                console.log(`🔄 Merging provider for ${email}: ${existingUser.provider} → ${provider}`);

                // Handle multiple providers (e.g. "email,google")
                const existingProvider = Array.isArray(existingUser.provider)
                    ? existingUser.provider
                    : existingUser.provider?.split(',') || [];
                const mergedProviders = Array.from(new Set([...existingProvider, provider]));

                const updatedUser = await databases.updateDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.userCollectionId,
                    existingUser.$id,
                    {
                        provider: mergedProviders,
                        accountId: existingUser.accountId ||  accountId,
                        name: existingUser.name || name,
                        avatar: existingUser.avatar || avatar,
                    }
                );

                console.log("✅ Updated user provider(s):", mergedProviders);
                return updatedUser;
            }

            console.log("🟢 User already exists with matching provider");
            return existingUser;
        }

        // 2️⃣ Create if not found
        const newUser = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            { accountId, email, name, avatar, provider: [provider] }
        );

        console.log("✅ Created new user document");
        return newUser;
    } catch (err: any) {
        console.error("❌ syncUserWithDB error:", err.message);
        throw err;
    }
}

export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();
        if (!currentAccount) throw Error;

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('accountId', currentAccount.$id)],
        )

        if (!currentUser || currentUser.total === 0) {
            // No DB record yet — create it
            const avatarUrl = `${appwriteConfig.endpoint}/avatars/initials?name=${encodeURIComponent(
                currentAccount.name || "User"
            )}`;

            return await syncUserWithDB({
                accountId: currentAccount.$id,
                email: currentAccount.email,
                name: currentAccount.name,
                avatar: avatarUrl,
                provider: "email-password",
            });
        }

        return currentUser.documents[0];
    } catch (e: any) {
        // 🧠 Only log clean info for debugging
        if (e?.message?.includes("missing scopes")) {
            console.log("⚠️ No user session found — guest mode");
        } else {
            console.log("❌ Unexpected error in getCurrentUser:", e.message);
        }
        return null;
    }
}

export const getCategories = async (): Promise<Category[]> => {
    try {
        const categories = await databases.listDocuments<Category>(
            appwriteConfig.databaseId,
            appwriteConfig.categoryCollectionId,
            [Query.limit(100)]
        )

        return categories.documents;
    } catch (e) {
        console.error("Failed to fetch categories");
        throw new Error(e as string);
    }
}

export const getMenu = async ({ category, query }: GetMenuParams ) => {
    try {
        const queries: string[] = [];

        if (category) queries.push(Query.equal('categories', category));
        if (query) queries.push(Query.search('name', query));

        const menus = await databases.listDocuments<MenuItem>(
            appwriteConfig.databaseId,
            appwriteConfig.menuCollectionId,
            queries,
        )
        console.log("✅ Fetched menus:", menus.total);
        return menus.documents;
    } catch (e) {
        console.error("❌ Error fetching menu:");
        throw new Error(e as string);
    }
}

export const getMenuItemById = async (itemId: string): Promise<MenuItem | null> => {
    try {
        const response = await databases.getDocument<MenuItem>(
            appwriteConfig.databaseId,
            appwriteConfig.menuCollectionId,
            itemId
        );

        if (response.categories && typeof response.categories === "string") {
            try {
                const categoryDoc = await databases.getDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.categoryCollectionId,
                    response.categories
                );
                response.categories = {
                    $id: categoryDoc.$id,
                    name: categoryDoc.name,
                };
            } catch (err) {
                console.warn("⚠️ Failed to fetch category:", err);
            }
        }
        return {
            ...response,
            itemPrice: response.itemPrice ?? response.price ?? 0
        };
    } catch (error) {
        console.error('Failed to fetch menu item by id', error);
        return null;
    }
}

export const getMenuCustomizations = async (menuId: string): Promise<Customization[]> => {
    try {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.menu_customizationsCollectionId,
            [Query.equal("menu", menuId)]
        );

        console.log("Customizations fetched:", response.documents.length);

        // Fetch full customization documents by their IDs
        const customizationIds = response.documents.map((doc: any) => doc.customizations).filter(Boolean);

        const customizationDocs = await Promise.all(
            customizationIds.map(async (id: string) => {
                try {
                    const c = await databases.getDocument<Customization>(
                        appwriteConfig.databaseId,
                        appwriteConfig.customizationsCollectionId, // ✅ your actual customizations collection
                        id
                    );
                    return c;
                } catch (err) {
                    console.warn(`⚠️ Failed to fetch customization ${id}`, err);
                    return null;
                }
            })
        );

        const validCustomizations = customizationDocs.filter(Boolean) as Customization[];

        console.log("🍔 Full customizations:", JSON.stringify(validCustomizations, null, 2));
        return validCustomizations;
    } catch (error) {
        console.error("Failed to fetch menu customizations", error);
        return [];
    }
};

export const getOffers = async (): Promise<Offer[]> => {
    try {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.offersCollectionId,
            [
                Query.limit(100),
                Query.equal('isActive', true),
                Query.orderAsc('$createdAt')
            ]
        );

        return response.documents as unknown as Offer[];
    } catch (error) {
        console.error('Failed to fetch offers from offer list', error);
        throw new Error('Unable to Fetch offers from appwrite');
    }
}

export const getOfferCategories = async (offersId: string): Promise<{
    $id: string;
    name: any;
    description: any;
    itemCount: any;
    menu: any
}[]> => {
    try {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.categoryCollectionId,
            [
                Query.equal('offer_id', offersId),
                Query.limit(100),
                Query.select(['*', 'menu.*'])
            ]
        );

        return response.documents.map((doc) => ({
            $id: doc.$id,
            name: doc.name,
            description: doc.description,
            itemCount: doc.itemCount ?? 0,
            menu: doc.menu ?? [],
        }));
    } catch (error) {
        console.error('Failed to fetch offer categories from offer list', error);
        return [];
    }
}

// Create a Saved Board
export const createBoard = async (payload: SavedBoardPayload): Promise<Board> => {
    // console.log("DB-save ID:", appwriteConfig.databaseId);

    try {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) throw new Error('User not logged in');

        const userId = currentUser.accountId;

        // console.log("Creating board with payload:", {
        //     ...payload,
        //     userId,
        // });

        const response = await databases.createDocument<Board>(
            appwriteConfig.databaseId,
            appwriteConfig.customizationsBoardsCollectionId!,
            ID.unique(),
            {
                ...payload,
                userId,
            },
        );

        // console.log('Board created', response.$id);
        return response;
    } catch (e: any) {
        console.error('Failed to create board', e.message);
        throw new Error('Unable to create board');
    }
}

// Get all boards by user (filter by itemId)
export async function getBoardsForItem(itemId?: string): Promise<Board[]> {
    return getBoardsByUser(itemId)
}

// Fetch all boards for the user (optionally filtered by itemId)
export const getBoardsByUser = async (
    itemId?: string
): Promise<(Board & { parsedCustomizations: CartCustomization[] })[]> => {
    try {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) throw new Error("Not logged in");

        const userId = currentUser.accountId;

        const queries = [Query.equal("userId", userId)];
        if (itemId) queries.push(Query.equal("itemId", itemId));

        const response = await databases.listDocuments<Board>(
            appwriteConfig.databaseId,
            appwriteConfig.customizationsBoardsCollectionId!,
            queries
        );

        return response.documents.map((board) => {
            let parsed: CartCustomization[] = [];
            try {
                parsed = typeof board.customizations === "string"
                    ? JSON.parse(board.customizations)
                    : board.customizations ?? [];
            } catch (err) {
                console.warn("Failed to parse board customizations:", err);
            }

            return {
                ...board,
                parsedCustomizations: parsed,
            };
        });
    } catch (err: any) {
        console.error("Failed to fetch boards:", err.message);
        return [];
    }
};

export const useBoard = async (board: Board) => {
    try {
        const useBoard = await databases.updateDocument<Board>(
            appwriteConfig.databaseId,
            appwriteConfig.customizationsBoardsCollectionId!,
            board.$id,
            {
                lastUsedAt: new Date().toISOString()
            }
        );

        return useBoard;
    } catch (err) {
        console.error("Failed to mark board as used:", err);
        throw err;
    }
};

export const updateBoard = async (boardId: string, payload: SavedBoardPayload): Promise<Board> => {
    try {
        const currentUser = useAuthStore.getState().user;
        const response = await databases.updateDocument<Board>(
            appwriteConfig.databaseId,
            appwriteConfig.customizationsBoardsCollectionId!,
            boardId,
            {
                ...payload,
                userId: currentUser?.accountId,
            }
        );

        // console.log("Board updated:", response.$id);
        return response;
    } catch (e: any) {
        console.error("Failed to update board:", e.message);
        throw new Error("Unable to update board");
    }
};


// Deactivate a board
export const deactivateBoard = async (boardId: string): Promise<Board> => {
    try {
        const currentUser = useAuthStore.getState().user;

        const response = await databases.updateDocument<Board>(
            appwriteConfig.databaseId,
            appwriteConfig.customizationsBoardsCollectionId!,
            boardId,
            {
                isActive: false,
                archived: true,
                userId: currentUser?.accountId,
            }
        );

        console.log("Board deactivated:", response.$id);
        return response;
    } catch (e: any) {
        console.error("Failed to deactivate board:", e.message);
        throw new Error("Unable to deactivate board");
    }
};
