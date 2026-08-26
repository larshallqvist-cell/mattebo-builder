import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Message shown instead of the crashed subtree. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Prevents a rendering error in one subtree (e.g. the lesson content renderer)
 * from taking down the whole app.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
  }

  componentDidUpdate(prevProps: Props) {
    // Reset when the children change (e.g. the user keeps typing).
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <p className="text-sm italic text-muted-foreground">Kunde inte visa innehållet just nu.</p>
        )
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
