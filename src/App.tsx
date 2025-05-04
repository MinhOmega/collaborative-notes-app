import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useNoteStore } from "./lib/store";
import Index from "./pages";
import NotFound from "./pages/not-found";

const App = () => {
  const { initializePeer } = useNoteStore();

  useEffect(() => {
    initializePeer();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
