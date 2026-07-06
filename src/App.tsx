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
    <div className="app-container">
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
      <main className="app-main">
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
              <div className="empty-dashboard">
                <div className="empty-dashboard-icon">
                  <Lightbulb size={64} strokeWidth={1} />
                </div>
                <h2 className="empty-dashboard-title">
                  Your Dashboard is Empty
                </h2>
                <p className="empty-dashboard-desc">
                  You have connected your Tuya account successfully! Now add
                  switch tiles to configure your spotlight control.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => setIsAddSwitchOpen(true)}
                >
                  <Plus size={16} />
                  <span>Add First Switch</span>
                </button>
              </div>
            ) : (
              <div className="dashboard-grid" ref={tilesContainerRef}>
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
                    className="add-tile"
                    onClick={() => setIsAddSwitchOpen(true)}
                  >
                    <div className="add-tile-icon-circle">
                      <Plus size={20} />
                    </div>
                    <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>
                      Add switch grid tile
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
