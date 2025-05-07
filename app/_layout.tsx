import { Stack } from "expo-router";
import { DatabaseProvider } from '@/contexts/DatabaseContext';

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <Stack>
        <Stack.Screen name="index" options={{title: 'MAP'}}/>
        <Stack.Screen name="marker/[id]" options ={{title: 'INFO'}}/>
      </Stack>
    </DatabaseProvider>
  )
}