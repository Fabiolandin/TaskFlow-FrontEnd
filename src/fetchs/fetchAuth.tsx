import { apiClient } from "@/api/apiClient";

export const login = async (email: string, senha: string) => {
    return apiClient(`/auth/login`, {
        method: "POST",
        body: JSON.stringify({ email, senha }),
    });
};