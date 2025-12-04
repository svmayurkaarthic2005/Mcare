import { useState, useEffect, useRef } from "react";

// Extend window interface to include n8n chat
declare global {
  interface Window {
    n8nCreateChat?: (config: any) => any;
  }
}

export const AIHealthAssistant = ({ userId }: { userId: string }) => {
  const n8nContainerRef = useRef<HTMLDivElement>(null);
  const n8nInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Initialize n8n chat widget
  useEffect(() => {
    const initializeN8nChat = async () => {
      // Wait a bit for n8n script to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (typeof window !== 'undefined' && window.n8nCreateChat && n8nContainerRef.current) {
        try {
          const createChat = window.n8nCreateChat;
          
          // Create n8n chat instance in container
          n8nInstanceRef.current = createChat({
            // Update this URL to your n8n webhook endpoint
            webhookUrl: 'http://localhost:5678/webhook/f160b160-2ec1-4cb3-9f5e-6f07ea70f0a9/chat',
            target: n8nContainerRef.current,
            metadata: {
              userId: userId,
              timestamp: new Date().toISOString(),
            },
            initialMessages: [
              {
                message: 'Hello! 👋 I\'m your AI Health Assistant. How can I help you today?',
                type: 'ai',
              },
            ],
          });

          console.log("✅ n8n chat initialized successfully");
          setIsLoading(false);
        } catch (error) {
          console.error("❌ Error initializing n8n chat:", error);
          setHasError(true);
          setIsLoading(false);
        }
      } else {
        console.warn("⚠️ n8n chat script not available yet, retrying...");
        // Retry if n8n not loaded
        setTimeout(initializeN8nChat, 1000);
      }
    };

    if (userId) {
      initializeN8nChat();
    }
  }, [userId]);

  // Show error state if userId is not provided
  if (!userId) {
    return (
      <div className="flex flex-col h-full p-6 items-center justify-center bg-background rounded-lg border border-border">
        <p className="text-muted-foreground mb-4">User ID is required to use the AI assistant.</p>
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">AI Health Assistant</h3>
          <p className="text-sm text-muted-foreground">Ask me anything about your health</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-6 items-center justify-center bg-background rounded-lg border border-border">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading AI Assistant...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className="flex flex-col h-full p-6 items-center justify-center bg-background rounded-lg border border-red-200">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">⚠️ Failed to load AI Assistant</p>
          <p className="text-sm text-muted-foreground mb-4">
            The n8n chat widget could not be initialized. Please ensure n8n is configured correctly.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render n8n chat container
  return (
    <div className="flex flex-col h-full w-full bg-background rounded-lg overflow-hidden">
      <div 
        ref={n8nContainerRef} 
        className="flex-1 w-full h-full"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};
