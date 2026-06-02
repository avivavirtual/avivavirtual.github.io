import { Button, Card, Text } from "react-native-paper"

import { Screen } from "../src/Screen"

export default function TicketDetailScreen() {
  return (
    <Screen title="Ticket Detail">
      <Card><Card.Content><Text>SLA: 2h 10m</Text><Text>Billing clarification and callback needed.</Text></Card.Content></Card>
      <Button mode="contained">Add comment</Button>
    </Screen>
  )
}
