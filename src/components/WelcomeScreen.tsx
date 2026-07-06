import React from "react";
import { Sparkles, Loader2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  formAccessId: string;
  setFormAccessId: (val: string) => void;
  formAccessSecret: string;
  setFormAccessSecret: (val: string) => void;
  formRegion: string;
  setFormRegion: (val: string) => void;
  regionOptions: { value: string; label: string }[];
  testStatus: "idle" | "testing" | "success" | "error";
  testErrorMessage: string;
  onSubmit: (e: React.FormEvent) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  formAccessId,
  setFormAccessId,
  formAccessSecret,
  setFormAccessSecret,
  formRegion,
  setFormRegion,
  regionOptions,
  testStatus,
  testErrorMessage,
  onSubmit,
}) => {
  return (
    <div className="flex flex-col items-center justify-center max-w-[480px] mx-auto text-center py-8 w-full">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center mb-6 text-white animate-pulse-glow">
        <Sparkles size={40} />
      </div>
      <h2 className="text-3xl font-semibold tracking-tight mb-3 text-foreground">
        Connect Tuya Cloud
      </h2>
      <p className="text-muted-foreground mb-8 text-sm">
        Please enter your Tuya Open Platform credentials to discover and
        control smart switches on your local dashboard.
      </p>

      <form onSubmit={onSubmit} className="w-full text-left space-y-5">
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Access ID (Client ID)
          </label>
          <Input
            type="text"
            value={formAccessId}
            onChange={(e) => setFormAccessId(e.target.value)}
            placeholder="e.g. 7wyx..."
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Access Secret (Client Secret)
          </label>
          <Input
            type="password"
            value={formAccessSecret}
            onChange={(e) => setFormAccessSecret(e.target.value)}
            placeholder="e.g. 4d8b..."
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            API Region Server
          </label>
          <Select
            value={formRegion}
            onChange={(e) => setFormRegion(e.target.value)}
          >
            {regionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Select the region matching your Tuya Cloud Smart Home project.
          </p>
        </div>

        {testStatus === "error" && (
          <div className="text-destructive text-sm font-medium flex items-center gap-1">
            <span>❌</span>
            <span>{testErrorMessage}</span>
          </div>
        )}

        <Button
          type="submit"
          className="w-full py-6 text-base font-semibold shadow-md cursor-pointer"
          disabled={testStatus === "testing"}
        >
          {testStatus === "testing" ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Verifying Credentials...</span>
            </>
          ) : (
            <span>Connect & Fetch Devices</span>
          )}
        </Button>
      </form>

      <div className="mt-8 text-xs text-muted-foreground/60 flex flex-col gap-2">
        <span>
          Secure Connection: API keys are stored base64 encrypted in localStorage.
        </span>
        <a
          href="https://platform.tuya.com/"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline inline-flex items-center justify-center gap-1"
        >
          <span>Tuya IoT Platform</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};
