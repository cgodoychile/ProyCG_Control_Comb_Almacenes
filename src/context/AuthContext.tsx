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
