import React from "react";
import { Plus, X, Search, HelpCircle, Lightbulb, Trash2 } from "lucide-react";
import type { Device } from "../tuyaApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AddSwitchesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  availableSwitchableEndpoints: {
    device: Device;
    statusItem: any;
    key: string;
    isAdded: boolean;
  }[];
  onAddSwitch: (deviceId: string, code: string) => void;
  onRemoveSwitch: (deviceId: string, code: string) => void;
}

export const AddSwitchesDrawer: React.FC<AddSwitchesDrawerProps> = ({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  availableSwitchableEndpoints,
  onAddSwitch,
  onRemoveSwitch,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-popover border-l border-border shadow-2xl h-full flex flex-col animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Plus size={20} className="text-primary" />
            <span>Add Switches</span>
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="relative mb-6">
            <Input
              type="text"
              placeholder="Search switches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
            <Search
              size={18}
              className="absolute left-3.5 top-3 text-muted-foreground"
            />
          </div>

          <div className="space-y-3">
            {availableSwitchableEndpoints.length === 0 ? (
              <div className="text-center text-muted-foreground py-12 flex flex-col items-center">
                <HelpCircle size={36} className="opacity-30 mb-2" />
                <p className="text-sm font-medium">No switchable devices found.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Try force syncing in the settings drawer.
                </p>
              </div>
            ) : (
              availableSwitchableEndpoints.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 bg-muted/20 border border-border/80 rounded-xl transition-all hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={
                        item.isAdded ? "text-primary" : "text-muted-foreground/60"
                      }
                    >
                      <Lightbulb size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate">
                        {item.statusItem.name || item.statusItem.code}
                      </h4>
                      <p className="text-xs text-muted-foreground/75 truncate mt-0.5">
                        {item.device.name} ({item.device.category})
                      </p>
                    </div>
                  </div>
                  <div className="ml-3 shrink-0">
                    {item.isAdded ? (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-9 w-9 rounded-lg shadow-xs cursor-pointer"
                        onClick={() =>
                          onRemoveSwitch(item.device.id, item.statusItem.code)
                        }
                        title="Remove Tile"
                      >
                        <Trash2 size={15} />
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-9 w-9 rounded-lg shadow-xs cursor-pointer"
                        onClick={() =>
                          onAddSwitch(item.device.id, item.statusItem.code)
                        }
                        title="Add Tile"
                      >
                        <Plus size={15} />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-5 border-t border-border flex justify-end bg-muted/10">
          <Button variant="outline" className="px-6 cursor-pointer" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
