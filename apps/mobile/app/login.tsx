import { Link } from "expo-router"
import { Button, TextInput } from "react-native-paper"

import { Screen } from "../src/Screen"

export default function LoginScreen() {
  return (
    <Screen title="Login">
      <TextInput mode="outlined" label="Email" />
      <TextInput mode="outlined" label="Password" secureTextEntry />
      <Link href="/" asChild><Button mode="contained">Login</Button></Link>
    </Screen>
  )
}
