import Topbar from "@/components/topbar";
import ComingSoon from "@/components/coming-soon";

export default function PoliticasPage() {
  return (
    <>
      <Topbar title="Políticas de Compliance" subtitle="Documentos normativos internos da Scooto" />
      <div className="p-8 flex-1">
        <ComingSoon
          title="Políticas de Compliance"
          description="Repositório central das políticas internas da Scooto. Acesso por perfil: time jurídico para gestão, scooteiras para leitura e aceite formal."
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[30px] h-[30px]">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          }
        />
      </div>
    </>
  );
}
