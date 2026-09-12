import { apiClient } from "@/api/apiClient";
import type { LoginResponse } from "@/pages/login";

export const login = async (email: string, senha: string) => {
    return apiClient<LoginResponse>(`/auth/login`, {
        method: "POST",
        body: JSON.stringify({ email, senha }),
    });
};