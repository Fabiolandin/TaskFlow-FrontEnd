import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "./ui/button";

//recolhe ou mostra o painel de propriedades; a escolha é a mesma no projeto e na tarefa (RF-60)
const BotaoPainel = ({ recolhido, onAlternar }: { recolhido: boolean; onAlternar: () => void }) => (
    <Button variant="ghost" size="icon-sm" aria-label={recolhido ? "Mostrar painel" : "Recolher painel"} title={recolhido ? "Mostrar painel" : "Recolher painel"}
        className="text-[#8A9098]" onClick={onAlternar}>
        {recolhido ? <PanelRightOpen aria-hidden="true" /> : <PanelRightClose aria-hidden="true" />}
    </Button>
);

export default BotaoPainel;
