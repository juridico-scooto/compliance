import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/topbar";
import CNPJSearchForm from "@/components/cnpj-search-form";

export default async function DueDiligencePage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/acesso-negado");

  return (
    <>
      <Topbar
        title="Consulta de Cliente"
        subtitle="Verificação cadastral e due diligence regulatória"
      />
      <div className="p-8 flex-1">
        <CNPJSearchForm />
      </div>
    </>
  );
}
