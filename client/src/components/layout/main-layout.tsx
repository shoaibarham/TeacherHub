import React, { useState, useEffect } from "react";
import Header from "./header";
import Sidebar from "./sidebar";
import { CreateContentModal } from "@/components/modals/create-content-modal";

interface MainLayoutProps {
  children: React.ReactNode;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export default function MainLayout({ 
  children, 
  sidebarOpen, 
  toggleSidebar 
}: MainLayoutProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [overlay, setOverlay] = useState(false);
  
  // Handle mobile sidebar overlay
  useEffect(() => {
    if (sidebarOpen) {
      setOverlay(true);
    } else {
      setOverlay(false);
    }
  }, [sidebarOpen]);
  
  // Close sidebar when clicking overlay
  const handleOverlayClick = () => {
    toggleSidebar();
  };
  
  // Pass the modal open state from children to parent
  const handleCreateContent = () => {
    setIsModalOpen(true);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header onSidebarToggle={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} />
        
        {/* Overlay for mobile sidebar */}
        {overlay && (
          <div 
            className="fixed inset-0 bg-neutral-900 bg-opacity-30 z-10 lg:hidden"
            onClick={handleOverlayClick}
          />
        )}
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* Clone children and inject openCreateModal prop */}
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, { openCreateModal: handleCreateContent } as any);
            }
            return child;
          })}
        </main>
      </div>
      
      <CreateContentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
