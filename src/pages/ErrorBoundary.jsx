// ErrorBoundary.js
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto mt-8">
          <div className="text-center">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Oops! Something went wrong.</h2>
            <p className="text-gray-600 mb-4">
              We encountered an error while loading this content. Please try again.
            </p>
            <details className="text-left mb-4 bg-gray-100 p-3 rounded">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <p className="mt-2 text-sm">{this.state.error && this.state.error.toString()}</p>
            </details>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;