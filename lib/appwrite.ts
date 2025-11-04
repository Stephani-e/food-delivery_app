import {Account, Avatars, Client, Databases, ID, OAuthProvider, Query, Storage} from "react-native-appwrite";
import {Category, CreateUserParams, Customization, GetMenuParams, MenuItem, Offer, SignInParams} from "@/type";
import * as Linking from 'expo-linking';
import { User } from '@/type'
import {openAuthSessionAsync} from "expo-web-browser";


export const appwriteConfig = {
    platform: "com.phanie.fooddelivery",
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
    databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
    bucketId: process.env.EXPO_PUBLIC_APPWRITE_ASSETS_ID!,
    userCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USER_ID!,
    categoryCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CATEGORY_ID!,
    menuCollectionId: process.env.EXPO_PUBLIC_APPWRITE_MENU_ID!,
    customizationsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CUSTOMIZATIONS_ID!,
    menu_customizationsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_MENU_CUSTOMIZATIONS_ID!,
    offersCollectionId: process.env.EXPO_PUBLIC_APPWRITE_OFFERS_ID!,
    reviewsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_REVIEWS_ID!,
    cartCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CART_ID!,
}

export const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform)

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { Query, ID }
const avatars = new Avatars(client);

// Maps a raw Appwrite document to your app's User type
export function toUser(doc: any): User {
    return {
        $id: doc.$id,
        $databaseId: doc.$databaseId ?? "",
        $collectionId: doc.$collectionId ?? "",
        $createdAt: doc.$createdAt ?? "",
        $updatedAt: doc.$updatedAt ?? "",
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

// 🟢 Create a user manually (email + password)
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

// 🟢 Google Login
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

// 🟩 NEW — Unified Sync Helper (prevents duplicates)
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
                const mergedProviders = Array.isArray(existingUser.provider)
                    ? Array.from(new Set([...existingUser.provider, provider]))
                    : Array.from(new Set([...existingUser.provider.split(','), provider]));

                const updatedUser = await databases.updateDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.userCollectionId,
                    existingUser.$id,
                    {provider: mergedProviders}
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

        if (!currentUser) throw Error;

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
        return response;
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