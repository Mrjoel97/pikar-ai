import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export function DocsContentManager() {
  const [activeTab, setActiveTab] = useState("faqs");

  // FAQs State
  const [faqForm, setFaqForm] = useState({
    id: undefined as any,
    question: "",
    answer: "",
    category: "",
    order: 0,
    isPublished: false,
  });

  // Videos State
  const [videoForm, setVideoForm] = useState({
    id: undefined as any,
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    duration: "",
    category: "",
    order: 0,
    isPublished: false,
  });

  const business = useQuery(api.businesses.currentUserBusiness);
  const businessId = business?._id;

  const faqs = useQuery(api.docsFaqs.listAll, businessId ? { businessId } : "skip");
  const videos = useQuery(api.docsVideos.listAll, businessId ? { businessId } : "skip");

  const upsertFaq = useMutation(api.docsFaqs.upsert);
  const removeFaq = useMutation(api.docsFaqs.remove);
  const upsertVideo = useMutation(api.docsVideos.upsert);
  const removeVideo = useMutation(api.docsVideos.remove);

  const handleSaveFaq = async () => {
    if (!businessId) {
      toast.error("No business found");
      return;
    }
    try {
      await upsertFaq({ ...faqForm, businessId });
      toast.success("FAQ saved successfully");
      setFaqForm({ id: undefined, question: "", answer: "", category: "", order: 0, isPublished: false });
    } catch (e: any) {
      toast.error(e?.message || "Failed to save FAQ");
    }
  };

  const handleSaveVideo = async () => {
    if (!businessId) {
      toast.error("No business found");
      return;
    }
    try {
      await upsertVideo({ ...videoForm, businessId });
      toast.success("Video saved successfully");
      setVideoForm({ id: undefined, title: "", description: "", videoUrl: "", thumbnailUrl: "", duration: "", category: "", order: 0, isPublished: false });
    } catch (e: any) {
      toast.error(e?.message || "Failed to save video");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentation Content Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
          </TabsList>

          {/* FAQs Tab */}
          <TabsContent value="faqs" className="space-y-4">
            <div className="grid gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Question</Label>
                <Input
                  placeholder="What is Pikar AI?"
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Answer</Label>
                <Textarea
                  placeholder="Pikar AI is an AI-powered workflow automation platform..."
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    placeholder="Getting Started"
                    value={faqForm.category}
                    onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Order</Label>
                  <Input
                    type="number"
                    value={faqForm.order}
                    onChange={(e) => setFaqForm({ ...faqForm, order: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={faqForm.isPublished}
                  onCheckedChange={(checked) => setFaqForm({ ...faqForm, isPublished: checked })}
                />
                <Label>Published</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveFaq}>Save FAQ</Button>
                <Button variant="outline" onClick={() => setFaqForm({ id: undefined, question: "", answer: "", category: "", order: 0, isPublished: false })}>
                  Clear
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold">Existing FAQs</h3>
              {(faqs || []).map((faq: any) => (
                <div key={faq._id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{faq.question}</div>
                      <div className="text-sm text-muted-foreground mt-1">{faq.answer}</div>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-muted px-2 py-1 rounded">{faq.category}</span>
                        <span className="text-xs bg-muted px-2 py-1 rounded">Order: {faq.order}</span>
                        <span className={`text-xs px-2 py-1 rounded ${faq.isPublished ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {faq.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setFaqForm(faq)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => removeFaq({ id: faq._id })}>Delete</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-4">
            <div className="grid gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Getting Started with Pikar AI"
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Learn the basics of Pikar AI..."
                  value={videoForm.description}
                  onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Video URL (YouTube embed)</Label>
                <Input
                  placeholder="https://www.youtube.com/embed/..."
                  value={videoForm.videoUrl}
                  onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Thumbnail URL (optional)</Label>
                  <Input
                    placeholder="https://..."
                    value={videoForm.thumbnailUrl}
                    onChange={(e) => setVideoForm({ ...videoForm, thumbnailUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input
                    placeholder="5:30"
                    value={videoForm.duration}
                    onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    placeholder="Tutorial"
                    value={videoForm.category}
                    onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Order</Label>
                  <Input
                    type="number"
                    value={videoForm.order}
                    onChange={(e) => setVideoForm({ ...videoForm, order: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={videoForm.isPublished}
                  onCheckedChange={(checked) => setVideoForm({ ...videoForm, isPublished: checked })}
                />
                <Label>Published</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveVideo}>Save Video</Button>
                <Button variant="outline" onClick={() => setVideoForm({ id: undefined, title: "", description: "", videoUrl: "", thumbnailUrl: "", duration: "", category: "", order: 0, isPublished: false })}>
                  Clear
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold">Existing Videos</h3>
              {(videos || []).map((video: any) => (
                <div key={video._id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{video.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">{video.description}</div>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-muted px-2 py-1 rounded">{video.category}</span>
                        <span className="text-xs bg-muted px-2 py-1 rounded">{video.duration}</span>
                        <span className={`text-xs px-2 py-1 rounded ${video.isPublished ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {video.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setVideoForm(video)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => removeVideo({ id: video._id })}>Delete</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
