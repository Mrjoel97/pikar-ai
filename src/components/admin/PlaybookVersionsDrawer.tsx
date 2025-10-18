import React from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export function PlaybookVersionsDrawer({
  open,
  onOpenChange,
  playbookKey,
  versions,
  onRestore,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playbookKey: string;
  versions: any[];
  onRestore: (versionId: string) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>Playbook Versions {playbookKey && `— ${playbookKey}`}</DrawerTitle>
        </DrawerHeader>
        <div className="max-h-[50vh] overflow-y-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(versions || []).map((v: any) => (
                <TableRow key={String(v._id)}>
                  <TableCell className="font-mono text-sm">{v.version}</TableCell>
                  <TableCell>{new Date(v.createdAt || v._creationTime || Date.now()).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRestore(String(v._id))}
                    >
                      Restore
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end mt-3">
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
