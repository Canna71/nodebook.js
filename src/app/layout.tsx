import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
// https://achromatic.dev/blog/shadcn-sidebar
export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="w-full h-full">
                <SidebarTrigger />
                {children}
            </main>

        </SidebarProvider>
    )
}