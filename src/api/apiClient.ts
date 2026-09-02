//Le a variavel da .env
const API_URL = import.meta.env.VITE_API_URL;

export async function apiClient<T>(
    //Só a parte que muda
    endpoint: string,

    //Method's body e etc
    options: RequestInit = {}

): Promise<T> {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        //Header padrão dos fetchs
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    //só trata como "sessão expirada" se a requisição já tinha um token (ex: /auth/login com senha errada não deve forçar reload)
    if (res.status === 401 && token) {
        localStorage.removeItem("token"); //remove o token do localstorage
        window.location.href = "/login"; //força um reload para a pagina de login
        throw new Error("Sessão expirada");
      }

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Erro na requisição: ${res.status}`);
    }

    if (res.status === 204) return null as T;

    const text = await res.text();
    return text ? JSON.parse(text) : (null as T);
}
