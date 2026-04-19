import { useState, useRef, useEffect } from "react";
import { useChat } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User } from "lucide-react";
import { ChatMessage } from "@workspace/api-client-react";

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! I'm the library AI assistant. I can help you find books, check availability, or answer questions about our library policies. How can I help you today?" }
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatMutation = useChat();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    chatMutation.mutate(
      { data: { message: userMessage.content, conversationHistory: messages } },
      {
        onSuccess: (data) => {
          setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
        },
        onError: () => {
          setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
        }
      }
    );
  };

  return (
    <div className="h-[calc(100vh-8rem)] max-w-4xl mx-auto flex flex-col">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground mt-1 mb-6">Ask questions about books, locations, and availability.</p>
      </div>

      <Card className="flex-1 flex flex-col shadow-sm border-gray-200 overflow-hidden">
        <CardHeader className="bg-primary/5 py-3 border-b">
          <CardTitle className="text-sm font-medium flex items-center text-primary">
            <Bot className="h-5 w-5 mr-2" /> Library Assistant
          </CardTitle>
        </CardHeader>
        
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4 pb-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "user" ? "bg-primary text-white" : "bg-gray-200 text-gray-700"
                }`}>
                  {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-gray-100 text-gray-900"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-gray-700" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3 text-sm flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-3 bg-white border-t">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about a book, author, or section..." 
              className="flex-1 bg-gray-50"
              disabled={chatMutation.isPending}
            />
            <Button type="submit" disabled={!input.trim() || chatMutation.isPending} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
