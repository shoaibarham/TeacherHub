import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  FileText,
  BookOpen,
  FileCheck,
  FilePlus,
  FolderKanban,
  Users,
  FolderClosed,
  User,
  Settings,
  HelpCircle,
  School
} from "lucide-react";

interface SidebarProps {
  className?: string;
  isOpen: boolean;
}

interface SidebarNavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

const SidebarNavItem = ({ icon, label, href, active }: SidebarNavItemProps) => {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors",
          active && "text-primary bg-primary/10 font-medium"
        )}
      >
        <span className={cn("mr-3", active ? "text-primary" : "text-neutral-500")}>
          {icon}
        </span>
        <span>{label}</span>
      </a>
    </Link>
  );
};

interface NavSectionProps {
  title: string;
  children: React.ReactNode;
}

const NavSection = ({ title, children }: NavSectionProps) => {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 py-2">
        {title}
      </p>
      {children}
    </div>
  );
};

export default function Sidebar({ className, isOpen }: SidebarProps) {
  const [location] = useLocation();
  
  return (
    <aside
      className={cn(
        "bg-white w-64 border-r border-neutral-200 shadow-sm flex-shrink-0 transition-all duration-300 overflow-hidden h-screen fixed lg:static z-20 transform lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}
    >
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center space-x-2">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>TP</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">Sarah Parker</p>
            <p className="text-xs text-neutral-500">Science Teacher</p>
          </div>
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100vh-73px)]">
        <nav className="p-2">
          <NavSection title="Dashboard">
            <SidebarNavItem 
              icon={<LayoutDashboard size={18} />} 
              label="Overview" 
              href="/" 
              active={location === "/"} 
            />
            <SidebarNavItem 
              icon={<Clock size={18} />} 
              label="Recent Activity" 
              href="/activity" 
              active={location === "/activity"} 
            />
            <SidebarNavItem 
              icon={<CalendarDays size={18} />} 
              label="Calendar" 
              href="/calendar" 
              active={location === "/calendar"} 
            />
          </NavSection>
          
          <NavSection title="Content Creation">
            <SidebarNavItem 
              icon={<FileText size={18} />} 
              label="Notes" 
              href="/content/notes" 
              active={location === "/content/notes"} 
            />
            <SidebarNavItem 
              icon={<BookOpen size={18} />} 
              label="Quizzes" 
              href="/content/quiz" 
              active={location === "/content/quiz"} 
            />
            <SidebarNavItem 
              icon={<FileCheck size={18} />} 
              label="Assignments" 
              href="/content/assignment" 
              active={location === "/content/assignment"} 
            />
            <SidebarNavItem 
              icon={<FilePlus size={18} />} 
              label="Papers" 
              href="/content/paper" 
              active={location === "/content/paper"} 
            />
          </NavSection>
          
          <NavSection title="Organization">
            <SidebarNavItem 
              icon={<FolderKanban size={18} />} 
              label="Subject Management" 
              href="/subjects" 
              active={location === "/subjects"} 
            />
            <SidebarNavItem 
              icon={<Users size={18} />} 
              label="Class Management" 
              href="/classes" 
              active={location === "/classes"} 
            />
            <SidebarNavItem 
              icon={<FolderClosed size={18} />} 
              label="My Library" 
              href="/library" 
              active={location === "/library"} 
            />
          </NavSection>
          
          <NavSection title="Settings">
            <SidebarNavItem 
              icon={<User size={18} />} 
              label="Profile Settings" 
              href="/profile" 
              active={location === "/profile"} 
            />
            <SidebarNavItem 
              icon={<Settings size={18} />} 
              label="Account Settings" 
              href="/settings" 
              active={location === "/settings"} 
            />
            <SidebarNavItem 
              icon={<HelpCircle size={18} />} 
              label="Help & Support" 
              href="/help" 
              active={location === "/help"} 
            />
          </NavSection>
        </nav>
      </ScrollArea>
    </aside>
  );
}
