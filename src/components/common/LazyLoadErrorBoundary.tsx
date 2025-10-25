import React, { Component, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class LazyLoadErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("LazyLoadErrorBoundary caught error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const moduleName = this.props.moduleName || "module";
      const isChunkError = this.state.error?.message?.includes("chunk") || 
                          this.state.error?.message?.includes("Loading");

      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Failed to Load {moduleName}</CardTitle>
            </div>
            <CardDescription>
              {isChunkError
                ? "The module failed to load. This might be due to a network issue or outdated cache."
                : "An unexpected error occurred while loading this component."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {this.state.error && (
              <div className="rounded-md bg-muted p-3 text-sm font-mono text-muted-foreground">
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={this.handleRetry} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Loading
              </Button>
              {isChunkError && (
                <Button onClick={this.handleReload} variant="default" size="sm">
                  Reload Page
                </Button>
              )}
            </div>
            {this.state.retryCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Retry attempts: {this.state.retryCount}
              </p>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
