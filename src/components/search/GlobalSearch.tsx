import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Save, History, X, Filter } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");

  const results = useQuery(
    api.search.globalSearch,
    debouncedQuery.length >= 2
      ? { query: debouncedQuery, entityTypes: selectedTypes.length > 0 ? selectedTypes : undefined }
      : "skip"
  );

  const savedSearches = useQuery(api.search.getSavedSearches, {});
  const searchHistory = useQuery(api.search.getSearchHistory, { limit: 10 });

  const saveSearch = useMutation(api.search.saveSearch);
  const deleteSavedSearch = useMutation(api.search.deleteSavedSearch);
  const trackSearch = useMutation(api.search.trackSearch);

  const entityTypes = ["workflows", "contacts", "campaigns", "initiatives", "agents"];

  const handleSearch = (value: string) => {
    setQuery(value);
    setTimeout(() => {
      setDebouncedQuery(value);
      if (value.length >= 2) {
        trackSearch({
          query: value,
          entityTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
          resultCount: results?.length || 0,
        });
      }
    }, 300);
  };

  const handleSaveSearch = async () => {
    if (!saveName.trim() || !debouncedQuery) return;
    try {
      await saveSearch({
        name: saveName,
        query: debouncedQuery,
        entityTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
      });
      toast.success("Search saved");
      setShowSaveDialog(false);
      setSaveName("");
    } catch (error: any) {
      toast.error(error.message || "Failed to save search");
    }
  };

  const handleDeleteSaved = async (id: any) => {
    try {
      await deleteSavedSearch({ searchId: id });
      toast.success("Search deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete search");
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search across all entities..."
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowSaveDialog(true)}
          disabled={!debouncedQuery}
        >
          <Save className="h-4 w-4" />
        </Button>
      </div>

      {/* Entity Type Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {entityTypes.map((type) => (
          <Badge
            key={type}
            variant={selectedTypes.includes(type) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => toggleType(type)}
          >
            {type}
          </Badge>
        ))}
        {selectedTypes.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTypes([])}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Search Results */}
      {results && results.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            {results.length} results found
          </div>
          {results.map((result: any) => (
            <Card key={result.id} className="hover:border-emerald-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{result.type}</Badge>
                      <div className="font-medium">{result.title}</div>
                    </div>
                    {result.description && (
                      <div className="text-sm text-muted-foreground">
                        {result.description}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(result.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Saved Searches */}
      {savedSearches && savedSearches.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium flex items-center gap-2">
            <Save className="h-4 w-4" />
            Saved Searches
          </div>
          {savedSearches.map((saved: any) => (
            <Card key={saved._id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    setQuery(saved.query);
                    setDebouncedQuery(saved.query);
                    if (saved.entityTypes) setSelectedTypes(saved.entityTypes);
                  }}
                >
                  <div className="font-medium">{saved.name}</div>
                  <div className="text-xs text-muted-foreground">{saved.query}</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteSaved(saved._id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search History */}
      {searchHistory && searchHistory.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium flex items-center gap-2">
            <History className="h-4 w-4" />
            Recent Searches
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((item: any) => (
              <Badge
                key={item._id}
                variant="outline"
                className="cursor-pointer"
                onClick={() => {
                  setQuery(item.query);
                  setDebouncedQuery(item.query);
                  if (item.entityTypes) setSelectedTypes(item.entityTypes);
                }}
              >
                {item.query} ({item.resultCount})
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Save Search Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Search Name</label>
              <Input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g., Active Workflows"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Query: <span className="font-medium">{debouncedQuery}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSearch} disabled={!saveName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
