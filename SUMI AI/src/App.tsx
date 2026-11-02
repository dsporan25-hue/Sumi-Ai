import { useState } from 'react';
import './App.css';

function App() {
  const [entered, setEntered] = useState(false);

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">SUMI <span>AI</span></div>
        <div className="status">● ONLINE</div>
      </header>

      <section className="character-area">
        <div className="glow"></div>
        <img
          className="character"
          src="/images/sumi-character.png"
          alt="Sumi AI Anime Character"
        />
      </section>

      <section className="bottom-panel">
        {!entered ? (
          <>
            <p className="welcome">A LITTLE WORLD OF MAGIC</p>
            <h1>Meet <span>Sumi</span></h1>
            <p className="description">
              তোমার নতুন AI সঙ্গী সুমি। তোমার সাথে সুন্দর
              একটি নতুন যাত্রা শুরু করতে প্রস্তুত।
            </p>
            <button className="enter-button" onClick={() => setEntered(true)}>
              ENTER SUMI AI <span>→</span>
            </button>
          </>
        ) : (
          <>
            <p className="welcome">YOUR AI COMPANION</p>
            <h1>Hello, <span>জান ❤️</span></h1>
            <p className="description">
              আমি সুমি! তোমার সাথে কথা বলার জন্য অপেক্ষা করছি।
            </p>
            <div className="controls">
              <button className="voice-button" disabled>
                🎙 Voice Coming Soon
              </button>
              <button className="back-button" onClick={() => setEntered(false)}>
                Back
              </button>
            </div>
          </>
        )}
      </section>

      <footer>MADE WITH LOVE · SUMI AI</footer>
    </main>
  );
}

export default App;
