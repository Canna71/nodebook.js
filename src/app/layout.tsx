import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/sonner"

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset
                className="size-full lg:peer-data-[state=collapsed]:max-w-[calc(100vw-var(--sidebar-width-icon))] peer-data-[state=expanded]:max-w-[calc(100vw-var(--sidebar-width))]"
            >
                {/* Main content - SidebarTrigger now integrated in Toolbar */}
                {children}
            </SidebarInset>
            <Toaster 
                position="bottom-right"
                expand={false}
                closeButton
            />
        </SidebarProvider>
    )
}