import {Text, TouchableOpacity, Image, Platform} from 'react-native'
import {MenuItem} from "@/type";
import {appwriteConfig} from "@/lib/appwrite";

const MenuCard = ({ item: { image_url, name, price }}: {item: MenuItem}) => {
   //console.log("Menu images:", image_url, name)
    return (
        <TouchableOpacity className='menu-card' style={Platform.OS === 'android' ? { elevation: 10, shadowColor: '#878787'}: {}}>
            <Image
                source={{uri: image_url}}
                className='size-32 absolute -top-10'
                resizeMode='contain'
                //onError={(e) => console.log("❌ Image load error:", e.nativeEvent)}
                //onLoad={() => console.log("✅ Image loaded successfully:", image_url)}
            />
            <Text className='text-center base-bold text-dark-100 mb-2' numberOfLines={1}>{name}</Text>
            <Text className='body-regular text-gray-200 mb-4'>From ${price}</Text>
            <TouchableOpacity>
                <Text className='paragraph-bold text-primary'>Add To Cart +</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    )
}
export default MenuCard