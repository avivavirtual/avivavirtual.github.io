import { Link } from "expo-router"
import { Button, Card, List } from "react-native-paper"

import { Screen } from "../src/Screen"

export default function AgentInboxScreen() {
  return (
    <Screen title="Support Inbox">
      <Card><List.Item title="Jordan Lee" description="Open support request" /></Card>
      <Link href="/agent-conversation" asChild><Button mode="contained">Open request</Button></Link>
    </Screen>
  )
}
