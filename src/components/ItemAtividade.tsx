import { fraseDaAtividade, type Atividade } from "@/fetchs/fetchAtividades";
import { formatarDataHora } from "@/utils/formaters/fdata";
import { dataRelativa } from "@/utils/dataRelativa";

//linha discreta do histórico (RF-55): sem avatar nem ações; a data completa ao passar o mouse
const ItemAtividade = ({ atividade }: { atividade: Atividade }) => (
    <div data-testid="atividade" data-campo={atividade.campo} className="flex flex-row items-center gap-3 pl-[7px] text-[12px] text-texto-fraco">
        <span aria-hidden="true" className="size-[13px] shrink-0 rounded-full border border-borda-forte bg-superficie" />
        <span data-frase className="min-w-0 truncate">{fraseDaAtividade(atividade)}</span>
        <time dateTime={atividade.createdAt} title={formatarDataHora(atividade.createdAt)} className="shrink-0 text-placeholder">{dataRelativa(atividade.createdAt)}</time>
    </div>
);

export default ItemAtividade;
