import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/sonner"

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset
                className="size-full lg:peer-data-[state=collapsed]:max-w-[calc(100vw-var(--sidebar-width-icon))] peer-data-[state=expanded]:max-w-[calc(100vw-var(--sidebar-width))]"
            >
                {/* SidebarTrigger positioned relative to the content area */}
                <div className="absolute top-2 left-2 z-50">
                    <SidebarTrigger className="bg-background/80 backdrop-blur-sm border shadow-md hover:bg-background/90" />
                </div>
                
                {/* Main content without trigger taking space */}
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