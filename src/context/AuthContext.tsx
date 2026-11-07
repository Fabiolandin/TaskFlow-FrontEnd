import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";

import { lerUsuarioDoToken, type UsuarioLogado } from "@/utils/token";

interface AuthContextType {
    token: string | null;
    usuario: UsuarioLogado | null;
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
    const [token, setToken] = useState<string | null>(() => {
        const salvo = localStorage.getItem("token");
        //token ilegível não serve: sai da sessão e o ProtectedRoute leva ao login
        return lerUsuarioDoToken(salvo) ? salvo : null;
    });

    //ativa toda vez que o token atualiza, se tiver token salva se não tiver remove
    useEffect(() => {
        if (token) {
            localStorage.setItem("token", token);
        } else {
            localStorage.removeItem("token");
        }
    }, [token]);

    const usuario = useMemo(() => lerUsuarioDoToken(token), [token]);

    const login = (novoToken: string) => {
        setToken(lerUsuarioDoToken(novoToken) ? novoToken : null);
    };

    const logout = () => {
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, usuario, login, logout, isAuthenticated: !!token && !!usuario }}>
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
