import {SplashScreen as ExpoSplash, Stack} from "expo-router";
import './globals.css'
import {useFonts} from "expo-font";
import {useEffect} from "react";
import * as Sentry from '@sentry/react-native';
import useAuthStore from "@/store/auth.store";
import SplashScreen from "@/components/Style/SplashScreen";
import { useCartStore } from "@/store/cart.store";
import { detectLocation } from "@/lib/location/location";
import {useLocationStore} from "@/store/location.store";

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

  const hydrated = useLocationStore((s) => s.hydrated);
  const hydrate = useLocationStore((s) => s.hydrate);

  const { isLoading, isAuthenticated, user, fetchAuthenticatedUser, userLoaded } = useAuthStore();
  useCartStore();

  const [fontsLoaded, fontError] = useFonts({
    "QuickSand-Bold": require('../assets/fonts/Quicksand-Bold.ttf'),
    "QuickSand-Medium": require('../assets/fonts/Quicksand-Medium.ttf'),
    "QuickSand-Regular": require('../assets/fonts/Quicksand-Regular.ttf'),
    "QuickSand-SemiBold": require('../assets/fonts/Quicksand-SemiBold.ttf'),
    "QuickSand-Light": require('../assets/fonts/Quicksand-Light.ttf'),
  });

  //Load Fonts
  useEffect(() => {
    if(fontError) throw fontError;
    if(fontsLoaded) ExpoSplash.hideAsync();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    hydrate();
  }, []);

  // detect location
  useEffect(() => {
    if (hydrated) {
      detectLocation('country-only');
    }
  }, [hydrated]);

  // Fetch user before rendering
  useEffect(() => {
    fetchAuthenticatedUser().catch(err =>
        console.log("Auth fetch failed:", err));
  }, []);

  // Load cart once user.accountId is ready
  useEffect(() => {
    if (!userLoaded) return;
    if (!isAuthenticated) return;
    if (!user?.accountId) return;;

    const store  = useCartStore.getState();

    store
        .loadCartFromServer()
        .then(() => store.subscribeToCartRealTime())
        .catch(err => console.error("Failed to load cart:", err));
  }, [userLoaded, isAuthenticated, user?.accountId]);

  if (!fontsLoaded) {
    return <SplashScreen message="Loading Fonts..." />
  }

  if (!hydrated) {
    return <SplashScreen message="Loading location..." />;
  }

// wait for uer to load completely
  if (isLoading) return (
      <SplashScreen
          message="Authenticating User..."
          image={require("@/assets/images/logo.png")}
      />
  );

  return <Stack screenOptions={{headerShown: false}} />;
});