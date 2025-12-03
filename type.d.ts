import { Models } from "react-native-appwrite";

export type CategoryRef = {
    $id: string;
    name: string;
};

export interface MenuItem extends Models.Document {
    name: string;
    itemPrice: number;
    image_url: string;
    description: string;
    availability: boolean;
    calories: number;
    protein: number;
    rating: number;
    categories: string | CategoryRef;
    type: string;
    avgRating?: number;
    reviewCount?: number;
    bun_type?: string;
    delivery?: string;
    deliveryTime?: string;
    menuCustomizations: MenuCustomization[];
}

export interface Category extends Models.Document {
    name: string;
    description: string;
    itemCount?: number;
    offer_id?: string;
    menu?: MenuItem[];
}

export interface Offer {
    $id: string;
    title: string;
    color: string;
    image_url: string;
    isActive: boolean;
    description?: string;
    categories?: Category | string | Models.Document;
}

export interface User extends Models.Document {
    accountId: string;
    name: string;
    email: string;
    avatar: string;
    provider: string[];
}

export interface CartCustomization extends CustomizationDraft{
    $id?: string;
}

export interface Customization extends Models.Document {
    name: string;
    price: number;
    type: "topping" | "side" | "extra" | string;
    image_url?: string;
}

export interface CustomizationDraft {
    id?: string;
    name: string;
    price: number;
    quantity: number;
    type: "topping" | "side" | "extra" | string;
    image_url?: string;
}

export interface MenuCustomization extends Models.Document {
    menu: string;
    customizations: Customization;
}

export interface CartItemType {
    id: string; // menu item id
    cartId?: string;
    key?: string;
    name: string;
    basePrice: number;
    image_url: string;
    quantity?: number;
    note?: string;
    customizations?: CartCustomization[];
    totalPrice?: number;
    extrasTotal?: number;
    is_checked_out?: boolean;
}

export interface PreviewState extends Omit<CartItemType, "customizations"> {
    customizations?: CartCustomization[];
    totalPrice?: number;
}

export interface CartStore {
    items: CartItemType[];

    preview?: PreviewState | null;

    setPreview: (
        preview:
            PreviewState |
            ((prev: PreviewState | null) => PreviewState | null)
    ) => void;
    updatePreview: (updates: Partial<PreviewState>) => void;
    clearPreview: () => void;

    loadCartFromServer: () => Promise<void>;
    subscribeToCartRealTime: () => (() => void) | void;

    addItem: (item: CartItemType) => void;
    removeItem: (id: string, customizations: CartCustomization[]) => void;
    increaseQty: (id: string, customizations: CartCustomization[]) => void;
    decreaseQty: (id: string, customizations: CartCustomization[]) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

export interface BoardItem {
    id: string;
    name: string;
    price: number;
    quantity?: number;
    type: "topping" | "side" | "extra" | string;
    image_url?: string;
}

export interface Board extends Models.Document {
    $id: string;
    userId: string;
    itemId: string;
    name?: string;
    customizations: string;
    extrasTotal?: number;
    itemName?: string;
    itemImage?: string;
    createdAt?: string;
    updatedAt?: string;
    isActive?: boolean;
    archived?: boolean;
    lastUsedAt?: string;
}

export type SavedBoardPayload = {
    $id?: string;
    itemId: string;
    userId: string;
    name?: string;
    customizations: string;
    extrasTotal: number;
    itemName?: string;
    itemImage?: string;
}

interface TabBarIconProps {
    focused: boolean;
    icon: ImageSourcePropType;
    title: string;
}

interface PaymentInfoStripeProps {
    label: string;
    value: string;
    labelStyle?: string;
    valueStyle?: string;
}

interface CustomButtonProps {
    onPress?: () => void;
    title?: string;
    style?: string;
    leftIcon?: React.ReactNode;
    textStyle?: string;
    isLoading?: boolean;
}

interface CustomGoogleButtonProps {
    onPress?: () => void;
    title?: string;
    style?: string;
    leftIcon?: React.ReactNode;
    textStyle?: string;
    isLoading?: boolean;
    disabled?: boolean;
}

interface CustomHeaderProps {
    title?: string;
}

interface CustomInputProps {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    label: string;
    secureTextEntry?: boolean;
    keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
}

interface ProfileFieldProps {
    label: string;
    value: string;
    icon: ImageSourcePropType;
}

interface CreateUserParams {
    email: string;
    password: string;
    name: string;
}

interface SignInParams {
    email: string;
    password: string;
}

interface GetMenuParams {
    category: string;
    query: string;
}

interface SplashScreenProps {
    message?: string;
    image?: any;
    duration?: number;
    onFinish?: () => void;
}

export interface EmptyStateProps {
    imageSource: any; // require() or { uri: "" }
    title: string;
    caption?: string;
    height?: number;
    width?: number;
}