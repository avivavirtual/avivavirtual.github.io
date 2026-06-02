import { Button, Card, Text } from "react-native-paper"

import { Screen } from "../src/Screen"

export default function AgentTicketDetailScreen() {
  return (
    <Screen title="Agent Ticket">
      <Card><Card.Content><Text>Assigned ticket with internal notes and SLA status.</Text></Card.Content></Card>
      <Button mode="contained">Resolve</Button>
    </Screen>
  )
}
