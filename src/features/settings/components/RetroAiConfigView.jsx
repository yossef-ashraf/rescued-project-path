'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from '@/shared/next-compat/link';
import { THEMES, PROMPT_PRESETS, SPEAKERS, SCHEDULE } from '@/features/settings/constants/retroAi.constants.js';
import { announceMatteAlert } from '@/components/ui/MatteAlert';

export default function RetroAiConfigView() {
  const [themeKey, setThemeKey] = useState('amber');
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activeSpeakerFilter, setActiveSpeakerFilter] = useState('ALL');
  const [selectedSpeaker, setSelectedSpeaker] = useState(null);
  const [myPassSessions, setMyPassSessions] = useState([]);


  const [ticketName, setTicketName] = useState('CYBER_NEURON_99');
  const [ticketTier, setTicketTier] = useState('NEURAL OPERATOR');
  const [ticketPrinted, setTicketPrinted] = useState(false);


  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState([
    'NEURAL-SYNTH OS v8.4.1 (TTY/1)',
    'Type "HELP" or click preset buttons below to execute AI design tasks.'
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const theme = THEMES[themeKey];
  const audioCtxRef = useRef(null);


  const playRetroBeep = (freq = 440, type = 'square', duration = 0.08) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.log('Audio Context error:', e);
    }
  };

  const handleRunPresetPrompt = (preset) => {
    playRetroBeep(880, 'square', 0.1);
    setTerminalInput(preset.cmd);
    setIsProcessing(true);

    setTerminalLogs(prev => [
      ...prev,
      `> ${preset.cmd}`,
      '>> TRANSMITTING PROMPT TO NEURAL MAINFRAME...'
    ]);

    let step = 0;
    const interval = setInterval(() => {
      if (step < preset.output.length) {
        playRetroBeep(440 + step * 100, 'triangle', 0.05);
        setTerminalLogs(prev => [...prev, preset.output[step]]);
        step++;
      } else {
        clearInterval(interval);
        setIsProcessing(false);
        playRetroBeep(1200, 'sine', 0.15);
      }
    }, 400);
  };

  const handleCustomTerminalSubmit = (e) => {
    e.preventDefault();
    if (!terminalInput.trim() || isProcessing) return;

    playRetroBeep(600, 'square', 0.08);
    const cmd = terminalInput.trim().toUpperCase();
    setTerminalInput('');

    if (cmd === 'CLEAR' || cmd === 'CLS') {
      setTerminalLogs(['NEURAL-SYNTH OS v8.4.1 (TTY/1)', 'Terminal cleared.']);
      return;
    }

    if (cmd === 'HELP') {
      setTerminalLogs(prev => [
        ...prev,
        `> ${cmd}`,
        '>> AVAILABLE COMMANDS:',
        '   - HELP: Show command list',
        '   - CLEAR: Wipe screen logs',
        '   - THEME <AMBER|CYAN|GREEN|MAGENTA>: Switch phosphor tint',
        '   - TICKET: Open registration deck',
        '   - RUN <PROMPT>: Synthesize custom design concept'
      ]);
      return;
    }

    if (cmd.startsWith('THEME ')) {
      const target = (cmd.split(' ')[1] || '').toLowerCase();
      if (THEMES[target]) {
        setThemeKey(target);
        setTerminalLogs(prev => [...prev, `> ${cmd}`, `>> THEME UPDATED TO [ ${target.toUpperCase()} ]`]);
      } else {
        setTerminalLogs(prev => [...prev, `> ${cmd}`, `>> UNKNOWN THEME. USE: AMBER, CYAN, GREEN, MAGENTA`]);
      }
      return;
    }


    setIsProcessing(true);
    setTerminalLogs(prev => [
      ...prev,
      `> ${cmd}`,
      '>> COMPILING NEURAL INSTRUCTIONS...',
      `>> SYNTHESIZING AESTHETIC SPECS FOR: "${cmd}"`,
      '>> VECTOR MESH GENERATED IN 14ms',
      '>> STATUS: EXECUTION SUCCESSFUL'
    ]);
    setTimeout(() => {
      setIsProcessing(false);
      playRetroBeep(950, 'sine', 0.1);
    }, 800);
  };

  const toggleSessionInPass = (sessionId) => {
    playRetroBeep(520, 'sine', 0.06);
    if (myPassSessions.includes(sessionId)) {
      setMyPassSessions(myPassSessions.filter(id => id !== sessionId));
    } else {
      setMyPassSessions([...myPassSessions, sessionId]);
    }
  };

  const filteredSpeakers = activeSpeakerFilter === 'ALL'
    ? SPEAKERS
    : SPEAKERS.filter(s => s.track === activeSpeakerFilter);

  return (
    <div
      className="min-h-screen font-mono text-xs sm:text-sm select-none relative overflow-x-hidden transition-colors duration-500"
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        fontFamily: '"Courier New", Courier, monospace'
      }}
    >
      {crtEnabled && (
        <div
          className="fixed inset-0 pointer-events-none z-50 opacity-25"
          style={{
            background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
            backgroundSize: '100% 4px, 6px 100%'
          }}
        />
      )}

      <div
        className="fixed inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `linear-gradient(${theme.borderMuted} 1px, transparent 1px), linear-gradient(90deg, ${theme.borderMuted} 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div
        className="w-full border-b py-1.5 px-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest bg-black/40 backdrop-blur-xs relative z-40"
        style={{ borderColor: theme.borderMuted }}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <span className="inline-block w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: theme.border }} />
          <span className="truncate">
            [SYS_STATUS: OPERATIONAL] • SYNTHESIS 2084 • SECTOR 7 NEO-TOKYO • OCT 24-26, 2084 • 1ST INTERNATIONAL AI DESIGN SUMMIT
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1">
            <span className="text-[10px] text-zinc-500 mr-1">TINT:</span>
            {Object.keys(THEMES).map(key => (
              <button
                key={key}
                onClick={() => {
                  setThemeKey(key);
                  playRetroBeep(700, 'sine', 0.05);
                }}
                className={`w-4 h-4 rounded-full border border-black/50 transition transform hover:scale-125 cursor-pointer ${themeKey === key ? 'ring-2 ring-white scale-110' : ''}`}
                style={{ backgroundColor: THEMES[key].border }}
                title={THEMES[key].name}
              />
            ))}
          </div>

          <button
            onClick={() => {
              setCrtEnabled(!crtEnabled);
              playRetroBeep(400, 'square', 0.05);
            }}
            className="px-2 py-0.5 border rounded-xs text-[10px] font-bold transition cursor-pointer hover:opacity-80"
            style={{
              borderColor: theme.borderMuted,
              backgroundColor: crtEnabled ? theme.accentBg : 'transparent'
            }}
          >
            CRT FX: {crtEnabled ? '[ON]' : '[OFF]'}
          </button>

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playRetroBeep(880, 'sine', 0.1);
            }}
            className="px-2 py-0.5 border rounded-xs text-[10px] font-bold transition cursor-pointer hover:opacity-80"
            style={{
              borderColor: theme.borderMuted,
              backgroundColor: soundEnabled ? theme.accentBg : 'transparent'
            }}
          >
            SOUND: {soundEnabled ? '🔊 ON' : '🔇 OFF'}
          </button>
        </div>
      </div>

      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md bg-black/60 px-4 sm:px-8 py-4 flex items-center justify-between"
        style={{ borderColor: theme.borderMuted }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="px-2.5 py-1 border text-[11px] font-extrabold tracking-wider transition hover:opacity-80 flex items-center gap-1"
            style={{ borderColor: theme.border, backgroundColor: theme.accentBg }}
          >
            ← BACK_TO_WORKSPACE
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 border-2 flex items-center justify-center font-black text-lg tracking-tighter"
              style={{ borderColor: theme.border, boxShadow: theme.glow }}
            >
              S84
            </div>
            <div>
              <div className="font-extrabold tracking-widest text-base sm:text-lg flex items-center gap-2">
                <span>SYNTHESIS</span>
                <span className="text-xs px-1.5 py-0.5 border rounded-xs" style={{ borderColor: theme.border, color: theme.chip }}>2084</span>
              </div>
              <p className="text-[10px] tracking-widest opacity-70">INTERGALACTIC AI DESIGN CONFERENCE</p>
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 font-bold text-xs tracking-wider">
          <a href="#hero" className="hover:underline opacity-80 hover:opacity-100">[01_HERO]</a>
          <a href="#terminal" className="hover:underline opacity-80 hover:opacity-100">[02_AI_TERMINAL]</a>
          <a href="#speakers" className="hover:underline opacity-80 hover:opacity-100">[03_ROSTER]</a>
          <a href="#schedule" className="hover:underline opacity-80 hover:opacity-100">[04_SCHEDULE]</a>
          <a href="#tickets" className="hover:underline opacity-80 hover:opacity-100">[05_PASS_STATION]</a>
        </nav>

        <a
          href="#tickets"
          className="px-4 py-2 border-2 font-black tracking-wider text-xs transition transform hover:scale-105 cursor-pointer flex items-center gap-2"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.accentBg,
            boxShadow: theme.glow
          }}
          onClick={() => playRetroBeep(900, 'square', 0.08)}
        >
          <span>🎟️</span>
          <span>GET_PASS</span>
        </a>
      </header>

      <section id="hero" className="relative px-4 sm:px-8 py-16 sm:py-24 border-b overflow-hidden" style={{ borderColor: theme.borderMuted }}>
        <div className="absolute top-4 left-4 text-xs opacity-40">┌── [SECTOR_7]</div>
        <div className="absolute top-4 right-4 text-xs opacity-40">[SYSTEM_ID: 8492] ┐</div>
        <div className="absolute bottom-4 left-4 text-xs opacity-40">└── [LAT: 35.6764° N]</div>
        <div className="absolute bottom-4 right-4 text-xs opacity-40">[NEO-TOKYO MAINFRAME] ┘</div>

        <div className="max-w-5xl mx-auto space-y-8 relative z-10 text-center sm:text-left">

          <div className="inline-flex items-center gap-3 px-3 py-1 border text-xs font-bold tracking-widest uppercase" style={{ borderColor: theme.border, backgroundColor: theme.accentBg }}>
            <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: theme.border }} />
            <span>OCTOBER 24-26, 2084 • SECTOR 7 MAINFRAME AUDITORIUM</span>
          </div>

          <div className="space-y-4">
            <h1
              className="text-3xl sm:text-6xl md:text-7xl font-black tracking-tighter leading-none"
              style={{ textShadow: theme.glow }}
            >
              SYNTHESIS : 2084<br />
              <span className="opacity-90 font-mono tracking-normal text-2xl sm:text-5xl">
                FUTURE OF AI DESIGN
              </span>
            </h1>
            <p className="max-w-2xl text-xs sm:text-base opacity-80 leading-relaxed font-mono">
              The world’s premier 3-day retro-futurist summit exploring neural layout engines, synthetic aesthetics, bio-cybernetic interfaces, and vector art synthesis.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-b py-6" style={{ borderColor: theme.borderMuted }}>
            <div className="p-3 border rounded-xs bg-black/40" style={{ borderColor: theme.borderMuted }}>
              <span className="text-[10px] opacity-60 block mb-1 uppercase">EVENT COUNTDOWN</span>
              <span className="text-base sm:text-xl font-extrabold font-mono" style={{ color: theme.chip }}>
                058D : 14H : 22M
              </span>
            </div>
            <div className="p-3 border rounded-xs bg-black/40" style={{ borderColor: theme.borderMuted }}>
              <span className="text-[10px] opacity-60 block mb-1 uppercase">VISIONARY SPEAKERS</span>
              <span className="text-base sm:text-xl font-extrabold font-mono">48 LEADING AI LABS</span>
            </div>
            <div className="p-3 border rounded-xs bg-black/40" style={{ borderColor: theme.borderMuted }}>
              <span className="text-[10px] opacity-60 block mb-1 uppercase">DELEGATE CAPACITY</span>
              <span className="text-base sm:text-xl font-extrabold font-mono">1,200 CYBER PASSES</span>
            </div>
            <div className="p-3 border rounded-xs bg-black/40" style={{ borderColor: theme.borderMuted }}>
              <span className="text-[10px] opacity-60 block mb-1 uppercase">TRACKS & LABS</span>
              <span className="text-base sm:text-xl font-extrabold font-mono" style={{ color: theme.chip }}>
                04 CORE MODULES
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <a
              href="#tickets"
              className="px-6 py-3.5 border-2 font-extrabold text-sm tracking-widest transition transform hover:scale-105 shadow-lg flex items-center gap-3 cursor-pointer"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.border,
                color: '#000'
              }}
              onClick={() => playRetroBeep(1000, 'square', 0.1)}
            >
              <span>⚡</span>
              <span>REGISTER_CYBER_PASS</span>
            </a>

            <a
              href="#terminal"
              className="px-6 py-3.5 border-2 font-bold text-sm tracking-widest transition hover:opacity-80 flex items-center gap-3 cursor-pointer"
              style={{ borderColor: theme.border, backgroundColor: theme.accentBg }}
              onClick={() => playRetroBeep(650, 'sine', 0.08)}
            >
              <span>💻</span>
              <span>LAUNCH_AI_TERMINAL</span>
            </a>
          </div>
        </div>
      </section>

      <section id="terminal" className="px-4 sm:px-8 py-16 sm:py-20 border-b" style={{ borderColor: theme.borderMuted }}>
        <div className="max-w-5xl mx-auto space-y-6">

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: theme.borderMuted }}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">[INTERACTIVE_LAB_01]</span>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                <span>CYBER-PROMPT 8000</span>
                <span className="text-xs px-2 py-0.5 border" style={{ borderColor: theme.border }}>AI ENGINE</span>
              </h2>
            </div>
            <p className="text-xs opacity-70 max-w-xs">
              Simulate prompt synthesis on retro neural hardware. Click a preset or type commands below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs opacity-60 font-bold mr-2">QUICK PROMPTS:</span>
            {PROMPT_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleRunPresetPrompt(preset)}
                disabled={isProcessing}
                className="px-3 py-1.5 border text-xs font-bold tracking-wider transition hover:opacity-80 cursor-pointer disabled:opacity-50"
                style={{ borderColor: theme.borderMuted, backgroundColor: theme.panelBg }}
              >
                ▶ {preset.cmd.split(' ')[0]}
              </button>
            ))}
          </div>

          <div
            className="w-full border-2 rounded-xs p-4 sm:p-6 space-y-4 font-mono shadow-2xl relative"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.panelBg,
              boxShadow: theme.glow
            }}
          >
            <div className="flex items-center justify-between border-b pb-3 text-xs font-bold opacity-80" style={{ borderColor: theme.borderMuted }}>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
                <span className="ml-2">TTY/1 - NEURAL MAINFRAME V8.4</span>
              </div>
              <span>BAUD RATE: 9600 - 8-N-1</span>
            </div>

            <div className="h-64 sm:h-72 overflow-y-auto space-y-1 text-xs leading-relaxed pr-2 font-mono scrollbar-thin">
              {terminalLogs.map((log, index) => (
                <div
                  key={index}
                  className={`${log.startsWith('>') ? 'font-bold' : 'opacity-85'}`}
                  style={{ color: log.startsWith('>>') ? theme.chip : theme.text }}
                >
                  {log}
                </div>
              ))}
              {isProcessing && (
                <div className="animate-pulse font-bold" style={{ color: theme.border }}>
                  &gt;&gt; COMPUTING SYNTHETIC VECTORS... [████████░░] 84%
                </div>
              )}
            </div>

            <form onSubmit={handleCustomTerminalSubmit} className="flex items-center gap-2 border-t pt-3" style={{ borderColor: theme.borderMuted }}>
              <span className="font-extrabold text-sm" style={{ color: theme.border }}>&gt;</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Type command e.g. THEME CYAN, HELP, CLEAR, or prompt..."
                className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm font-mono font-bold"
                style={{ color: theme.text }}
              />
              <button
                type="submit"
                disabled={isProcessing}
                className="px-4 py-1 border font-bold text-xs tracking-wider transition hover:opacity-80 cursor-pointer disabled:opacity-50"
                style={{ borderColor: theme.border, backgroundColor: theme.accentBg }}
              >
                EXECUTE
              </button>
            </form>
          </div>
        </div>
      </section>

      <section id="speakers" className="px-4 sm:px-8 py-16 sm:py-24 border-b" style={{ borderColor: theme.borderMuted }}>
        <div className="max-w-5xl mx-auto space-y-8">

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: theme.borderMuted }}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">[KEYNOTE_ROSTER]</span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight">CYBERNETIC VISIONARIES</h2>
            </div>
            <p className="text-xs opacity-70 max-w-sm">
              Click any speaker microchip card to inspect bio, paper specs, and neural research notes.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {['ALL', 'NEURAL_UX', 'SYNTHETIC_AESTHETICS', 'CYBER_ETHICS', 'AUDIO_AI'].map(track => (
              <button
                key={track}
                onClick={() => {
                  setActiveSpeakerFilter(track);
                  playRetroBeep(600, 'sine', 0.05);
                }}
                className={`px-3 py-1.5 border transition cursor-pointer ${activeSpeakerFilter === track ? 'font-extrabold shadow-md' : 'opacity-70'}`}
                style={{
                  borderColor: activeSpeakerFilter === track ? theme.border : theme.borderMuted,
                  backgroundColor: activeSpeakerFilter === track ? theme.accentBg : 'transparent'
                }}
              >
                [{track}]
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSpeakers.map(spk => (
              <div
                key={spk.id}
                onClick={() => {
                  setSelectedSpeaker(spk);
                  playRetroBeep(750, 'square', 0.08);
                }}
                className="border-2 p-5 rounded-xs space-y-4 transition transform hover:-translate-y-1 cursor-pointer relative group bg-black/40"
                style={{
                  borderColor: theme.borderMuted,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl p-2 border rounded-xs" style={{ borderColor: theme.borderMuted, backgroundColor: theme.panelBg }}>
                    {spk.avatar}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 border" style={{ borderColor: theme.border, color: theme.chip }}>
                    {spk.track}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-extrabold tracking-wide group-hover:underline" style={{ color: theme.text }}>
                    {spk.name}
                  </h3>
                  <p className="text-xs font-bold opacity-80">{spk.title}</p>
                  <p className="text-[11px] opacity-60 font-mono">{spk.org}</p>
                </div>

                <div className="pt-3 border-t text-xs font-bold italic opacity-90 line-clamp-2" style={{ borderColor: theme.borderMuted }}>
                  &ldquo;{spk.topic}&rdquo;
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono opacity-70 pt-2">
                  <span>{spk.time}</span>
                  <span className="group-hover:translate-x-1 transition">INSPECT_BIO →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedSpeaker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div
            className="w-full max-w-xl border-2 p-6 sm:p-8 rounded-xs space-y-6 relative shadow-2xl animate-scale-up"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.panelBg,
              boxShadow: theme.glow
            }}
          >
            <button
              onClick={() => {
                setSelectedSpeaker(null);
                playRetroBeep(400, 'square', 0.05);
              }}
              className="absolute top-4 right-4 text-xs font-extrabold px-2.5 py-1 border hover:opacity-80 cursor-pointer"
              style={{ borderColor: theme.border }}
            >
              [X_CLOSE]
            </button>

            <div className="flex items-center gap-4">
              <span className="text-5xl p-3 border rounded-xs" style={{ borderColor: theme.border }}>
                {selectedSpeaker.avatar}
              </span>
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 border" style={{ borderColor: theme.border, color: theme.chip }}>
                  {selectedSpeaker.track}
                </span>
                <h3 className="text-xl font-black mt-1" style={{ color: theme.text }}>{selectedSpeaker.name}</h3>
                <p className="text-xs opacity-80 font-bold">{selectedSpeaker.title} • {selectedSpeaker.org}</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-b py-4" style={{ borderColor: theme.borderMuted }}>
              <span className="text-[10px] font-bold opacity-60 uppercase block">KEYNOTE TOPIC</span>
              <h4 className="text-sm font-extrabold" style={{ color: theme.chip }}>{selectedSpeaker.topic}</h4>
              <p className="text-xs opacity-85 leading-relaxed pt-2">{selectedSpeaker.bio}</p>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="opacity-70">SCHEDULE: {selectedSpeaker.time}</span>
              <button
                onClick={() => {
                  playRetroBeep(880, 'sine', 0.1);
                  announceMatteAlert({ tone: 'success', title: 'Paper specs ready', description: `Paper specs downloaded for ${selectedSpeaker.name}`, duration: 4500 });
                }}
                className="px-3 py-1.5 border font-bold hover:opacity-80 cursor-pointer"
                style={{ borderColor: theme.border, backgroundColor: theme.accentBg }}
              >
                📥 DOWNLOAD_PAPER.PDF
              </button>
            </div>
          </div>
        </div>
      )}

      <section id="schedule" className="px-4 sm:px-8 py-16 sm:py-24 border-b" style={{ borderColor: theme.borderMuted }}>
        <div className="max-w-5xl mx-auto space-y-8">

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: theme.borderMuted }}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">[TIMELINE_MATRIX]</span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight">3-DAY SUMMIT SCHEDULE</h2>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold block" style={{ color: theme.chip }}>
                BOOKMARKED TALKS: {myPassSessions.length} SESSIONS
              </span>
              <span className="text-[10px] opacity-60">Click + ADD TO PASS to bookmark</span>
            </div>
          </div>

          <div className="space-y-10">
            {SCHEDULE.map((dayData, dIdx) => (
              <div key={dIdx} className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: theme.border }}>
                  <h3 className="text-base sm:text-lg font-black tracking-wider flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.border }}></span>
                    <span>{dayData.day}</span>
                  </h3>
                  <span className="text-xs font-mono font-bold opacity-70">{dayData.date}</span>
                </div>

                <div className="space-y-3">
                  {dayData.sessions.map((sess) => {
                    const isAdded = myPassSessions.includes(sess.id);
                    return (
                      <div
                        key={sess.id}
                        className={`p-4 border-2 rounded-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition ${isAdded ? 'shadow-md ring-1' : 'opacity-90'}`}
                        style={{
                          borderColor: isAdded ? theme.border : theme.borderMuted,
                          backgroundColor: isAdded ? theme.accentBg : 'transparent'
                        }}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-3 text-xs font-mono opacity-70">
                            <span>{sess.time}</span>
                            <span>•</span>
                            <span style={{ color: theme.chip }}>{sess.room}</span>
                            <span>•</span>
                            <span>{sess.duration}</span>
                          </div>
                          <h4 className="text-sm font-extrabold">{sess.title}</h4>
                          <p className="text-xs opacity-75">Speaker: {sess.speaker}</p>
                        </div>

                        <button
                          onClick={() => toggleSessionInPass(sess.id)}
                          className="px-4 py-2 border text-xs font-bold tracking-wider transition cursor-pointer shrink-0 hover:opacity-80"
                          style={{
                            borderColor: theme.border,
                            backgroundColor: isAdded ? theme.border : 'transparent',
                            color: isAdded ? '#000' : theme.text
                          }}
                        >
                          {isAdded ? '✓ ADDED_TO_PASS' : '+ ADD_TO_PASS'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tickets" className="px-4 sm:px-8 py-16 sm:py-24 border-b" style={{ borderColor: theme.borderMuted }}>
        <div className="max-w-5xl mx-auto space-y-8">

          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">[BADGE_STATION]</span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">GET YOUR CYBER PASS</h2>
            <p className="text-xs opacity-75">
              Customize your retro conference badge and generate an instant printable pass receipt.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            <div className="border-2 p-6 rounded-xs space-y-6 bg-black/40" style={{ borderColor: theme.borderMuted }}>
              <h3 className="text-base font-extrabold border-b pb-3" style={{ borderColor: theme.borderMuted }}>
                1. SELECT DELEGATE TIER
              </h3>

              <div className="space-y-3">
                {[
                  { title: 'ANALOG DELEGATE', price: '$299', desc: '3-Day Access + Cassette Audio Tapes' },
                  { title: 'NEURAL OPERATOR', price: '$599', desc: 'VIP Terminal Seat + Workshop Labs + T-Shirt' },
                  { title: 'QUANTUM MAINFRAME', price: '$1,299', desc: 'All-Access + Speaker Banquet + Custom Hardware Badge' }
                ].map((tier, tIdx) => (
                  <div
                    key={tIdx}
                    onClick={() => {
                      setTicketTier(tier.title);
                      playRetroBeep(700, 'sine', 0.05);
                    }}
                    className={`p-3 border rounded-xs cursor-pointer transition flex items-center justify-between ${ticketTier === tier.title ? 'border-2 shadow-md' : 'opacity-70'}`}
                    style={{
                      borderColor: ticketTier === tier.title ? theme.border : theme.borderMuted,
                      backgroundColor: ticketTier === tier.title ? theme.accentBg : 'transparent'
                    }}
                  >
                    <div>
                      <div className="font-extrabold text-xs">{tier.title}</div>
                      <div className="text-[11px] opacity-60">{tier.desc}</div>
                    </div>
                    <span className="text-sm font-extrabold font-mono" style={{ color: theme.chip }}>{tier.price}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold opacity-80 block">2. DELEGATE CALLSIGN / NAME:</label>
                <input
                  type="text"
                  value={ticketName}
                  onChange={(e) => setTicketName(e.target.value.toUpperCase())}
                  maxLength={24}
                  className="w-full bg-black border p-3 rounded-xs font-mono font-extrabold text-sm outline-none tracking-widest"
                  style={{ borderColor: theme.border, color: theme.text }}
                />
              </div>

              <button
                onClick={() => {
                  setTicketPrinted(true);
                  playRetroBeep(1200, 'square', 0.2);
                }}
                className="w-full py-4 border-2 font-black text-sm tracking-widest transition transform hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.border,
                  color: '#000'
                }}
              >
                <span>🖨️</span>
                <span>PRINT_CYBER_BADGE</span>
              </button>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-bold opacity-60 uppercase block text-center">BADGE RECEIPT PREVIEW</span>

              <div
                className="border-4 p-6 rounded-xs space-y-6 shadow-2xl relative bg-black font-mono overflow-hidden"
                style={{
                  borderColor: theme.border,
                  boxShadow: theme.glow
                }}
              >
                <div className="flex items-center justify-between border-b pb-3 opacity-80" style={{ borderColor: theme.borderMuted }}>
                  <span className="text-xs font-bold">SYNTHESIS_2084 - PASS</span>
                  <span className="text-[10px] font-mono">NO. 849-019-2084</span>
                </div>

                <div className="text-center space-y-3 py-4 border-b" style={{ borderColor: theme.borderMuted }}>
                  <div className="text-4xl">🤖</div>
                  <div>
                    <span className="text-[10px] px-2 py-0.5 border uppercase font-extrabold" style={{ borderColor: theme.border, color: theme.chip }}>
                      {ticketTier}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black tracking-widest mt-2" style={{ color: theme.text }}>
                      {ticketName || 'ANONYMOUS_DELEGATE'}
                    </h3>
                    <p className="text-xs opacity-70 mt-1">SECTOR 7 • NEO-TOKYO MAINFRAME</p>
                  </div>
                </div>

                <div className="space-y-2 text-center pt-2">
                  <div className="font-mono text-lg tracking-[0.4em] opacity-80">
                    ||| | |||| | ||| || |||| | | ||||
                  </div>
                  <div className="text-[10px] opacity-60">VALID FOR OCT 24-26, 2084 • NON-TRANSFERABLE NEURAL ID</div>
                </div>

                {ticketPrinted && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500 text-black font-extrabold text-[10px] animate-pulse">
                    ✓ PRINTED
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-8 py-16 border-b" style={{ borderColor: theme.borderMuted }}>
        <div className="max-w-5xl mx-auto space-y-6 text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">[CYBERNETIC_GUILDS]</span>
          <h3 className="text-lg font-black tracking-wider">SUPPORTED BY LEADING TECH MAINFRAMES</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 opacity-75">
            {[
              'CYBERDYNE LABS',
              'TYRELL CORP',
              'YOYODYNE PROPULSION',
              'WEYLAND-YUTANI',
              'BELL AI SYNTHESIS',
              'TAKAOKA VECTOR',
              'ARPANET NEURAL',
              'YAMAHA SYNTH-CORE'
            ].map((brand, bIdx) => (
              <div key={bIdx} className="p-4 border font-bold text-xs tracking-wider" style={{ borderColor: theme.borderMuted }}>
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-4 sm:px-8 py-12 text-center text-xs opacity-75 font-mono space-y-4">
        <div className="flex items-center justify-center gap-3">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.border }} />
          <span>SYNTHESIS 2084 • ALL RIGHTS RESERVED</span>
        </div>
        <p className="max-w-md mx-auto text-[11px] opacity-60">
          Designed with 100% Retro-Futurist precision. Synthesized for visionaries of artificial intelligence and digital aesthetics.
        </p>
      </footer>
    </div>
  );
}
