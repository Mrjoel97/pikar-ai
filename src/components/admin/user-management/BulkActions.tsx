import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Download, UserCheck, UserX, Award, ArrowUpDown } from "lucide-react";

interface BulkActionsProps {
  selectedCount: number;
  totalUsers: number;
  onSelectAll: () => void;
  onEmailClick: () => void;
  onBulkActivate: () => void;
  onBulkDeactivate: () => void;
  onBulkUpdateTier: (tier: string) => void;
  onExport: () => void;
  sortBy: "email" | "name" | "tier" | "createdAt";
  onSortByChange: (value: "email" | "name" | "tier" | "createdAt") => void;
  sortOrder: "asc" | "desc";
  onToggleSortOrder: () => void;
}

export function BulkActions({
  selectedCount,
  totalUsers,
  onSelectAll,
  onEmailClick,
  onBulkActivate,
  onBulkDeactivate,
  onBulkUpdateTier,
  onExport,
  sortBy,
  onSortByChange,
  sortOrder,
  onToggleSortOrder,
}: BulkActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center justify-between">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={onSelectAll}
          disabled={totalUsers === 0}
        >
          {selectedCount === totalUsers ? "Deselect All" : "Select All"}
        </Button>
        <Button 
          disabled={selectedCount === 0}
          onClick={onEmailClick}
        >
          <Mail className="h-4 w-4 mr-2" />
          Email ({selectedCount})
        </Button>
        <Button
          variant="outline"
          disabled={selectedCount === 0}
          onClick={onBulkActivate}
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Activate
        </Button>
        <Button
          variant="outline"
          disabled={selectedCount === 0}
          onClick={onBulkDeactivate}
        >
          <UserX className="h-4 w-4 mr-2" />
          Deactivate
        </Button>
        <Select 
          disabled={selectedCount === 0}
          onValueChange={onBulkUpdateTier}
        >
          <SelectTrigger className="w-[160px]">
            <Award className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Update Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solopreneur">Solopreneur</SelectItem>
            <SelectItem value="startup">Startup</SelectItem>
            <SelectItem value="sme">SME</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={onExport}
          disabled={totalUsers === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
      
      <div className="flex gap-2 items-center">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Join Date</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="tier">Tier</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleSortOrder}
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground">
          {sortOrder === "asc" ? "↑" : "↓"}
        </span>
      </div>
    </div>
  );
}
