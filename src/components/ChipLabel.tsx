//chip de label (RF-77): texto na cor da label e fundo com 16% dela sobre o fundo do tema; sem cor, tom neutro
interface ChipLabelProps {
    label: { id: number; nome: string; cor?: string | null };
    className?: string;
}

const ChipLabel = ({ label, className = "" }: ChipLabelProps) => (
    <span
        data-label={label.id}
        className={`inline-flex max-w-full shrink-0 items-center truncate rounded-chip px-[7px] py-[3px] text-[10.5px] leading-none ${className}`}
        style={label.cor
            ? { color: label.cor, background: `color-mix(in srgb, ${label.cor} 16%, var(--tf-fundo))` }
            : { color: "var(--tf-tom-neutro-texto)", background: "var(--tf-tom-neutro-fundo)" }}
    >
        {label.nome}
    </span>
);

export default ChipLabel;
