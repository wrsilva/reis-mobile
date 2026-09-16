# React Native UI and navigation

## Navigation

Use the router the project has.

**React Navigation** (native stack):

```tsx
export type RootStackParamList = { Orders: undefined; OrderDetail: { orderId: string } };
const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}
```

**Expo Router** (file-based): routes are files under `app/` (`app/orders/[orderId].tsx`), layouts are `_layout.tsx`, navigation uses `<Link href="/orders/42">` or `router.push`, and params come from `useLocalSearchParams`.

- Type route params and pass ids, not objects or functions.
- Configure deep linking in the router (the `linking` option, or Expo Router's automatic routes) so notifications and links open the right screen.
- Use native stack navigators for native transitions and gestures.

## Layout and styling

- `StyleSheet.create` or the styling library the project uses; Flexbox with `flexDirection: 'column'` as the default.
- Safe areas with `react-native-safe-area-context` (`SafeAreaView` or `useSafeAreaInsets`); the core `SafeAreaView` only works on iOS.
- Dark mode with `useColorScheme` and a theme object, not hardcoded colors.
- Platform differences in `.ios.tsx`/`.android.tsx` files or `Platform.select`, kept small.

## Lists

- `FlatList`/`SectionList` (or FlashList, if the project uses it) for long or dynamic data, with a stable `keyExtractor`.
- Memoize `renderItem` components and avoid inline objects on hot rows; provide `getItemLayout` for fixed-height rows.
- Pull to refresh with `refreshing`/`onRefresh`; pagination with `onEndReached` guarded against duplicate calls.

## Forms and keyboard

- A form library the project has (React Hook Form is common), with schema validation shared with the API layer when possible.
- `KeyboardAvoidingView` (behavior differs per platform) or a keyboard library the project uses; `keyboardShouldPersistTaps="handled"` on scroll views with inputs.
- Set `textContentType` (iOS) and `autoComplete` for autofill, and `returnKeyType` with focus chaining between fields.

## Gestures and animations

- Reanimated for animations that run on the UI thread, Gesture Handler for gestures; `Animated` with `useNativeDriver: true` for simple cases.
- Do not drive per-frame animation through React state.

## Images

`expo-image` (or the image library the project uses) for caching and placeholders; size images close to their display size.

## Accessibility and localization

- `accessibilityRole`, `accessibilityLabel` and `accessibilityState` on touchables; `accessible` groups for composite elements.
- Respect font scaling; do not set `allowFontScaling={false}` on body text. Touch targets of at least 44–48 points (`hitSlop` for small icons).
- Test with VoiceOver and TalkBack.
- Localize with the library the project uses (for example i18next) and the device locale from `expo-localization` or equivalent.
