import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
  type RefObject
} from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable as NativePressable,
  View,
  type GestureResponderEvent,
  type TextInput
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { SafeAreaView } from "@/components/ui/safe-area-view";
import { drawerDragTranslation, shouldDismissDrawer } from "@/lib/animations/drawer-motion";
import { easeDrawer, easeOut } from "@/lib/animations/motion";

interface DrawerProps extends PropsWithChildren {
  open: boolean;
  onClose: (event?: GestureResponderEvent) => void;
  label: string;
  presentation?: "default" | "ledger";
  animate?: boolean;
  dismissDisabled?: boolean;
  header?: ReactNode;
  initialFocusRef?: RefObject<TextInput | null>;
}

/** Retain the modal until its exit completes, including controlled date selection. */
export function Drawer(props: DrawerProps) {
  const [present, setPresent] = useState(props.open);
  const openRef = useRef(props.open);
  if (props.open && !present) setPresent(true);
  useLayoutEffect(() => {
    openRef.current = props.open;
  }, [props.open]);
  const hide = useCallback(() => {
    // A completed exit can already be queued when the parent reopens the drawer.
    if (!openRef.current) setPresent(false);
  }, []);
  return present ? <DrawerSurface {...props} onHidden={hide} /> : null;
}

function DrawerSurface({
  open,
  onClose,
  onHidden,
  label,
  children,
  presentation = "default",
  animate = true,
  dismissDisabled = false,
  header,
  initialFocusRef
}: DrawerProps & { onHidden: () => void }) {
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const focusFrame = useRef<number | null>(null);
  const measured = useRef(false);
  const skipExit = useRef(false);
  const height = useSharedValue(0);
  const translation = useSharedValue(0);
  const visibility = useSharedValue(0);
  const dragStart = useSharedValue(0);
  const closing = useSharedValue(false);
  const immediate = reducedMotion || !animate;
  const slides = presentation === "ledger" && !immediate;

  const transition = useCallback(
    (entering: boolean, initial = false) => {
      if (entering) skipExit.current = false;
      const instant = immediate || skipExit.current;
      closing.set(!entering);
      if (slides && !instant) {
        visibility.set(1);
        if (initial) translation.set(height.get());
        translation.set(
          withTiming(
            entering ? 0 : height.get() + 1,
            { duration: entering ? 260 : 180, easing: entering ? easeDrawer : easeOut },
            (finished) => {
              if (finished && !entering) scheduleOnRN(onHidden);
            }
          )
        );
      } else {
        cancelAnimation(translation);
        translation.set(0);
        visibility.set(
          withTiming(
            entering ? 1 : 0,
            { duration: instant ? 0 : 180, easing: easeOut },
            (finished) => {
              if (finished && !entering) scheduleOnRN(onHidden);
            }
          )
        );
      }
    },
    [closing, height, immediate, onHidden, slides, translation, visibility]
  );
  useLayoutEffect(() => {
    if (measured.current) transition(open);
  }, [open, transition]);
  useLayoutEffect(
    () => () => {
      if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
      cancelAnimation(translation);
      cancelAnimation(visibility);
    },
    [translation, visibility]
  );

  const close = (event?: GestureResponderEvent) => {
    if (!dismissDisabled && open) {
      closing.set(true);
      onClose(event);
    }
  };
  const requestClose = () => {
    if (dismissDisabled || !open) return;
    // React Native Web invokes this callback for Escape; native uses system Back.
    skipExit.current = Platform.OS === "web";
    close();
  };
  const drag = Gesture.Pan()
    .enabled(open && !dismissDisabled)
    .activeOffsetY([-8, 8])
    .failOffsetX([-24, 24])
    .maxPointers(1)
    .onTouchesDown((event, manager) => {
      if (event.numberOfTouches > 1) manager.fail();
    })
    .onStart(() => {
      cancelAnimation(translation);
      dragStart.set(translation.get());
    })
    .onUpdate((event) => {
      translation.set(drawerDragTranslation(dragStart.get() + event.translationY));
    })
    .onEnd((event, success) => {
      if (success && shouldDismissDrawer(translation.get(), event.velocityY, height.get())) {
        closing.set(true);
        scheduleOnRN(close);
      }
    })
    .onFinalize((event) => {
      if (closing.get()) return;
      translation.set(
        immediate
          ? 0
          : withSpring(0, {
              damping: 32,
              stiffness: 420,
              mass: 0.7,
              velocity: event.velocityY,
              overshootClamping: true
            })
      );
    });
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: height.get() > 0 ? visibility.get() : 0,
    transform: [{ translateY: slides ? translation.get() : 0 }]
  }));
  const scrimStyle = useAnimatedStyle(() => ({
    opacity:
      visibility.get() *
      (slides ? 1 - Math.min(1, Math.max(0, translation.get()) / Math.max(1, height.get())) : 1)
  }));

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={requestClose}
      statusBarTranslucent
      navigationBarTranslucent
      accessibilityViewIsModal
      onShow={() => {
        focusFrame.current = requestAnimationFrame(() => {
          if (open) initialFocusRef?.current?.focus();
        });
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar hidden={false} style="dark" />
        <View className="bg-background" style={{ height: insets.top }} />
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View className="flex-1 justify-end" style={{ overflow: "hidden" }}>
            <Animated.View className="absolute inset-0" style={scrimStyle}>
              <NativePressable
                testID="drawer-backdrop"
                accessibilityLabel={`Close ${label}`}
                accessibilityRole="button"
                className="bg-scrim absolute inset-0"
                disabled={dismissDisabled || !open}
                accessibilityState={{ disabled: dismissDisabled || !open }}
                onPress={close}
              />
            </Animated.View>
            <Animated.View
              testID="drawer-sheet"
              className="w-full max-w-xl self-center"
              style={[
                { flexShrink: 1, maxHeight: "100%", pointerEvents: open ? "auto" : "none" },
                sheetStyle
              ]}
              onLayout={(event) => {
                const nextHeight = event.nativeEvent.layout.height;
                if (nextHeight <= 0) return;
                height.set(nextHeight);
                if (!measured.current) {
                  measured.current = true;
                  transition(open, true);
                }
              }}
            >
              <SafeAreaView
                className="bg-card w-full max-w-xl self-center overflow-hidden rounded-t-2xl"
                edges={["bottom"]}
                style={{ flexShrink: 1, maxHeight: "100%" }}
              >
                <GestureDetector gesture={drag} touchAction="none">
                  <View testID="drawer-drag-handle" collapsable={false}>
                    <View
                      className={
                        header ? "items-center pt-2 pb-2" : "h-12 items-center justify-center"
                      }
                    >
                      <View className="bg-frame h-1 w-9 rounded-full" />
                    </View>
                    {header}
                  </View>
                </GestureDetector>
                {children}
              </SafeAreaView>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}
