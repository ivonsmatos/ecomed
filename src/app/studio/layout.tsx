import { type ReactNode } from "react";

// O Studio precisa de height: 100vh e não deve herdar o layout global
export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
