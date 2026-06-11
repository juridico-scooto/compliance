import Sidebar from "@/components/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className="flex-1 flex flex-col min-h-screen"
        style={{ marginLeft: "var(--sidebar-w)" }}
      >
        {children}
      </main>
    </div>
  );
}
