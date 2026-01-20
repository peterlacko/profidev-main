import type { ReactNode } from "react"

type Props = {
  children: ReactNode;
};

// This is a pass-through layout since the [locale] layout handles everything
export default function RootLayout({ children }: Props) {
  return children
}
