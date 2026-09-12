import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] grid place-items-center p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-red-50 border border-red-200 grid place-items-center text-red-600">!</div>
            <h3 className="font-semibold">Something went wrong</h3>
            <p className="text-sm text-zinc-500">{this.state.error?.message || "Unexpected error"}</p>
            <button onClick={() => this.setState({ hasError: false, error: null })} className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-sm">Retry</button>
            {this.props.fallback}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
