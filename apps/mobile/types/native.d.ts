declare module "expo-router" {
  import type { ReactNode } from "react"

  export function Link(props: { href: string; asChild?: boolean; children: ReactNode }): JSX.Element
  export function Stack(props: { screenOptions?: Record<string, unknown> }): JSX.Element
}

declare module "react-native" {
  import type { ComponentType, ReactNode } from "react"

  export const ScrollView: ComponentType<{ contentContainerStyle?: unknown; children?: ReactNode }>
  export const View: ComponentType<{ style?: unknown; children?: ReactNode }>
  export const StyleSheet: {
    create<T extends Record<string, unknown>>(styles: T): T
  }
}

declare module "react-native-paper" {
  import type { ComponentType, ReactNode } from "react"

  type BaseProps = { children?: ReactNode; style?: unknown }
  type ButtonProps = BaseProps & { mode?: "text" | "outlined" | "contained"; onPress?: () => void }
  type TextProps = BaseProps & { variant?: string }
  type TextInputProps = BaseProps & { mode?: "flat" | "outlined"; label?: string; defaultValue?: string; secureTextEntry?: boolean; multiline?: boolean }
  type ListIconProps = { color?: string; style?: unknown }
  type ListItemProps = { title: string; description?: string; left?: (props: ListIconProps) => ReactNode }

  export const Button: ComponentType<ButtonProps>
  export const Card: ComponentType<BaseProps> & { Content: ComponentType<BaseProps> }
  export const Chip: ComponentType<BaseProps & { selected?: boolean }>
  export const List: { Item: ComponentType<ListItemProps>; Icon: ComponentType<ListIconProps & { icon: string }> }
  export const PaperProvider: ComponentType<BaseProps>
  export const Text: ComponentType<TextProps>
  export const TextInput: ComponentType<TextInputProps>
}
