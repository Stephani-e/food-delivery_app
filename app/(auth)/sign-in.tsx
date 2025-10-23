import {Alert, Text, View} from 'react-native'
import React, {useState} from 'react'
import {Link, router} from "expo-router";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import {validateForm} from "@/utils/validateForm";
import {goggleLogin, signIn} from "@/lib/appwrite";
import CustomGoogleButton from "@/components/CustomGoogleButton";
import * as Sentry from '@sentry/react-native'

const SignIn = () => {

    const [ isSubmitting, setIsSubmitting ] = useState(false);
    const [ isGoogleLoading, setIsGoogleLoading ] = useState(false);
    const [ form, setForm ] = useState({ email: "", password: "" })

    const handleSubmit = async () => {
        const missing = validateForm(form, ["email", "password"]);

        if (missing.length > 0 ) return Alert.alert("Error", `Please fill in ${missing.join(",")}`);

        setIsSubmitting(true);
        const { email, password } = form;

        try {
            const user = await signIn({ email, password })

            if (user) {
                Alert.alert("Success", "Sign In Success");
                router.replace('/')
            }
        } catch (error: any) {
            Alert.alert("Error", error.message)
            Sentry.captureException(error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);

        try {
            const user = await goggleLogin();

            if (user) {
                Alert.alert("Success", "Sign In Success");
                router.replace('/')
            } else {
                Alert.alert("Error", "Sign In Failed");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <View className="gap-10 bg-white rounded-lg p-5 mt-5">

            <CustomInput
                placeholder="Enter Your Email"
                value={form.email}
                onChangeText={(text) => setForm((prev) => ({ ...prev, email: text} ))}
                label="Email"
                keyboardType="email-address"
            />

            <CustomInput
                placeholder="Enter Your Password"
                value={form.password}
                onChangeText={(text ) => setForm((prev) => ({ ...prev, password: text}))}
                label="Password"
                secureTextEntry={true}
            />

            <CustomButton
                title="Sign In"
                isLoading={isSubmitting}
                onPress={handleSubmit}
            />

            <CustomGoogleButton
                title="Sign In with Google"
                isLoading={isGoogleLoading}
                onPress={handleGoogleLogin}
            />

            <View className="flex justify-center mt-5 flex-row gap-2">
                <Text className="base-regular text-gray-100">Don't have an account?</Text>
                <Link
                    href="/sign-up"
                    className="base-gold text-primary"
                >
                    Sign Up
                </Link>
            </View>
        </View>
    )
}
export default SignIn
