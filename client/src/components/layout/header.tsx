import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Bell, Search, ChevronDown, School } from "lucide-react";
import { useLocation } from 'wouter';
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onSidebarToggle: () => void;
}

export default function Header({ onSidebarToggle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSignOut = () => {
    // In a real app, we would make an API call to sign out from the server
    console.log('Signing out...');
    
    // For now, just simulate a sign-out with a toast notification
    toast({
      title: "Signed out successfully",
      description: "You have been signed out of your account.",
    });
    
    // Redirect to login page (or home in this case)
    setTimeout(() => setLocation('/'), 1000);
  };
  
  return (
    <header className="bg-white shadow z-10 sticky top-0">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 lg:hidden text-neutral-600"
            onClick={onSidebarToggle}
          >
            <Menu size={20} />
          </Button>
          <h1 className="font-heading text-xl text-primary font-bold flex items-center">
            <School className="mr-2 text-primary" />
            EduCreator
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Input 
              type="text" 
              placeholder="Search content..." 
              className="w-48 lg:w-64 pl-9 h-9"
            />
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
          </div>
          
          <div className="flex items-center" ref={notificationsRef}>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-neutral-50 hover:bg-neutral-100 relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={18} className="text-neutral-600" />
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                3
              </span>
            </Button>
            
            {showNotifications && (
              <div className="absolute right-4 top-12 w-80 bg-white rounded-lg shadow-lg border border-neutral-200 z-50">
                <div className="p-3 border-b border-neutral-200">
                  <h3 className="font-medium">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <div className="p-3 border-b border-neutral-100 hover:bg-neutral-50">
                    <p className="text-sm font-medium">New comment on your quiz</p>
                    <p className="text-xs text-neutral-500 mt-1">John added a comment to your Algebra quiz</p>
                    <p className="text-xs text-neutral-400 mt-1">5 minutes ago</p>
                  </div>
                  <div className="p-3 border-b border-neutral-100 hover:bg-neutral-50">
                    <p className="text-sm font-medium">Content shared with class</p>
                    <p className="text-xs text-neutral-500 mt-1">Your Physics notes were shared with 10th grade</p>
                    <p className="text-xs text-neutral-400 mt-1">2 hours ago</p>
                  </div>
                  <div className="p-3 hover:bg-neutral-50">
                    <p className="text-sm font-medium">Assignment submissions</p>
                    <p className="text-xs text-neutral-500 mt-1">15 students submitted the Biology assignment</p>
                    <p className="text-xs text-neutral-400 mt-1">Yesterday</p>
                  </div>
                </div>
                <div className="p-2 border-t border-neutral-200 text-center">
                  <Button variant="link" className="text-primary text-sm">
                    View all notifications
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>SP</AvatarFallback>
                </Avatar>
                <span className="ml-1 font-medium text-sm hidden md:inline">Sarah Parker</span>
                <ChevronDown size={16} className="text-neutral-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="cursor-pointer">
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-500" onClick={handleSignOut}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
