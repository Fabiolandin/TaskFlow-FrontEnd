import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/fetchs/fetchAuth";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export interface LoginUser {
    email: string;
    senha: string;
}

export interface LoginResponse {
    access_token: string;
}

const Login = () => {
    //state para receber email, senha e o loading
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    //desestructuring com renomeação para não confundir com a função login do fetch e puxando somente a função login do auth
    const { login: setAuthToken } = useAuth();

    //para redirecionamento
    const navigate = useNavigate();

    const handleLogin = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const resposta = await login(email, senha);
            setAuthToken(resposta.access_token);
            toast.success("Login realizado com sucesso!");
            navigate("/");
        } catch (error) {
            toast.error("Email ou senha inválidos");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-fundo">
            <Card className="w-full max-w-sm bg-superficie border border-texto/10">
                <CardHeader>
                    <CardTitle className="text-texto">Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <Input
                            className="bg-fundo border border-texto/10 text-texto placeholder:text-texto-suave"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Input
                            className="bg-fundo border border-texto/10 text-texto placeholder:text-texto-suave"
                            type="password"
                            placeholder="Senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                        />
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Entrando..." : "Entrar"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;