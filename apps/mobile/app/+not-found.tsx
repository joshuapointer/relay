/**
 * 404 screen — expo-router convention for unmatched routes.
 */
import { nativeTokens } from '@relay/design-tokens/native';
import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen does not exist.</Text>
        <Link href="/(app)/home" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: nativeTokens.color.surface,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: nativeTokens.color.ink,
    marginBottom: 16,
  },
  link: {
    marginTop: 8,
  },
  linkText: {
    color: nativeTokens.color.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
