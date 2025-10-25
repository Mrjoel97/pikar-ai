import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface ContentGuidelinesTabProps {
  brandProfile: any;
  setBrandProfile: (profile: any) => void;
  newKeyMessage: string;
  setNewKeyMessage: (value: string) => void;
  newDo: string;
  setNewDo: (value: string) => void;
  newDont: string;
  setNewDont: (value: string) => void;
}

export function ContentGuidelinesTab({
  brandProfile,
  setBrandProfile,
  newKeyMessage,
  setNewKeyMessage,
  newDo,
  setNewDo,
  newDont,
  setNewDont,
}: ContentGuidelinesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Guidelines</CardTitle>
        <CardDescription>Set rules for consistent content creation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Key Messages</Label>
          <div className="flex gap-2">
            <Input
              value={newKeyMessage}
              onChange={(e) => setNewKeyMessage(e.target.value)}
              placeholder="Add a key message"
              onKeyPress={(e) => {
                if (e.key === "Enter" && newKeyMessage.trim()) {
                  setBrandProfile({
                    ...brandProfile,
                    contentGuidelines: {
                      ...brandProfile.contentGuidelines,
                      keyMessages: [
                        ...brandProfile.contentGuidelines.keyMessages,
                        newKeyMessage.trim(),
                      ],
                    },
                  });
                  setNewKeyMessage("");
                }
              }}
            />
            <Button
              onClick={() => {
                if (newKeyMessage.trim()) {
                  setBrandProfile({
                    ...brandProfile,
                    contentGuidelines: {
                      ...brandProfile.contentGuidelines,
                      keyMessages: [
                        ...brandProfile.contentGuidelines.keyMessages,
                        newKeyMessage.trim(),
                      ],
                    },
                  });
                  setNewKeyMessage("");
                }
              }}
            >
              Add
            </Button>
          </div>
          <div className="space-y-1 mt-2">
            {brandProfile.contentGuidelines.keyMessages.map((msg: string, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted rounded text-sm"
              >
                <span>{msg}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setBrandProfile({
                      ...brandProfile,
                      contentGuidelines: {
                        ...brandProfile.contentGuidelines,
                        keyMessages: brandProfile.contentGuidelines.keyMessages.filter(
                          (_: any, i: number) => i !== index
                        ),
                      },
                    });
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-green-600">Do's</Label>
            <div className="flex gap-2">
              <Input
                value={newDo}
                onChange={(e) => setNewDo(e.target.value)}
                placeholder="Add a do"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && newDo.trim()) {
                    setBrandProfile({
                      ...brandProfile,
                      contentGuidelines: {
                        ...brandProfile.contentGuidelines,
                        dosList: [...brandProfile.contentGuidelines.dosList, newDo.trim()],
                      },
                    });
                    setNewDo("");
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (newDo.trim()) {
                    setBrandProfile({
                      ...brandProfile,
                      contentGuidelines: {
                        ...brandProfile.contentGuidelines,
                        dosList: [...brandProfile.contentGuidelines.dosList, newDo.trim()],
                      },
                    });
                    setNewDo("");
                  }
                }}
              >
                Add
              </Button>
            </div>
            <div className="space-y-1 mt-2">
              {brandProfile.contentGuidelines.dosList.map((item: string, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded text-sm"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    {item}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setBrandProfile({
                        ...brandProfile,
                        contentGuidelines: {
                          ...brandProfile.contentGuidelines,
                          dosList: brandProfile.contentGuidelines.dosList.filter(
                            (_: any, i: number) => i !== index
                          ),
                        },
                      });
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-red-600">Don'ts</Label>
            <div className="flex gap-2">
              <Input
                value={newDont}
                onChange={(e) => setNewDont(e.target.value)}
                placeholder="Add a don't"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && newDont.trim()) {
                    setBrandProfile({
                      ...brandProfile,
                      contentGuidelines: {
                        ...brandProfile.contentGuidelines,
                        dontsList: [
                          ...brandProfile.contentGuidelines.dontsList,
                          newDont.trim(),
                        ],
                      },
                    });
                    setNewDont("");
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (newDont.trim()) {
                    setBrandProfile({
                      ...brandProfile,
                      contentGuidelines: {
                        ...brandProfile.contentGuidelines,
                        dontsList: [
                          ...brandProfile.contentGuidelines.dontsList,
                          newDont.trim(),
                        ],
                      },
                    });
                    setNewDont("");
                  }
                }}
              >
                Add
              </Button>
            </div>
            <div className="space-y-1 mt-2">
              {brandProfile.contentGuidelines.dontsList.map((item: string, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded text-sm"
                >
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    {item}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setBrandProfile({
                        ...brandProfile,
                        contentGuidelines: {
                          ...brandProfile.contentGuidelines,
                          dontsList: brandProfile.contentGuidelines.dontsList.filter(
                            (_: any, i: number) => i !== index
                          ),
                        },
                      });
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
