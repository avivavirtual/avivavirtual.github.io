import type { ReactNode } from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import { Button, Card, Chip, List, Text, TextInput } from "react-native-paper"

export function Screen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text variant="headlineMedium" style={styles.title}>{title}</Text>
      {children}
    </ScrollView>
  )
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="labelMedium">{label}</Text>
        <Text variant="headlineSmall">{value}</Text>
      </Card.Content>
    </Card>
  )
}

export function TicketList() {
  return (
    <Card style={styles.card}>
      <List.Item title="Billing question" description="HIGH - due in 2h" left={props => <List.Icon {...props} icon="ticket" />} />
      <List.Item title="Callback request" description="MEDIUM - French" left={props => <List.Icon {...props} icon="phone" />} />
      <List.Item title="Password reset" description="URGENT - waiting" left={props => <List.Icon {...props} icon="lock" />} />
    </Card>
  )
}

export function ChatThread() {
  return (
    <View style={styles.stack}>
      <Chip>Customer: I need support.</Chip>
      <Chip selected>AI: I found an approved policy.</Chip>
      <Chip>Support: I added the review notes.</Chip>
      <TextInput mode="outlined" label="Message" multiline />
      <Button mode="contained">Send</Button>
    </View>
  )
}

export const styles = StyleSheet.create({
  page: { padding: 18, gap: 14, backgroundColor: "#F8FAFC", minHeight: "100%" },
  title: { fontWeight: "700", color: "#0F172A" },
  card: { borderRadius: 8, backgroundColor: "white" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stack: { gap: 12 }
})
