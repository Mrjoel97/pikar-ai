import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Ticket, Calendar, MessageSquare, TrendingUp } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function Support() {
  const user = useQuery(api.users.currentUser);
  const business = useQuery(
    api.businesses.getByOwner,
    user?._id ? { userId: user._id } : "skip"
  );

  const businessId = business?._id;

  const tickets = useQuery(
    api.enterpriseSupport.listTickets,
    businessId ? { businessId } : "skip"
  );

  const trainingSessions = useQuery(
    api.enterpriseSupport.listTrainingSessions,
    businessId ? { businessId } : "skip"
  );

  const stats = useQuery(
    api.enterpriseSupport.getSupportStats,
    businessId ? { businessId } : "skip"
  );

  const createTicket = useMutation(api.enterpriseSupport.createTicket);
  const scheduleTraining = useMutation(api.enterpriseSupport.scheduleTraining);
  const registerForTraining = useMutation(api.enterpriseSupport.registerForTraining);

  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [showTrainingDialog, setShowTrainingDialog] = useState(false);

  const [ticketForm, setTicketForm] = useState({
    subject: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    category: "technical",
  });

  const [trainingForm, setTrainingForm] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    durationMinutes: 60,
    topic: "",
    maxAttendees: 20,
  });

  const handleCreateTicket = async () => {
    if (!businessId) return;
    try {
      await createTicket({
        businessId,
        ...ticketForm,
      });
      toast.success("Support ticket created");
      setShowTicketDialog(false);
      setTicketForm({
        subject: "",
        description: "",
        priority: "medium",
        category: "technical",
      });
    } catch (e: any) {
      toast.error(e?.message || "Failed to create ticket");
    }
  };

  const handleScheduleTraining = async () => {
    if (!businessId) return;
    try {
      await scheduleTraining({
        businessId,
        title: trainingForm.title,
        description: trainingForm.description,
        scheduledAt: new Date(trainingForm.scheduledAt).getTime(),
        durationMinutes: trainingForm.durationMinutes,
        topic: trainingForm.topic,
        maxAttendees: trainingForm.maxAttendees,
      });
      toast.success("Training session scheduled");
      setShowTrainingDialog(false);
      setTrainingForm({
        title: "",
        description: "",
        scheduledAt: "",
        durationMinutes: 60,
        topic: "",
        maxAttendees: 20,
      });
    } catch (e: any) {
      toast.error(e?.message || "Failed to schedule training");
    }
  };

  const handleRegister = async (sessionId: Id<"trainingSessions">) => {
    try {
      await registerForTraining({ sessionId });
      toast.success("Registered for training");
    } catch (e: any) {
      toast.error(e?.message || "Failed to register");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to access support.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Enterprise Support</h1>
            <p className="text-muted-foreground">Ticketing and training management</p>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Open Tickets</p>
                    <p className="text-2xl font-bold">{stats.tickets.open}</p>
                  </div>
                  <Ticket className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-bold">{stats.tickets.inProgress}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Resolved</p>
                    <p className="text-2xl font-bold">{stats.tickets.resolved}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Training Sessions</p>
                    <p className="text-2xl font-bold">{stats.training.scheduled}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="tickets" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
            <TabsTrigger value="training">Training Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Support Tickets</h2>
              <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
                <DialogTrigger asChild>
                  <Button>Create Ticket</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Support Ticket</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Subject</Label>
                      <Input
                        value={ticketForm.subject}
                        onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                        placeholder="Brief description of the issue"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={ticketForm.description}
                        onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                        placeholder="Detailed description"
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Priority</Label>
                        <Select
                          value={ticketForm.priority}
                          onValueChange={(v: any) => setTicketForm({ ...ticketForm, priority: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Input
                          value={ticketForm.category}
                          onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                          placeholder="e.g., technical, billing"
                        />
                      </div>
                    </div>
                    <Button onClick={handleCreateTicket} className="w-full">
                      Submit Ticket
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {tickets?.map((ticket: any) => (
                <Card key={ticket._id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                        <CardDescription>
                          Created by {ticket.creatorName} • {new Date(ticket.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={ticket.priority === "critical" ? "destructive" : "outline"}>
                          {ticket.priority}
                        </Badge>
                        <Badge variant="secondary">{ticket.status}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{ticket.description}</p>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline">View Details</Button>
                      <Button size="sm" variant="outline">Add Comment</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="training" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Training Sessions</h2>
              <Dialog open={showTrainingDialog} onOpenChange={setShowTrainingDialog}>
                <DialogTrigger asChild>
                  <Button>Schedule Training</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Schedule Training Session</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={trainingForm.title}
                        onChange={(e) => setTrainingForm({ ...trainingForm, title: e.target.value })}
                        placeholder="Training session title"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={trainingForm.description}
                        onChange={(e) => setTrainingForm({ ...trainingForm, description: e.target.value })}
                        placeholder="What will be covered"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Scheduled Date & Time</Label>
                        <Input
                          type="datetime-local"
                          value={trainingForm.scheduledAt}
                          onChange={(e) => setTrainingForm({ ...trainingForm, scheduledAt: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={trainingForm.durationMinutes}
                          onChange={(e) => setTrainingForm({ ...trainingForm, durationMinutes: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Topic</Label>
                        <Input
                          value={trainingForm.topic}
                          onChange={(e) => setTrainingForm({ ...trainingForm, topic: e.target.value })}
                          placeholder="e.g., API Integration"
                        />
                      </div>
                      <div>
                        <Label>Max Attendees</Label>
                        <Input
                          type="number"
                          value={trainingForm.maxAttendees}
                          onChange={(e) => setTrainingForm({ ...trainingForm, maxAttendees: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <Button onClick={handleScheduleTraining} className="w-full">
                      Schedule Session
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {trainingSessions?.map((session: any) => (
                <Card key={session._id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{session.title}</CardTitle>
                        <CardDescription>
                          {new Date(session.scheduledAt).toLocaleString()} • {session.durationMinutes} min
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{session.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{session.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span>Topic: {session.topic}</span>
                      <span>Attendees: {session.attendeeCount}/{session.maxAttendees || "∞"}</span>
                      <span>Trainer: {session.trainerName}</span>
                    </div>
                    <div className="mt-4">
                      <Button
                        size="sm"
                        onClick={() => handleRegister(session._id)}
                        disabled={session.status !== "scheduled"}
                      >
                        Register
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}