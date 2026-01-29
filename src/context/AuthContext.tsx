import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch } from '@/lib/api';

interface User {
    email: string;
    name: string;
    role: 'admin' | 'user' | 'viewer';
    token?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    isAdmin: boolean;
    canEdit: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load session from local storage
    useEffect(() => {
        const savedUser = localStorage.getItem('fuel_user');
        console.log("AuthProvider: Loading saved user...", savedUser ? "Found" : "Not Found");

        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser);
                // Hardened check: require email to consider session valid
                if (parsed && typeof parsed === 'object' && parsed.email) {
                    console.log("AuthProvider: Session valid for", parsed.email);
                    setUser(parsed);
                } else {
                    console.warn("AuthProvider: Session invalid or empty, clearing.");
                    localStorage.removeItem('fuel_user');
                }
            } catch (e) {
                console.error("AuthProvider: Error parsing user session", e);
                localStorage.removeItem('fuel_user');
            }
        }
        setIsLoading(false);
    }, []);

    // Auto-logout Logic (15 minutes inactivity)
    useEffect(() => {
        if (!user) return; // Only track while logged in

        const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 Minutos
        let timer: NodeJS.Timeout;

        const logoutInactive = () => {
            console.warn("Sesión cerrada por inactividad");
            // Use locally defined logout to avoid closure staleness if necessary, 
            // but calling state setter is safe.
            setUser(null);
            localStorage.removeItem('fuel_user');
            window.location.reload(); // Force reload to clear any sensitive state
        };

        const resetTimer = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(logoutInactive, INACTIVITY_LIMIT);
        };

        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
        events.forEach(event => document.addEventListener(event, resetTimer));

        // Initial start
        resetTimer();

        return () => {
            if (timer) clearTimeout(timer);
            events.forEach(event => document.removeEventListener(event, resetTimer));
        };
    }, [user]);

    const login = async (email: string, pass: string) => {
        try {
            // Backend Call
            // Note: We use a special fetch here or reuse apiFetch but we need a new service method
            const response = await apiFetch<User>('auth', 'login', {
                method: 'POST',
                body: { email, password: pass }
            });

            if (response.data) {
                setUser(response.data);
                localStorage.setItem('fuel_user', JSON.stringify(response.data));
                return true;
            }
            return false;
        } catch (error) {
            console.error("Login failed", error);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('fuel_user');
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            logout,
            isAdmin: user?.role === 'admin',
            canEdit: user?.role === 'admin' || user?.role === 'user'
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
