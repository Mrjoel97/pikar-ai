import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

export default function LandingChat() {
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages([...chatMessages, { role: "user", content: chatInput }]);
    setChatInput("");
    
    // Simulate AI response
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm here to help! This is a demo response. In production, this would connect to your AI backend." }
      ]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {aiChatOpen ? (
        <Card className="w-96 h-[500px] flex flex-col shadow-2xl">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">AI Assistant</CardTitle>
              <motion.div whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="sm" onClick={() => setAiChatOpen(false)}>✕</Button>
              </motion.div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </CardContent>
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ask a question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={handleSendMessage}>Send</Button>
              </motion.div>
            </div>
          </div>
        </Card>
      ) : (
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }} 
          whileTap={{ scale: 0.9 }}
          animate={{ y: [0, -10, 0] }}
          transition={{ 
            y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg"
            onClick={() => setAiChatOpen(true)}
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
