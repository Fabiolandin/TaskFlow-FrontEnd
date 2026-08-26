import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-[#0B0C0E]">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-6">
                {children}
            </main>
        </div>
    );
}
