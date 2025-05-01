import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

const App = () => {
  const [count, setCount] = useState(0);

  const handleIncrement = () => {
    setCount((prevCount) => prevCount + 1);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="flex gap-8 mb-8">
        <a
          href="https://vite.dev"
          target="_blank"
          className="transition-transform hover:scale-110"
          aria-label="Visit Vite website"
          tabIndex={0}
        >
          <img src={viteLogo} className="h-24 w-24" alt="Vite logo" />
        </a>
        <a
          href="https://react.dev"
          target="_blank"
          className="transition-transform hover:scale-110"
          aria-label="Visit React website"
          tabIndex={0}
        >
          <img src={reactLogo} className="h-24 w-24 animate-spin-slow" alt="React logo" />
        </a>
      </div>

      <h1 className="text-4xl font-bold mb-8 text-foreground">Vite + React</h1>

      <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full mb-8">
        <button
          onClick={handleIncrement}
          className="w-full py-3 px-4 mb-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:ring-2 focus:ring-ring focus:outline-none"
          aria-label="Increment counter"
        >
          count is {count}
        </button>
        <p className="text-card-foreground">
          Edit <code className="bg-muted px-1.5 py-0.5 rounded text-muted-foreground">src/App.tsx</code> and save to
          test HMR
        </p>
      </div>

      <p className="text-muted-foreground text-sm">Click on the Vite and React logos to learn more</p>
    </div>
  );
};

export default App;
