import { Card, List } from "react-native-paper"

import { Screen } from "../src/Screen"

export default function NotificationsScreen() {
  return (
    <Screen title="Notifications">
      <Card><List.Item title="Ticket updated" description="Billing question moved to IN_PROGRESS" /></Card>
      <Card><List.Item title="Transcript ready" description="Call summary is available" /></Card>
    </Screen>
  )
}
