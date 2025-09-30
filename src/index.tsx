import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ReactDomPage from './pages/react-dom';
import IframePage from './pages/iframe';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div style={styles.container}>
        <nav style={styles.nav}>
          <h1 style={styles.title}>HTML Visual Editor</h1>
          <div style={styles.links}>
            <Link to="/" style={styles.link}>React DOM Editor</Link>
            <Link to="/iframe" style={styles.link}>Iframe Editor</Link>
          </div>
        </nav>

        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<ReactDomPage />} />
            <Route path="/iframe" element={<IframePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  nav: {
    backgroundColor: '#fff',
    padding: '20px',
    borderBottom: '1px solid #e0e0e0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 16px 0',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  },
  links: {
    display: 'flex',
    gap: '16px',
  },
  link: {
    padding: '8px 16px',
    backgroundColor: '#228be6',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    transition: 'background-color 0.2s',
  },
  main: {
    padding: '20px',
  },
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);