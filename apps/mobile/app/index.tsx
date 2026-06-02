import { Link } from "expo-router"
import { Button } from "react-native-paper"

import { Screen, StatCard, TicketList, styles } from "../src/Screen"

export default function HomeScreen() {
  return (
    <Screen title="Home">
      <StatCard label="Recent tickets" value="3" />
      <TicketList />
      <Link href="/ai-chat" asChild><Button mode="contained">Start support request</Button></Link>
      <Link href="/callback-request" asChild><Button mode="outlined">Request callback</Button></Link>
    </Screen>
  )
}
