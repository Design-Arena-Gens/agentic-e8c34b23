'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';

interface Session {
  id: string;
  duration: number;
  completedAt: string;
}

const quotes = [
  "The quieter you become, the more you can hear.",
  "One breath at a time.",
  "Patience is the companion of wisdom.",
  "In stillness, find your strength.",
  "The present moment is all we have.",
  "Let go of what was, embrace what is.",
  "Simplicity is the ultimate sophistication.",
  "Focus on the journey, not the destination.",
  "Peace comes from within.",
  "Every moment is a fresh beginning.",
];

export default function Home() {
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [duration, setDuration] = useState(25);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [view, setView] = useState<'timer' | 'dashboard' | 'quotes'>('timer');
  const [dailyQuote, setDailyQuote] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Load sessions from localStorage
    const saved = localStorage.getItem('incense-sessions');
    if (saved) {
      setSessions(JSON.parse(saved));
    }

    // Set daily quote
    const today = new Date().toDateString();
    const savedQuoteDate = localStorage.getItem('quote-date');
    const savedQuote = localStorage.getItem('daily-quote');

    if (savedQuoteDate === today && savedQuote) {
      setDailyQuote(savedQuote);
    } else {
      const newQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setDailyQuote(newQuote);
      localStorage.setItem('quote-date', today);
      localStorage.setItem('daily-quote', newQuote);
    }

    // Create audio context for bell sound
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerActive(false);
            playBellSound();
            saveSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft]);

  const playBellSound = () => {
    // Create a simple bell-like sound using Web Audio API
    if (typeof window !== 'undefined') {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 528; // Bell-like frequency
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 2);
    }
  };

  const saveSession = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      duration,
      completedAt: new Date().toISOString(),
    };

    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    localStorage.setItem('incense-sessions', JSON.stringify(updatedSessions));
  };

  const startTimer = () => {
    setTimeLeft(duration * 60);
    setIsTimerActive(true);
  };

  const pauseTimer = () => {
    setIsTimerActive(false);
  };

  const resetTimer = () => {
    setIsTimerActive(false);
    setTimeLeft(duration * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const burnProgress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <button
          onClick={() => setView('timer')}
          className={view === 'timer' ? styles.active : ''}
        >
          香 Timer
        </button>
        <button
          onClick={() => setView('dashboard')}
          className={view === 'dashboard' ? styles.active : ''}
        >
          灰 Dashboard
        </button>
        <button
          onClick={() => setView('quotes')}
          className={view === 'quotes' ? styles.active : ''}
        >
          言 Reflections
        </button>
      </nav>

      {view === 'timer' && (
        <div className={`${styles.timerView} fade-in`}>
          <div className={styles.incenseContainer}>
            <div className={styles.incenseStick}>
              <div
                className={styles.incenseBurn}
                style={{ height: `${burnProgress}%` }}
              >
                {isTimerActive && (
                  <div className={styles.smoke}>
                    <div className={styles.smokeParticle}></div>
                    <div className={styles.smokeParticle}></div>
                    <div className={styles.smokeParticle}></div>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.incenseHolder}></div>
          </div>

          <div className={styles.timeDisplay}>{formatTime(timeLeft)}</div>

          <div className={styles.controls}>
            {!isTimerActive && timeLeft === duration * 60 && (
              <>
                <div className={styles.durationSelector}>
                  <button onClick={() => setDuration(15)}>15分</button>
                  <button onClick={() => setDuration(25)} className={duration === 25 ? styles.selected : ''}>25分</button>
                  <button onClick={() => setDuration(45)}>45分</button>
                </div>
                <button onClick={startTimer} className={styles.primaryButton}>
                  Light Incense
                </button>
              </>
            )}

            {isTimerActive && (
              <button onClick={pauseTimer} className={styles.secondaryButton}>
                Pause
              </button>
            )}

            {!isTimerActive && timeLeft < duration * 60 && timeLeft > 0 && (
              <>
                <button onClick={startTimer} className={styles.primaryButton}>
                  Resume
                </button>
                <button onClick={resetTimer} className={styles.secondaryButton}>
                  Reset
                </button>
              </>
            )}

            {timeLeft === 0 && (
              <button onClick={resetTimer} className={styles.primaryButton}>
                New Session
              </button>
            )}
          </div>

          <div className={styles.quote}>"{dailyQuote}"</div>
        </div>
      )}

      {view === 'dashboard' && (
        <div className={`${styles.dashboardView} fade-in`}>
          <h2>Past Sessions</h2>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{sessions.length}</div>
              <div className={styles.statLabel}>Total Sessions</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>
                {sessions.reduce((acc, s) => acc + s.duration, 0)}
              </div>
              <div className={styles.statLabel}>Minutes Focused</div>
            </div>
          </div>

          <div className={styles.ashContainer}>
            {sessions.length === 0 ? (
              <p className={styles.emptyState}>No incense burned yet...</p>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className={styles.ashPile}>
                  <div className={styles.ash}></div>
                  <div className={styles.ashInfo}>
                    <span>{session.duration}分</span>
                    <span className={styles.date}>
                      {new Date(session.completedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {view === 'quotes' && (
        <div className={`${styles.quotesView} fade-in`}>
          <h2>Reflections</h2>
          <div className={styles.quotesList}>
            {quotes.map((quote, index) => (
              <div key={index} className={styles.quoteCard}>
                <div className={styles.quoteText}>"{quote}"</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
