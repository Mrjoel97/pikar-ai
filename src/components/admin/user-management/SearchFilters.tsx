import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface SearchFiltersProps {
  searchEmail: string;
  onSearchChange: (value: string) => void;
  filterTier: string;
  onTierChange: (value: string) => void;
  filterStatus: "active" | "inactive" | "all";
  onStatusChange: (value: "active" | "inactive" | "all") => void;
}

export function SearchFilters({
  searchEmail,
  onSearchChange,
  filterTier,
  onTierChange,
  filterStatus,
  onStatusChange,
}: SearchFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email or name..."
          value={searchEmail}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={filterTier} onValueChange={onTierChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Filter by tier" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Tiers</SelectItem>
          <SelectItem value="solopreneur">Solopreneur</SelectItem>
          <SelectItem value="startup">Startup</SelectItem>
          <SelectItem value="sme">SME</SelectItem>
          <SelectItem value="enterprise">Enterprise</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filterStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
