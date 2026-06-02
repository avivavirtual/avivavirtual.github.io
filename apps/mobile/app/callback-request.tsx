import { Button, TextInput } from "react-native-paper"

import { Screen } from "../src/Screen"

export default function CallbackRequestScreen() {
  return (
    <Screen title="Callback Request">
      <TextInput mode="outlined" label="Name" />
      <TextInput mode="outlined" label="Phone" />
      <TextInput mode="outlined" label="Preferred time" />
      <TextInput mode="outlined" label="Reason" multiline />
      <Button mode="contained">Submit</Button>
    </Screen>
  )
}
