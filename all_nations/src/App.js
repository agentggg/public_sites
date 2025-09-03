import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AllContacts from "./components/AllContacts";
import Login from "./components/Login";
// import SendAll from "./views/SendAll";
// import SendByAmbassador from "./views/SendByAmbassador";
// import SendByOutreach from "./views/SendByOutreach";
import HomePage from "./components/Hompage";
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="Login" element={<Login />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/AllContacts" element={<AllContacts />} />
        {/* <Route path="/send-all" element={<SendAll />} />
        <Route path="/send-by-ambassador" element={<SendByAmbassador />} />
        <Route path="/send-by-outreach" element={<SendByOutreach />} /> */}
      </Routes>
    </Router>
  );
}

export default App;