import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
// import Login from "./components/Login";
import Home from "./Home";
import Contact from "./contact";
import History from "./history";
// import Chatbot from "./chatbot";
// import Party from "./parties";
// import Dataanalysis from "./dataanalysis";
// import Prediction from "./prediction";

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/history" element={<History />} />
          <Route path="/contact" element={<Contact />} />
          {/* <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/dataanalysis" element={<Dataanalysis />} />
          <Route path="/prediction" element={<Prediction />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
