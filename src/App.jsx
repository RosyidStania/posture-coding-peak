import PostureCamera from './components/PostureCamera';
import './App.css'; 

function App() {
  return (
    <div className="app-container">
      <header className="header">
        <h1>Postur Coding Peak</h1>
      </header>
      
      <main className="main-content">
        <PostureCamera />
      </main>
    </div>
  );
}

export default App;
