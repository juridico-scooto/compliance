import Topbar from "@/components/topbar";
import ComingSoon from "@/components/coming-soon";

export default function TreinamentosPage() {
  return (
    <>
      <Topbar title="Treinamentos" subtitle="Módulos de compliance para scooteiras" />
      <div className="p-8 flex-1">
        <ComingSoon
          title="Treinamentos para Scooteiras"
          description="Módulos de LGPD, anticorrupção, segurança da informação e código de conduta. Separado da Scooto Academy — foco exclusivo em compliance interno."
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[30px] h-[30px]">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          }
        />
      </div>
    </>
  );
}
