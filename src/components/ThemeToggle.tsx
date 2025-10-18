import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme, type Theme } from "@/components/ThemeProvider";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const nextTheme: Theme = theme === "light" ? "dark" : theme === "dark" ? "light" : (matchMedia("(prefers-color-scheme: dark)").matches ? "light" : "dark");

  return (
    <Button
      aria-label="Toggle color scheme"
      title="Toggle color scheme"
      variant="outline"
      size="icon"
      onClick={() => setTheme(nextTheme)}
      className="backdrop-blur-sm"
    >
      <Sun className="h-4 w-4 hidden dark:block" />
      <Moon className="h-4 w-4 dark:hidden" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
