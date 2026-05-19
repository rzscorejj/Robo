import React, { useState } from 'react';
import './index.css';
import InputForm from './components/InputForm';
import Dashboard from './components/Dashboard';

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result);
  };

  const handleReset = () => {
    setAnalysisResult(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>BetStats</h1>
        <p>Análise esportiva inteligente</p>
      </header>

      <main className="app-main">
        {!analysisResult ? (
          <InputForm onAnalysisComplete={handleAnalysisComplete} />
        ) : (
          <Dashboard result={analysisResult} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}

export default App;
