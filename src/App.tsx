import { Plus, Lightbulb } from "lucide-react";
import { useTuyaDashboard, REGION_OPTIONS } from "./hooks/useTuyaDashboard";
import { DashboardTile } from "./components/DashboardTile";
import { ToastContainer } from "./components/ToastContainer";
import { AppHeader } from "./components/AppHeader";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { AddSwitchesDrawer } from "./components/AddSwitchesDrawer";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { ConnectionErrorModal } from "./components/ConnectionErrorModal";
import { usePWAInstall } from "./hooks/usePWAInstall";
import { Button } from "@/components/ui/button";

export default function App() {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const {
    config,
    devices,
    isLoading,
    isSettingsOpen,
    setIsSettingsOpen,
    isAddSwitchOpen,
    setIsAddSwitchOpen,
    isEditMode,
    setIsEditMode,
    draggedKey,
    settingsTab,
    setSettingsTab,
    tilesContainerRef,
    formAccessId,
    setFormAccessId,
    formAccessSecret,
    setFormAccessSecret,
    formRegion,
    setFormRegion,
    testStatus,
    testErrorMessage,
    connectionError,
    setConnectionError,
    searchQuery,
    setSearchQuery,
    togglingKeys,
    toasts,
    removeToast,
    handleSyncDevices,
    handleSaveConfig,
    handleDisconnect,
    handleRenameSwitch,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    getDragOverSide,
    handleAddSwitch,
    handleRemoveSwitch,
    handleToggleSwitch,
    handleSendCommand,
    dashboardTiles,
    availableSwitchableEndpoints,
  } = useTuyaDashboard();

  return (
    <div className="flex flex-col h-screen w-full max-w-[1400px] mx-auto p-6 overflow-hidden transition-colors">
      {/* Toast Alert System */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      {/* Header */}
      <AppHeader
        hasConfig={!!config}
        isLoading={isLoading}
        onSync={() => handleSyncDevices()}
        onOpenSettings={() => {
          setSettingsTab("discovered");
          setIsSettingsOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pr-2 -mr-2 flex flex-col">
        {!config ? (
          /* Welcome Form (First run) */
          <WelcomeScreen
            formAccessId={formAccessId}
            setFormAccessId={setFormAccessId}
            formAccessSecret={formAccessSecret}
            setFormAccessSecret={setFormAccessSecret}
            formRegion={formRegion}
            setFormRegion={setFormRegion}
            regionOptions={REGION_OPTIONS}
            testStatus={testStatus}
            testErrorMessage={testErrorMessage}
            onSubmit={handleSaveConfig}
          />
        ) : (
          /* Dashboard Home */
          <>
            {dashboardTiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center flex-1 py-16">
                <div className="text-muted-foreground/30 mb-5 animate-pulse">
                  <Lightbulb size={64} strokeWidth={1} />
                </div>
                <h2 className="text-xl font-bold mb-2 text-foreground">
                  Your Dashboard is Empty
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
                  You have connected your Tuya account successfully! Now add
                  switch tiles to configure your spotlight control.
                </p>
                <Button
                  onClick={() => setIsAddSwitchOpen(true)}
                  className="shadow-md shadow-primary/20 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Add First Switch</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 mb-10" ref={tilesContainerRef}>
                {dashboardTiles.map((tile: any) => {
                  const key = `${tile.deviceId}:${tile.code}`;
                  return (
                    <DashboardTile
                      key={key}
                      tile={tile}
                      isEditMode={isEditMode}
                      isToggling={togglingKeys.has(key)}
                      onToggle={() =>
                        handleToggleSwitch(tile.deviceId, tile.code, tile.value)
                      }
                      onRemove={(e) =>
                        handleRemoveSwitch(tile.deviceId, tile.code, e)
                      }
                      onSendCommand={(code, val) =>
                        handleSendCommand(tile.deviceId, code, val)
                      }
                      onRename={(newName) =>
                        handleRenameSwitch(tile.deviceId, tile.code, newName)
                      }
                      draggable={isEditMode && tile.online}
                      onDragStart={() => handleDragStart(key)}
                      onDragOver={(e) => handleDragOver(e, key)}
                      onDragLeave={handleDragLeave}
                      onDrop={() => handleDrop(key)}
                      onDragEnd={() => {}}
                      isDragging={draggedKey === key}
                      dragOverSide={getDragOverSide(key)}
                    />
                  );
                })}

                {/* Add Switch grid tile shortcut */}
                {isEditMode && (
                  <div
                    className="group flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary rounded-2xl p-6 min-h-[160px] cursor-pointer hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all duration-300 hover:-translate-y-1"
                    onClick={() => setIsAddSwitchOpen(true)}
                  >
                    <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/15 group-hover:text-primary transition-all duration-300">
                      <Plus size={20} />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Add grid tile
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Drawer: Add switches */}
      <AddSwitchesDrawer
        isOpen={isAddSwitchOpen}
        onClose={() => setIsAddSwitchOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        availableSwitchableEndpoints={availableSwitchableEndpoints}
        onAddSwitch={handleAddSwitch}
        onRemoveSwitch={handleRemoveSwitch}
      />

      {/* Drawer: Settings & Configurations */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settingsTab={settingsTab}
        setSettingsTab={setSettingsTab}
        config={config}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        onOpenAddSwitches={() => {
          setIsSettingsOpen(false);
          setIsAddSwitchOpen(true);
        }}
        formAccessId={formAccessId}
        setFormAccessId={setFormAccessId}
        formAccessSecret={formAccessSecret}
        setFormAccessSecret={setFormAccessSecret}
        formRegion={formRegion}
        setFormRegion={setFormRegion}
        regionOptions={REGION_OPTIONS}
        testStatus={testStatus}
        testErrorMessage={testErrorMessage}
        isLoading={isLoading}
        onSaveConfig={handleSaveConfig}
        onSyncDevices={handleSyncDevices}
        onDisconnect={handleDisconnect}
        devices={devices}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        onInstallApp={installApp}
      />

      {/* Modal: Connection Retry */}
      <ConnectionErrorModal
        error={connectionError}
        onClose={() => setConnectionError(null)}
        onRetry={() => {
          setConnectionError(null);
          handleSyncDevices();
        }}
        onEditSettings={() => {
          setConnectionError(null);
          setSettingsTab("credentials");
          setIsSettingsOpen(true);
        }}
      />
    </div>
  );
}
