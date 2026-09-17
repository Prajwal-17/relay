import { SafeAreaView as NativeSafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

/** UniWind adapter for the third-party safe-area component. */
export const SafeAreaView = withUniwind(NativeSafeAreaView);
