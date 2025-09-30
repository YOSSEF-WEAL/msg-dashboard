"use client";

import {
  ChevronUp,
  LayoutDashboard,
  Inbox,
  Building2,
  ShieldPlus ,
  Settings,
  User2,

} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/logout";
import { useAuth } from "@/components/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Sessions",
    url: "/sessions",
    icon: ShieldPlus ,
  },
  {
    title: "Company",
    url: "/company",
    icon: Building2,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
];

export default function AppSidebar() {
  const router = useRouter();
  const { user, loading } = useAuth();



  async function handleLogout() {
    const { error } = await logout();
    router.push("/auth/login");
    router.refresh();
  }

  const displayName = user?.user_metadata?.full_name
    || (user?.email ? user.email.split("@")[0] : null)
    || "Account";
  const avatarUrl: string | undefined = (user?.user_metadata?.avatar_url as string | undefined)
    || (user?.user_metadata?.picture as string | undefined)
    || undefined;
  const initials = (displayName?.[0] || "U").toUpperCase();



  
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/">
                <Image
                  src="/logo.png"
                  alt="logo"
                  width={30}
                  height={30}
                />
                MSG-Dashboard
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.title === "Inbox" && (
                    <SidebarMenuBadge>24</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton asChild>
                  <button type="button">
                    {user ? (
                      <>
                        <Avatar className="size-6">
                          <AvatarImage className="" src={avatarUrl} alt={displayName} />
                          <AvatarFallback className="">{initials}</AvatarFallback>
                        </Avatar>
                        <span>{displayName}</span>
                        <ChevronUp className="ml-auto" />
                      </>
                    ) : (
                      <>
                        <User2 />
                        <span>Account</span>
                        <ChevronUp className="ml-auto" />
                      </>
                    )}
                  </button>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={10}>
                {user && (
                  <>
                    <Link href="/account">
                    <DropdownMenuItem>Account</DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem
                  className=""
                  inset={false}
                  variant="destructive"
                  disabled={loading}
                  onSelect={(e) => {
                    e.preventDefault();
                    if (!loading) {
                      handleLogout();
                    }
                  }}
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}