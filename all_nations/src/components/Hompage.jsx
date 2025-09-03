import React from "react";

const HomePage = () => {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>All Nations Web Interface</h1>

      <div style={styles.container}>
        <a href="/AllContacts" style={styles.button}>
          Send by Selected Contacts
        </a>
        <a href="/send-all" style={styles.button}>
          Send To All Contacts
        </a>
        <a href="/send-by-ambassador" style={styles.button}>
          Send by Selected Ambassador Contacts
        </a>
        <a href="/send-by-outreach" style={styles.button}>
          Send by Selected Outreach Contacts
        </a>
      </div>
    </div>
  );
};

const styles = {
  page: {
    margin: 0,
    fontFamily: "'Roboto', sans-serif",
    backgroundColor: "#000",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
  },
  title: {
    color: "#ea5a28",
    marginBottom: "30px",
    fontSize: "32px",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    width: "90%",
    maxWidth: "400px",
  },
  button: {
    backgroundColor: "#111",
    border: "2px solid #ea5a28",
    color: "#fff",
    fontSize: "18px",
    padding: "15px",
    textAlign: "center",
    borderRadius: "8px",
    cursor: "pointer",
    textDecoration: "none",
    transition: "all 0.3s ease",
  },
};

export default HomePage;