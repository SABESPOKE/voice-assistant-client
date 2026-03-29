import { Button } from "@/components/ui/button";
import type { ButtonSize, ButtonVariant } from "@/components/ui/buttonVariants";
import { cn } from "@/lib/utils";
import { type TransportState } from "@pipecat-ai/client-js";
import { usePipecatClientTransportState } from "@pipecat-ai/client-react";
import React, { memo } from "react";

/**
 * Configuration for customizing button appearance and content for specific transport states.
 * Allows partial configuration - only specify the states you want to customize.
 */
export type ConnectButtonStateContent = Partial
  Record
    TransportState,
    {
      /** The text or content to display in the button */
      children: React.ReactNode;
      /** The button variant to use for this state */
      variant: ButtonVariant;
      /** Optional CSS class to apply to the button */
      className?: string;
    }
  >
>;

/**
 * Props for the ConnectButton component.
 */
export type ConnectButtonProps = {
  /** CSS class name to apply to the button */
  className?: string;
  /** Callback function called when the connect action is triggered */
  onConnect?: () => void;
  /** Generic click handler for the button */
  onClick?: () => void;
  /** Callback function called when the disconnect action is triggered */
  onDisconnect?: () => void;
  /** Size of the button component */
  size?: ButtonSize;
  /** Default variant of the button component */
  defaultVariant?: ButtonVariant;
  /** Custom state content configuration for different transport states */
  stateContent?: ConnectButtonStateContent;
};

export const ConnectButtonComponent: React.FC
  ConnectButtonProps & {
    transportState: TransportState;
  }
> = ({
  className: passedClassName,
  onClick,
  onConnect,
  onDisconnect,
  stateContent,
  size = "md",
  transportState,
}) => {
  const getButtonProps = (): React.ComponentProps<typeof Button> => {
    if (stateContent && stateContent[transportState]) {
      return stateContent[transportState]!;
    }

    switch (transportState) {
      case "disconnected":
      case "initialized":
        return {
          children: "Connect",
          variant: "active",
        };
      case "initializing":
        return {
          children: "Initializing...",
          variant: "secondary",
        };
      case "ready":
        return {
          children: "Disconnect",
          variant: "destructive",
        };
      case "disconnecting":
        return { children: "Disconnecting...", variant: "secondary" };
      case "error":
        return { children: "Error", variant: "destructive" };
      default:
        return { children: "Connecting...", variant: "secondary" };
    }
  };

  const { children, className, variant } = getButtonProps();

  const handleClick = () => {
    // iOS AudioContext unlock - must happen on direct user gesture
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        ctx.resume();
      }
    } catch (e) {
      // ignore
    }
    onClick?.();
    if (["ready", "connected"].includes(transportState)) {
      onDisconnect?.();
    } else {
      onConnect?.();
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      disabled={
        !["disconnected", "ready", "initialized"].includes(transportState)
      }
      isLoading={
        !["disconnected", "ready", "error", "initialized"].includes(
          transportState,
        )
      }
      className={cn(className, passedClassName)}
    >
      {children}
    </Button>
  );
};

export const ConnectButton = memo((props: ConnectButtonProps) => {
  const transportState = usePipecatClientTransportState();

  return <ConnectButtonComponent transportState={transportState} {...props} />;
});

ConnectButton.displayName = "ConnectButton";

export default ConnectButton;
