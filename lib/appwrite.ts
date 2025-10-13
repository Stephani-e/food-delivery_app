import {Account, Avatars, Client, Databases, ID, OAuthProvider, Query, Storage} from "react-native-appwrite";
import {CreateUserParams, GetMenuParams, SignInParams} from "@/type";
import * as Linking from 'expo-linking';
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
}

export const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform)

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
const avatars = new Avatars(client);

// 🟢 Create a user manually (email + password)
export const createUser = async ({ email, password, name }: CreateUserParams) => {
    try {
        console.log("🟡 Creating new account with:", { email, name });

        // 🔹 0️⃣ Ensure no active session before starting
        await account.deleteSessions().catch(() => {});

        // 1️⃣ Create the account
        const newAccount = await account.create(ID.unique(), email, password, name);
        if (!newAccount) throw new Error("Failed to create user account");

        // 2️⃣ Sign in (create a session)
        await signIn({email, password});
        console.log("✅ Signed in successfully");

        // 3️⃣ Generate avatar as a URL string
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
        const session = await account.createEmailPasswordSession(email, password);

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

export const getCategories = async () => {
    try {
        const categories = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.categoryCollectionId,
            [Query.limit(100)]
        )
    } catch (e) {
        throw new Error(e as string);
    }
}

export const getMenu = async ({ category, query }: GetMenuParams ) => {
    try {
        const queries: string[] = [];

        if (category) queries.push(Query.equal('categories', category));
        if (query) queries.push(Query.search('name', query));

        const menus = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.menuCollectionId,
            queries
        )

        return menus.documents;
    } catch (e) {
        throw new Error(e as string);
    }
}