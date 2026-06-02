import { Button, TextInput } from "react-native-paper"

import { Screen } from "../src/Screen"

export default function ProfileScreen() {
  return (
    <Screen title="Profile">
      <TextInput mode="outlined" label="Name" defaultValue="Jordan Lee" />
      <TextInput mode="outlined" label="Language" defaultValue="EN" />
      <Button mode="contained">Save</Button>
    </Screen>
  )
}
