"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" aria-label="Toggle theme" disabled>
        Theme
      </Button>
    );
  }

  const isDark = (resolvedTheme ?? theme) === "dark";

  return (
    <Button
      variant="outline"
      size="sm"
      aria-label="Toggle light and dark mode"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span className="ml-2 hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
    </Button>
  );
}
