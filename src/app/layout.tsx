import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset
                className="size-full lg:peer-data-[state=collapsed]:max-w-[calc(100vw-var(--sidebar-width-icon))] peer-data-[state=expanded]:max-w-[calc(100vw-var(--sidebar-width))]"
            >
                {/* <main className="w-full overflow-auto"> */}
                    <SidebarTrigger />
                    {children}
                {/* </main> */}
            </SidebarInset>

        </SidebarProvider>
    )
}