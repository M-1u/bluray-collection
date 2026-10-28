import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="empty">
        <h1>Une erreur est survenue</h1>
        <p className="error">{String(this.state.error.message || this.state.error)}</p>
        <button className="btn" onClick={() => location.reload()}>Recharger</button>
      </div>
    );
  }
}

createRoot(document.getElementById('root')).render(<ErrorBoundary><App /></ErrorBoundary>);
