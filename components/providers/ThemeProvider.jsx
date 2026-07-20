"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
    theme: "light",
    toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }) {
    const [theme, setTheme] = useState("light");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Run once on mount to get the stored theme
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme === "dark" || (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
            setTheme("dark");
            document.documentElement.classList.add("dark");
        } else {
            setTheme("light");
            document.documentElement.classList.remove("dark");
        }
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        if (theme === "light") {
            setTheme("dark");
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            setTheme("light");
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <div className={!mounted ? "invisible" : ""}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
}
