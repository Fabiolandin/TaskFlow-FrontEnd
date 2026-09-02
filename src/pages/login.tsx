import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/fetchs/fetchAuth";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const Login = () => {
    //state para receber email, senha e o loading
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    //desestructuring com renomeação para não confundir com a função login do fetch e puxando somente a função login do auth
    const { login: setAuthToken } = useAuth();

    //para redirecionamento
    const navigate = useNavigate();

    const handleLogin = async (e) => {
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
        <div className="flex h-screen items-center justify-center bg-[#0B0C0E]">
            <Card className="w-full max-w-sm bg-[#0E1012] border border-white/10">
                <CardHeader>
                    <CardTitle className="text-white">Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <Input
                            className="bg-[#0B0C0E] border border-white/10 text-white placeholder:text-zinc-400"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Input
                            className="bg-[#0B0C0E] border border-white/10 text-white placeholder:text-zinc-400"
                            type="password"
                            placeholder="Senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                        />
                        <Button className="bg-blue-500 hover:bg-blue-600" type="submit" disabled={isLoading}>
                            {isLoading ? "Entrando..." : "Entrar"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;