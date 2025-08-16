
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MoreModuleProps {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: string;
  onClick: (moduleId: string) => void;
}

export function MoreModule({ id, name, description, icon: Icon, category, onClick }: MoreModuleProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick(id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
            <span className="inline-block px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded mt-2">
              {category}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
