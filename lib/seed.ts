// import { ID } from "react-native-appwrite";
// import { appwriteConfig, databases, storage } from "./appwrite";
// import dummyData from "./data";
//
// interface Category {
//     name: string;
//     description: string;
// }
//
// interface Customization {
//     name: string;
//     price: number;
//     type: "topping" | "side" | "size" | "crust" | string; // extend as needed
// }
//
// interface MenuItem {
//     name: string;
//     description: string;
//     image_url: string;
//     price: number;
//     rating: number;
//     calories: number;
//     protein: number;
//     category_name: string;
//     customizations: string[]; // list of customization names
// }
//
// interface DummyData {
//     categories: Category[];
//     customizations: Customization[];
//     menu: MenuItem[];
// }
//
// // ensure dummyData has the correct shape
// const data = dummyData as DummyData;
//
// async function clearAll(collectionId: string): Promise<void> {
//     const list = await databases.listDocuments(
//         appwriteConfig.databaseId,
//         collectionId
//     );
//
//     await Promise.all(
//         list.documents.map((doc) =>
//             databases.deleteDocument(appwriteConfig.databaseId, collectionId, doc.$id)
//         )
//     );
// }
//
// async function clearStorage(): Promise<void> {
//     const list = await storage.listFiles(appwriteConfig.bucketId);
//
//     await Promise.all(
//         list.files.map((file) =>
//             storage.deleteFile(appwriteConfig.bucketId, file.$id)
//         )
//     );
// }
//
// async function uploadImageToStorage(imageUrl: string) {
//     const response = await fetch(imageUrl);
//     const blob = await response.blob();
//
//     const fileObj = {
//         name: imageUrl.split("/").pop() || `file-${Date.now()}.jpg`,
//         type: blob.type,
//         size: blob.size,
//         uri: imageUrl,
//     };
//
//     const file = await storage.createFile(
//         appwriteConfig.bucketId,
//         ID.unique(),
//         fileObj
//     );
//
//     return storage.getFileViewURL(appwriteConfig.bucketId, file.$id);
// }
//
// async function seed(): Promise<void> {
//     console.log("🍔 Seeding menu customizations only...");
//     // 1. Clear all
//     // await clearAll(appwriteConfig.categoryCollectionId);
//     await clearAll(appwriteConfig.customizationsCollectionId);
//     await clearAll(appwriteConfig.menuCollectionId);
//     await clearAll(appwriteConfig.menu_customizationsCollectionId);
//     // await clearStorage();
//
//     // Fetch existing categories and customizations from Appwrite
//     const categories = await databases.listDocuments(
//         appwriteConfig.databaseId,
//         appwriteConfig.categoryCollectionId
//     );
//
//     // 3. Map them for easy lookup
//     const categoryMap: Record<string, string> = {};
//     for (const cat of categories.documents) {
//         categoryMap[cat.name] = cat.$id;
//     }
//
//     // const customizations = await databases.listDocuments(
//     //     appwriteConfig.databaseId,
//     //     appwriteConfig.customizationsCollectionId
//     // );
//     //
//     // const menus = await databases.listDocuments(
//     //     appwriteConfig.databaseId,
//     //     appwriteConfig.menuCollectionId
//     // );
//     //
//     // const existingMenuCustomizations = await databases.listDocuments(
//     //     appwriteConfig.databaseId,
//     //     appwriteConfig.menu_customizationsCollectionId
//     // );
//
//     // 2. Create Categories
//     // const categoryMap: Record<string, string> = {};
//     // for (const cat of data.categories) {
//     //     const doc = await databases.createDocument(
//     //         appwriteConfig.databaseId,
//     //         appwriteConfig.categoryCollectionId,
//     //         ID.unique(),
//     //         cat
//     //     );
//     //     categoryMap[cat.name] = doc.$id;
//     // }
//
//
//     // 3. Create Customizations
//     const customizationMap: Record<string, string> = {};
//     for (const cus of data.customizations) {
//         const doc = await databases.createDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.customizationsCollectionId,
//             ID.unique(),
//             {
//                 name: cus.name,
//                 price: cus.price,
//                 type: cus.type,
//             }
//         );
//         customizationMap[cus.name] = doc.$id;
//         console.log(`✅ Created customization: ${cus.name}`);
//     }
//
//     // // 4. Create Menu Items
//     const menuMap: Record<string, string> = {};
//     for (const item of data.menu) {
//
//         try {
//             const imageUrl = item.image_url; // using external image for now
//
//             const doc = await databases.createDocument(
//                 appwriteConfig.databaseId,
//                 appwriteConfig.menuCollectionId,
//                 ID.unique(),
//                 {
//                     name: item.name,
//                     description: item.description,
//                     image_url: imageUrl,
//                     price: item.price,
//                     rating: item.rating,
//                     calories: item.calories,
//                     protein: item.protein,
//                     availability: true,
//                     categories: categoryMap[item.category_name],
//                 }
//             );
//
//             // ✅ Optional: store in map
//             menuMap[item.name] = doc.$id;
//             console.log(`✅ Menu item added: ${item.name}`);
//
//             // 5. Create menu_customizations
//             for (const cusName of item.customizations) {
//                 const cusId = customizationMap[cusName];
//                 if (!cusId) continue;
//
//                 const link = await databases.createDocument(
//                     appwriteConfig.databaseId,
//                     appwriteConfig.menu_customizationsCollectionId,
//                     ID.unique(),
//                     {
//                         menu: doc.$id,
//                         customizations: cusId,
//                     }
//                 );
//
//                 await databases.updateDocument(
//                     appwriteConfig.databaseId,
//                     appwriteConfig.customizationsCollectionId,
//                     cusId,
//                     { menuCustomizations: link.$id }
//                 );
//
//                 console.log(`🔗 Linked ${item.name} ↔ ${cusName}`);
//             }
//
//             // optional delay to avoid rate limiting
//             await new Promise((r) => setTimeout(r, 500));
//
//         } catch (error) {
//             console.error(`❌ Failed to create menu item: ${item.name}`, error);
//         }
//     }
//
//     console.log("✅ Seeding completed.");
// }
//
// console.log("✅ Seeding complete.");
//
// export default seed;

import { ID, Query } from "react-native-appwrite";
import { appwriteConfig, databases } from "./appwrite";
import dummyData from "./data";

interface Category {
    name: string;
    description: string;
}

interface Customization {
    name: string;
    price: number;
    type: "topping" | "side" | "size" | "crust" | string;
}

interface MenuItem {
    name: string;
    description: string;
    image_url: string;
    price: number;
    rating: number;
    calories: number;
    protein: number;
    category_name: string;
    customizations: string[];
    availability: boolean;
}

interface DummyData {
    categories: Category[];
    customizations: Customization[];
    menu: MenuItem[];
}

const data = dummyData as DummyData;

async function seed() {
    console.log("🍔 Safe seeding started...");

    // -------------------- Fetch existing data --------------------
    const categories = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.categoryCollectionId
    );

    const categoryMap: Record<string, string> = {};
    for (const cat of categories.documents) {
        categoryMap[cat.name] = cat.$id;
    }

    const existingCustomizations = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.customizationsCollectionId
    );
    const customizationMap: Record<string, string> = {};
    for (const cus of existingCustomizations.documents) {
        customizationMap[cus.name] = cus.$id;
    }

    const existingMenus = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.menuCollectionId
    );
    const menuMap: Record<string, string> = {};
    for (const menu of existingMenus.documents) {
        menuMap[menu.name] = menu.$id;
    }

    // -------------------- Seed Customizations --------------------
    for (const cus of data.customizations) {
        if (customizationMap[cus.name]) {
            console.log(`⚠️ Customization already exists: ${cus.name}`);
            continue;
        }

        const doc = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.customizationsCollectionId,
            ID.unique(),
            {
                name: cus.name,
                price: cus.price,
                type: cus.type,
            }
        );

        customizationMap[cus.name] = doc.$id;
        console.log(`✅ Created customization: ${cus.name}`);
    }

    // -------------------- Seed Menu Items --------------------
    for (const item of data.menu) {
        let menuId = menuMap[item.name];

        if (!menuId) {
            const doc = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.menuCollectionId,
                ID.unique(),
                {
                    name: item.name,
                    description: item.description,
                    image_url: item.image_url,
                    price: item.price,
                    rating: item.rating,
                    calories: item.calories,
                    protein: item.protein,
                    availability: item.availability,
                    categories: categoryMap[item.category_name],
                }
            );
            menuId = doc.$id;
            menuMap[item.name] = menuId;
            console.log(`✅ Menu item added: ${item.name}`);
        } else {
            console.log(`⚠️ Menu item already exists: ${item.name}`);
        }

        // -------------------- Link Customizations --------------------
        for (const cusName of item.customizations) {
            const cusId = customizationMap[cusName];
            if (!cusId) continue;

            const existingLinks = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.menu_customizationsCollectionId,
                [
                    Query.equal('menu', menuId),
                    Query.equal('customizations', cusId),
                ]
            );

            if (existingLinks.total === 0) {
                await databases.createDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.menu_customizationsCollectionId,
                    ID.unique(),
                    {
                        menu: menuId,
                        customizations: cusId,
                    }
                );
                console.log(`🔗 Linked ${item.name} ↔ ${cusName}`);
            }
        }
    }

    console.log("✅ Safe seeding completed.");
}

export default seed;
