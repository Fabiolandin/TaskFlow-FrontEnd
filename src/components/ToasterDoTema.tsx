import { Toaster } from "sonner";
import { resolverTema, useTema } from "@/utils/tema";

//os avisos acompanham o tema do app (RF-69)
const ToasterDoTema = () => {
    const [tema] = useTema();
    return <Toaster theme={resolverTema(tema) === "claro" ? "light" : "dark"} />;
};

export default ToasterDoTema;
