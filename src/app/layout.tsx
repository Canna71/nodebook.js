import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/sonner"
import { ViewProvider } from "@/Engine/ViewProvider"
import { FeatureFlags } from "@/config/features"

export default function Layout({ children }: { children: React.ReactNode }) {
    if (!FeatureFlags.SIDEBAR_ENABLED) {
        // Simple layout without sidebar - using same base classes as SidebarInset
        return (
            <ViewProvider>
                <main className="bg-background relative flex w-full flex-1 flex-col size-full">
                    {children}
                </main>
                <Toaster 
                    position="bottom-right"
                    expand={false}
                    closeButton
                />
            </ViewProvider>
        );
    }

    // Full layout with sidebar (when enabled)
    return (
        <ViewProvider>
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
        </ViewProvider>
    )
}