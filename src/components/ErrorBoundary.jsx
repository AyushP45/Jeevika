import { Component } from "react";
import { AlertOctagon } from "lucide-react";
import { Button } from "./ui/Button.jsx";
import { Card } from "./ui/Card.jsx";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6 bg-slate-950">
          <Card className="max-w-md p-8 text-center border-red-500/20">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <AlertOctagon className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="mt-6 text-2xl font-black text-slate-50">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-400">
              An unexpected error occurred in the application. Please try reloading the page.
            </p>
            {this.state.error && (
              <div className="mt-6 rounded-lg bg-black/50 p-4 text-left overflow-x-auto border border-white/5">
                <pre className="text-xs text-red-400 font-mono">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}
            <Button 
              className="mt-6 w-full" 
              onClick={() => window.location.reload()}
            >
              Reload application
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
