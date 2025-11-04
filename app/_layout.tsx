import {SplashScreen as ExpoSplash, Stack} from "expo-router";
import './globals.css'
import {useFonts} from "expo-font";
import {useEffect} from "react";
import * as Sentry from '@sentry/react-native';
import useAuthStore from "@/store/auth.store";
import SplashScreen from "@/components/SplashScreen";
import { useCartStore } from "@/store/cart.store";

Sentry.init({
  dsn: 'https://b8b1c43159ba962d27ece14206596c2e@o4510164534689792.ingest.de.sentry.io/4510164537901136',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
      Sentry.mobileReplayIntegration(),
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});


export default Sentry.wrap(function RootLayout() {
  const { isLoading, isAuthenticated, user, fetchAuthenticatedUser } = useAuthStore();
  const { loadCartFromServer } = useCartStore();

  const [fontsLoaded, error] = useFonts({
    "QuickSand-Bold": require('../assets/fonts/Quicksand-Bold.ttf'),
    "QuickSand-Medium": require('../assets/fonts/Quicksand-Medium.ttf'),
    "QuickSand-Regular": require('../assets/fonts/Quicksand-Regular.ttf'),
    "QuickSand-SemiBold": require('../assets/fonts/Quicksand-SemiBold.ttf'),
    "QuickSand-Light": require('../assets/fonts/Quicksand-Light.ttf'),
  });

  useEffect(() => {
    if(error) throw error;
    if(fontsLoaded) ExpoSplash.hideAsync();
  }, [fontsLoaded, error]);

  // Fetch user before rendering anything
  useEffect(() => {
    const initialize = async () => {
      try {
        await fetchAuthenticatedUser(); // await ensures state updates before rendering
      } catch (err) {
        console.log("Auth init failed:", err);
      }
    };
    initialize();
  }, []);

  // Load cart when the user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCartFromServer();
    }
  }, [isAuthenticated, user]);

  if (!fontsLoaded) {
    return <SplashScreen message="Loading Fonts..." />
  }

  if (isLoading) return (
      <SplashScreen
          message="Authenticating User..."
          image={require("@/assets/images/logo.png")}
      />
  );

  return <Stack screenOptions={{headerShown: false}} />;
});