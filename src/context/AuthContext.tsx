import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface AuthContextType {
    token: string | null;
    login: (novoToken: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    //lendo o token do localstorage para que o reload continue logado
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

    //ativa toda vez que o token atualiza, se tiver token salva se não tiver remove
    useEffect(() => {
        if (token) {
            localStorage.setItem("token", token);
        } else {
            localStorage.removeItem("token");
        }
    }, [token]);

    const login = (novoToken: string) => {
        setToken(novoToken);
    };

    const logout = () => {
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth precisa ser usado dentro de um AuthProvider");
    }

    return context;
};
