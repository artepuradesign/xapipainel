
import React from 'react';
import SidebarMenu from './sidebar/SidebarMenu';
import { SidebarItem } from './types';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileMenuOpen: boolean;
  filteredItems: SidebarItem[];
  location: any;
  isMobile: boolean;
  isTablet: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isSubmenuActive: (subItems?: SidebarItem[]) => boolean;
  handleSubItemClick: (subItem: SidebarItem) => void;
}

const Sidebar = ({
  collapsed,
  setCollapsed,
  mobileMenuOpen,
  filteredItems,
  location,
  isMobile,
  isTablet,
  setMobileMenuOpen,
  isSubmenuActive,
  handleSubItemClick
}: SidebarProps) => {
  const handleSidebarClick = () => {
    // Em tablets, clicar na sidebar colapsada expande e fixa
    if (isTablet && collapsed) {
      setCollapsed(false);
    }
  };

  return (
    <aside 
      className={`
        ${isMobile ? 'fixed mobile-sidebar' : 'relative'} 
        ${isMobile && !mobileMenuOpen ? 'hidden' : 'block'} 
        h-full 
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-20' : 'w-64'}
        ${isMobile ? '' : 'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700'} 
        flex flex-col
        z-30
        ${collapsed ? 'cursor-pointer' : ''}
      `}
      onClick={handleSidebarClick}
    >
      {/* Menu Items */}
      <SidebarMenu
        filteredItems={filteredItems}
        location={location}
        collapsed={collapsed}
        isMobile={isMobile}
        isTablet={isTablet}
        setMobileMenuOpen={setMobileMenuOpen}
        isSubmenuActive={isSubmenuActive}
        handleSubItemClick={handleSubItemClick}
        setCollapsed={setCollapsed}
      />
    </aside>
  );
};

export default Sidebar;
