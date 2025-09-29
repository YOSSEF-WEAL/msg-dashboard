"use client";
import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Minimal wrapper so we can configure defaults in one place
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
