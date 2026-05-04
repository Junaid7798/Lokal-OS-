export interface WhatsAppMessage {
  to: string;
  text: string;
  template?: string;
  parameters?: string[];
}

export interface WhatsAppProvider {
  sendMessage: (message: WhatsAppMessage) => Promise<{
    success: boolean;
    providerMessageId?: string;
    error?: string;
  }>;
}

// Implementations for different providers would go here
// export class TwilioProvider implements WhatsAppProvider { ... }
// export class GupshupProvider implements WhatsAppProvider { ... }
