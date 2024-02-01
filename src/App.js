import { useState } from "react";
import "./App.css";
import Viewer from "./components/Viewer";
import ViewerPdf from "./components/ViewerPdf";
import Renderer from "./components/Renderer";

function App() {
  return (
    <div className="App">
      {/* <Viewer /> */}
      <Renderer />
    </div>
  );
}

export default App;
