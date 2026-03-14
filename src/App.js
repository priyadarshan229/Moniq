import React from 'react';

function App() {
  return (
    <div style={{
      background: '#07080A',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💸</div>
        <h1 style={{
          color: '#00E5FF',
          fontSize: '48px',
          fontWeight: '800',
          margin: '0 0 8px'
        }}>
          Moniq
        </h1>
        <p style={{ color: '#8A95A3', fontSize: '16px' }}>
          Your salary. Intelligently managed.
        </p>
      </div>
    </div>
  );
}

export default App;