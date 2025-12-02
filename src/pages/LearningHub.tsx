import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  PlayCircle, 
  CheckCircle, 
  Award, 
  Clock, 
  TrendingUp,
  Filter,
  Download,
  Star
} from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

export default function LearningHub() {
  const user = useQuery(api.users.currentUser);
  const business = useQuery(api.businesses.currentUserBusiness);
  const tier = business?.tier || "solopreneur";

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<Id<"learningCourses"> | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);

  const courses = useQuery(api.learningContent.listCoursesByTier, { tier });
  const userProgress = useQuery(
    api.learningContent.getCourseProgress,
    user?._id ? { userId: user._id } : "skip"
  );
  const selectedCourseData = useQuery(
    api.learningContent.getCourseById,
    selectedCourse ? { courseId: selectedCourse } : "skip"
  );
  const lessons = useQuery(
    api.learningContent.getCourseLessons,
    selectedCourse ? { courseId: selectedCourse } : "skip"
  );

  const updateProgress = useMutation(api.learningContent.updateProgress);
  const completeCourse = useMutation(api.learningContent.completeCourse);

  const categories = ["all", "automation", "ai-agents", "marketing", "analytics", "compliance"];

  const filteredCourses = courses?.filter((course: any) => 
    selectedCategory === "all" || course.category === selectedCategory
  );

  const handleLessonComplete = async (lessonId: string, quizScore?: number) => {
    if (!user?._id || !selectedCourse) return;

    try {
      await updateProgress({
        userId: user._id,
        courseId: selectedCourse,
        lessonId,
        completed: true,
        quizScore,
      });
      toast.success("Lesson completed!");
    } catch (error) {
      toast.error("Failed to update progress");
    }
  };

  const handleCourseComplete = async () => {
    if (!user?._id || !selectedCourse) return;

    try {
      await completeCourse({
        userId: user._id,
        courseId: selectedCourse,
      });
      setShowCertificate(true);
      toast.success("Congratulations! Course completed!");
    } catch (error) {
      toast.error("Failed to complete course");
    }
  };

  const getCourseProgress = (courseId: Id<"learningCourses">) => {
    return userProgress?.find((p: any) => p.courseId === courseId);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Learning Hub</h1>
          <p className="text-muted-foreground">
            Master Pikar AI with tier-specific courses and certifications
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProgress?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userProgress?.filter((p: any) => p.isCompleted).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userProgress?.filter((p: any) => p.isCompleted).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userProgress && userProgress.length > 0
                ? Math.round(
                    userProgress.reduce((acc: any, p: any) => acc + p.progressPercentage, 0) /
                      userProgress.length
                  )
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1).replace("-", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Course Catalog */}
      <Tabs defaultValue="catalog" className="space-y-4">
        <TabsList>
          <TabsTrigger value="catalog">Course Catalog</TabsTrigger>
          <TabsTrigger value="my-courses">My Courses</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses?.map((course: any) => {
              const progress = getCourseProgress(course._id);
              return (
                <Card key={course._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {course.description}
                        </CardDescription>
                      </div>
                      {progress?.isCompleted && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {course.estimatedDuration}
                      <Separator orientation="vertical" className="h-4" />
                      <BookOpen className="h-4 w-4" />
                      {course.totalLessons} lessons
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary">{course.difficulty}</Badge>
                      <Badge variant="outline">{course.category}</Badge>
                    </div>
                    {progress && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">
                            {Math.round(progress.progressPercentage)}%
                          </span>
                        </div>
                        <Progress value={progress.progressPercentage} />
                      </div>
                    )}
                    <Button
                      className="w-full"
                      onClick={() => setSelectedCourse(course._id)}
                    >
                      {progress ? "Continue Learning" : "Start Course"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="my-courses" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userProgress?.map((progress: any) => {
              const course = courses?.find((c: any) => c._id === progress.courseId);
              if (!course) return null;
              return (
                <Card key={progress._id}>
                  <CardHeader>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>
                      Last accessed: {new Date(progress.lastAccessedAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">
                          {Math.round(progress.progressPercentage)}%
                        </span>
                      </div>
                      <Progress value={progress.progressPercentage} />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => setSelectedCourse(course._id)}
                      >
                        Continue
                      </Button>
                      {progress.isCompleted && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedCourse(course._id);
                            setShowCertificate(true);
                          }}
                        >
                          <Award className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userProgress?.filter((p: any) => p.isCompleted).map((progress: any) => {
              const course = courses?.find((c: any) => c._id === progress.courseId);
              if (!course) return null;
              return (
                <Card key={progress._id} className="border-2 border-emerald-500">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Award className="h-6 w-6 text-emerald-500" />
                      <CardTitle className="text-lg">Certificate</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-medium">{course.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Completed: {new Date(progress.completedAt!).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => {
                        setSelectedCourse(course._id);
                        setShowCertificate(true);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      View Certificate
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Course Viewer Dialog */}
      <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedCourseData?.title}</DialogTitle>
            <DialogDescription>{selectedCourseData?.description}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="space-y-4 p-4">
              {lessons?.map((lesson: any, index: number) => {
                const progress = user?._id ? getCourseProgress(selectedCourse!) : null;
                const isCompleted = progress?.completedLessons.includes(lesson._id);
                return (
                  <Card key={lesson._id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Lesson {lesson.lessonNumber}
                          </span>
                          <CardTitle className="text-lg">{lesson.title}</CardTitle>
                        </div>
                        {isCompleted && <CheckCircle className="h-5 w-5 text-green-500" />}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {lesson.videoUrl && (
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                          <PlayCircle className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-sm">{lesson.description}</p>
                      <Button
                        onClick={() => handleLessonComplete(lesson._id)}
                        disabled={isCompleted}
                      >
                        {isCompleted ? "Completed" : "Mark as Complete"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Certificate Dialog */}
      <Dialog open={showCertificate} onOpenChange={setShowCertificate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Course Certificate</DialogTitle>
          </DialogHeader>
          <div className="border-4 border-emerald-500 rounded-lg p-8 space-y-6 bg-gradient-to-br from-emerald-50 to-white">
            <div className="text-center space-y-2">
              <Award className="h-16 w-16 text-emerald-500 mx-auto" />
              <h2 className="text-2xl font-bold">Certificate of Completion</h2>
            </div>
            <div className="text-center space-y-4">
              <p className="text-lg">This certifies that</p>
              <p className="text-2xl font-bold">{user?.name || user?.email}</p>
              <p className="text-lg">has successfully completed</p>
              <p className="text-xl font-semibold text-emerald-600">
                {selectedCourseData?.title}
              </p>
              <p className="text-sm text-muted-foreground">
                Issued by Pikar AI Learning Hub
              </p>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button className="flex-1">Share Certificate</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}