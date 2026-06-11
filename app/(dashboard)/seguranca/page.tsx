import Topbar from "@/components/topbar";
import ComingSoon from "@/components/coming-soon";

export default function SegurancaPage() {
  return (
    <>
      <Topbar title="Políticas de Segurança" subtitle="Segurança da informação e ISO 27001" />
      <div className="p-8 flex-1">
        <ComingSoon
          title="Políticas de Segurança"
          description="Normas de segurança da informação alinhadas ao ISO 27001. Integração com os contratos de scooteiras e acordos de confidencialidade."
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[30px] h-[30px]">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          }
        />
      </div>
    </>
  );
}
