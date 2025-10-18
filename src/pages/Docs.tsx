import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Video, MessageCircle, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");

  const docsPages = useQuery(api.docs.listPages as any);
  const docsFaqs = useQuery(api.docsFaqs.list as any);
  const docsVideos = useQuery(api.docsVideos.list as any);

  const filteredDocs = (docsPages || []).filter((doc: any) =>
    doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.contentMarkdown?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFaqs = (docsFaqs || []).filter((faq: any) =>
    faq.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVideos = (docsVideos || []).filter((video: any) =>
    video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Pikar AI Documentation</h1>
              <p className="text-muted-foreground mt-1">Everything you need to know about using Pikar AI</p>
            </div>
            <Button onClick={() => (window.location.href = "/")}>Back to Home</Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search documentation, FAQs, videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="docs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="docs" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Documentation
            </TabsTrigger>
            <TabsTrigger value="faqs" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              FAQs
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Video Tutorials
            </TabsTrigger>
          </TabsList>

          {/* Documentation Tab */}
          <TabsContent value="docs" className="space-y-4">
            {filteredDocs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No documentation found. Check back soon!</p>
                </CardContent>
              </Card>
            ) : (
              filteredDocs.map((doc: any) => (
                <motion.div
                  key={doc._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        {doc.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        {doc.contentMarkdown?.split('\n').slice(0, 5).join('\n')}...
                      </div>
                      <Button variant="link" className="mt-4 p-0">Read more →</Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* FAQs Tab */}
          <TabsContent value="faqs">
            <Card>
              <CardContent className="pt-6">
                {filteredFaqs.length === 0 ? (
                  <div className="py-12 text-center">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No FAQs found.</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFaqs.map((faq: any, index: number) => (
                      <AccordionItem key={faq._id} value={`item-${index}`}>
                        <AccordionTrigger className="text-left">
                          <div className="flex items-start gap-3">
                            <Badge variant="outline">{faq.category}</Badge>
                            <span>{faq.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-20 text-muted-foreground">{faq.answer}</div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-4">
            {filteredVideos.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No video tutorials found.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredVideos.map((video: any) => (
                  <motion.div
                    key={video._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardContent className="p-0">
                        <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                          <iframe
                            src={video.videoUrl}
                            title={video.title}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge>{video.category}</Badge>
                            {video.duration && <span className="text-sm text-muted-foreground">{video.duration}</span>}
                          </div>
                          <h3 className="font-semibold mb-2">{video.title}</h3>
                          <p className="text-sm text-muted-foreground">{video.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Chat Assistant */}
      <div className="fixed bottom-6 right-6 z-50">
        {aiChatOpen ? (
          <Card className="w-96 h-[500px] flex flex-col shadow-2xl">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">AI Assistant</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setAiChatOpen(false)}>✕</Button>
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
                <Button onClick={handleSendMessage}>Send</Button>
              </div>
            </div>
          </Card>
        ) : (
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg"
            onClick={() => setAiChatOpen(true)}
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  );
}
