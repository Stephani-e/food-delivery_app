import {Alert, Text, View} from 'react-native'
import React, {useState} from 'react'
import {Link, router} from "expo-router";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import {validateForm} from "@/utils/validateForm";
import {createUser, goggleLogin} from "@/lib/appwrite";
import CustomGoogleButton from "@/components/CustomGoogleButton";
import * as Sentry from "@sentry/react-native";

const SignUp = () => {

    const [ isSubmitting, setIsSubmitting ] = useState(false);
    const [ isGoogleLoading, setIsGoogleLoading ] = useState(false);
    const [ form, setForm ] = useState({ name: "", email: "", password: "" })

    const handleSubmit = async () => {
        const { name, email, password } = form;
        const missing = validateForm(form, [ "name", "email", "password"]);

        if (missing.length > 0 ) return Alert.alert("Error", `Please fill in ${missing.join(",")}`);

        setIsSubmitting(true);

        try {
            await createUser({ email, password, name})

            router.replace('/')
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleGoogleSignUp = async () => {
        setIsGoogleLoading(true);

        try {
            const user = await goggleLogin();

            if (user) {
                Alert.alert("Success", "Sign Up Success");
                router.replace('/')
            } else {
                Alert.alert("Error", "Sign Up Failed");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message);
            Sentry.captureException(error);
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <View className="gap-7 bg-white rounded-lg p-5 mt-5">

            <CustomInput
                placeholder="Enter Your Full Name"
                value={form.name}
                onChangeText={( text ) => setForm((prev) => ({...prev, name: text}))}
                label="Full Name"
            />

            <CustomInput
                placeholder="Enter Your Email"
                value={form.email}
                onChangeText={( text ) => setForm((prev) => ({...prev, email: text}))}
                label="Email"
                keyboardType="email-address"
            />

            <CustomInput
                placeholder="Enter Your Password"
                value={form.password}
                onChangeText={( text ) => setForm((prev) => ({...prev, password: text}))}
                label="Password"
                secureTextEntry={true}
            />

            <CustomButton
                title="Sign Up"
                isLoading={isSubmitting}
                onPress={handleSubmit}
            />

            <CustomGoogleButton
                title="Sign Up with Google"
                isLoading={isGoogleLoading}
                onPress={handleGoogleSignUp}
            />

            <View className="flex justify-center flex-row gap-2">
                <Text className="base-regular text-gray-100">Already have an account?</Text>
                <Link
                    href="/sign-in"
                    className="base-gold text-primary"
                >
                    Sign In
                </Link>
            </View>
        </View>
    )
}
export default SignUp
