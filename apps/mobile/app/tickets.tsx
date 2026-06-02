import { Link } from "expo-router"
import { Button } from "react-native-paper"

import { Screen, TicketList } from "../src/Screen"

export default function TicketsScreen() {
  return (
    <Screen title="Tickets">
      <TicketList />
      <Link href="/create-ticket" asChild><Button mode="contained">Create ticket</Button></Link>
    </Screen>
  )
}
