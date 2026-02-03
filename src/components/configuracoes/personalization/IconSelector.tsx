
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { 
  Package, Search, User, Building, Car, FileText, Shield, TrendingUp, 
  Camera, Phone, Mail, MapPin, Heart, Star, Calendar, Clock, 
  Settings, Database, Cloud, Lock, Key, Eye, Download, Upload,
  BarChart, PieChart, LineChart, Edit, Trash, Plus, Check, X,
  Home, Globe, Zap, Target, Award, Gift, Flag, Bell, MessageCircle
} from 'lucide-react';

interface IconSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const IconSelector = ({ value, onChange, label = "Ícone" }: IconSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const availableIcons = [
    { name: 'Package', component: Package },
    { name: 'Search', component: Search },
    { name: 'User', component: User },
    { name: 'Building', component: Building },
    { name: 'Car', component: Car },
    { name: 'FileText', component: FileText },
    { name: 'Shield', component: Shield },
    { name: 'TrendingUp', component: TrendingUp },
    { name: 'Camera', component: Camera },
    { name: 'Phone', component: Phone },
    { name: 'Mail', component: Mail },
    { name: 'MapPin', component: MapPin },
    { name: 'Heart', component: Heart },
    { name: 'Star', component: Star },
    { name: 'Calendar', component: Calendar },
    { name: 'Clock', component: Clock },
    { name: 'Settings', component: Settings },
    { name: 'Database', component: Database },
    { name: 'Cloud', component: Cloud },
    { name: 'Lock', component: Lock },
    { name: 'Key', component: Key },
    { name: 'Eye', component: Eye },
    { name: 'Download', component: Download },
    { name: 'Upload', component: Upload },
    { name: 'BarChart', component: BarChart },
    { name: 'PieChart', component: PieChart },
    { name: 'LineChart', component: LineChart },
    { name: 'Edit', component: Edit },
    { name: 'Trash', component: Trash },
    { name: 'Plus', component: Plus },
    { name: 'Check', component: Check },
    { name: 'X', component: X },
    { name: 'Home', component: Home },
    { name: 'Globe', component: Globe },
    { name: 'Zap', component: Zap },
    { name: 'Target', component: Target },
    { name: 'Award', component: Award },
    { name: 'Gift', component: Gift },
    { name: 'Flag', component: Flag },
    { name: 'Bell', component: Bell },
    { name: 'MessageCircle', component: MessageCircle }
  ];

  const selectedIcon = availableIcons.find(icon => icon.name === value);
  const SelectedIconComponent = selectedIcon?.component || Package;

  const handleIconSelect = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
  };

  return (
    <div className="w-full">
      <Label>{label}</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 h-10"
            type="button"
          >
            <SelectedIconComponent className="h-4 w-4" />
            <span>{selectedIcon?.name || 'Selecionar ícone'}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-3">
            <div className="text-sm font-medium">Selecione um ícone</div>
            <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto">
              {availableIcons.map((icon) => {
                const IconComponent = icon.component;
                const isSelected = value === icon.name;
                
                return (
                  <Button
                    key={icon.name}
                    variant={isSelected ? "default" : "ghost"}
                    size="sm"
                    className="h-10 w-10 p-0"
                    onClick={() => handleIconSelect(icon.name)}
                    type="button"
                    title={icon.name}
                  >
                    <IconComponent className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>
            {selectedIcon && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Badge variant="secondary" className="gap-1">
                  <SelectedIconComponent className="h-3 w-3" />
                  {selectedIcon.name}
                </Badge>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default IconSelector;
