"use client";

import { useState, useEffect, createContext, useContext } from "react";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const checkAuthStatus = async () => {
        try {
            const res = await fetch("/api/auth/me", { credentials: "include" });

            if (res.ok) {
                const data = await res.json();
                let userData = data.user || data;
                if (userData && userData.role) userData.role = userData.role.toLowerCase();
                setUser(userData);
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
                // Clear cookie if auth check fails to prevent middleware redirect loops
                fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
            }
        } catch (err) {
            console.error("Auth status check failed:", err);
            setUser(null);
            setIsAuthenticated(false);
            fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const login = async (email, password) => {
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password }),
                credentials: "include"
            });

            if (!res.ok) {
                const errorData = await res.json();
                return { success: false, error: errorData.message || "Login failed" };
            }

            const data = await res.json();
            let userData = data.user || data;
            if (userData && userData.role) userData.role = userData.role.toLowerCase();
            setUser(userData);
            setIsAuthenticated(true);
            return { success: true, ...data };
        } catch (error) {
            return { success: false, error: "Network error occurred." };
        }
    };

    const register = async (email, password, name) => {
        try {
            const res = await fetch("/api/register", { 
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password, name }),
                credentials: "include"
            });

            if (!res.ok) {
                const errorData = await res.json();
                return { success: false, error: errorData.message || "Register failed" };
            }

            const data = await res.json();
            let userData = data.user || data;
            if (userData && userData.role) userData.role = userData.role.toLowerCase();
            setUser(userData);
            setIsAuthenticated(true);
            return { success: true, ...data };
        } catch (error) {
            return { success: false, error: "Network error occurred." };
        }
    };

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include"
            });
        } catch (err) {
            console.error("Logout request failed:", err);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, checkAuthStatus, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const Context = useContext(AuthContext);
    if (!Context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return Context;
};
