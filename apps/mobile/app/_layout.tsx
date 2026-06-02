import { Stack } from "expo-router"
import { PaperProvider } from "react-native-paper"

export default function Layout() {
  return (
    <PaperProvider>
      <Stack screenOptions={{ headerStyle: { backgroundColor: "#0F172A" }, headerTintColor: "#fff" }} />
    </PaperProvider>
  )
}
