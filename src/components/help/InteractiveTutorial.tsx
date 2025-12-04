import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, Circle, Play, ChevronRight, ChevronLeft, Award } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface InteractiveTutorialProps {
  userId: Id<"users">;
  tutorialId: Id<"tutorials">;
  onComplete?: () => void;
}

export function InteractiveTutorial({ userId, tutorialId, onComplete }: InteractiveTutorialProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const tutorial = useQuery(api.helpCoach.tutorials.getTutorial, { tutorialId });
  const progress = useQuery(api.helpCoach.tutorials.getTutorialProgress, {
    userId,
    tutorialId,
  });

  const startTutorial = useMutation(api.helpCoach.tutorials.startTutorial);
  const updateProgress = useMutation(api.helpCoach.tutorials.updateTutorialProgress);
  const completeTutorial = useMutation(api.helpCoach.tutorials.completeTutorial);

  useEffect(() => {
    if (progress && tutorial) {
      const stepIndex = tutorial.steps.findIndex((s: any) => s.stepNumber === progress.currentStep);
      if (stepIndex >= 0) {
        setCurrentStepIndex(stepIndex);
      }
    }
  }, [progress, tutorial]);

  if (!tutorial) {
    return <div>Loading tutorial...</div>;
  }

  const currentStep = tutorial.steps[currentStepIndex];
  const progressPercentage = progress 
    ? (progress.completedSteps.length / tutorial.totalSteps) * 100 
    : 0;

  const handleStart = async () => {
    await startTutorial({ userId, tutorialId });
    setIsOpen(true);
  };

  const handleStepComplete = async () => {
    if (!currentStep) return;

    await updateProgress({
      userId,
      tutorialId,
      stepNumber: currentStep.stepNumber,
      completed: true,
    });

    if (currentStepIndex < tutorial.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      await completeTutorial({ userId, tutorialId });
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < tutorial.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {tutorial.title}
                {progress?.isCompleted && (
                  <Badge variant="default" className="bg-green-600">
                    <Award className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{tutorial.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {tutorial.totalSteps} steps • {tutorial.estimatedMinutes} min
            </div>
            <Button 
              onClick={handleStart}
              disabled={progress?.isCompleted}
            >
              {progress?.isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Completed
                </>
              ) : progress ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Continue
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Tutorial
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tutorial Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{tutorial.title}</span>
              <Badge variant="outline">
                Step {currentStepIndex + 1} of {tutorial.steps.length}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {currentStep && (
            <div className="space-y-6">
              <Progress 
                value={((currentStepIndex + 1) / tutorial.steps.length) * 100} 
                className="h-2"
              />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{currentStep.title}</h3>
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: currentStep.content }} />
                </div>

                {currentStep.imageUrl && (
                  <img 
                    src={currentStep.imageUrl} 
                    alt={currentStep.title}
                    className="rounded-lg border w-full"
                  />
                )}

                {currentStep.videoUrl && (
                  <video 
                    src={currentStep.videoUrl} 
                    controls
                    className="rounded-lg border w-full"
                  />
                )}

                {currentStep.actionRequired && (
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-amber-900">
                        ⚡ Action Required: {currentStep.actionRequired}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Step Navigation */}
              <div className="flex items-center gap-2">
                {tutorial.steps.map((step: any, idx: number) => (
                  <button
                    key={step._id}
                    onClick={() => setCurrentStepIndex(idx)}
                    className="flex-1"
                  >
                    {progress?.completedSteps.includes(step.stepNumber) ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto" />
                    ) : idx === currentStepIndex ? (
                      <Circle className="w-6 h-6 text-blue-600 mx-auto fill-blue-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300 mx-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStepIndex < tutorial.steps.length - 1 ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleNext}>
                  Skip
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
                <Button onClick={handleStepComplete}>
                  Mark Complete & Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <Button onClick={handleStepComplete} className="bg-green-600 hover:bg-green-700">
                <Award className="w-4 h-4 mr-2" />
                Complete Tutorial
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
