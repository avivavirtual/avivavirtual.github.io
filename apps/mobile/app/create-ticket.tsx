import { Button, TextInput } from "react-native-paper"

import { Screen } from "../src/Screen"

export default function CreateTicketScreen() {
  return (
    <Screen title="Create Ticket">
      <TextInput mode="outlined" label="Subject" />
      <TextInput mode="outlined" label="Description" multiline />
      <Button mode="contained">Create</Button>
    </Screen>
  )
}
