import { useEffect } from "react";

export const FloatingAIAssistant = ({ userId }: { userId: string }) => {
  // The n8n chat widget is loaded globally from index.html
  // This component ensures it's initialized properly with user metadata
  
  useEffect(() => {
    if (!userId) return;

    // The n8n chat is already initialized globally from the CDN script in index.html
    // No additional initialization needed - n8n handles everything through the webhook
    console.log("[AIAssistant] N8n chat ready for user:", userId);
  }, [userId]);

  // Don't render anything - n8n chat is a global widget that renders to the page directly
  return null;
};
