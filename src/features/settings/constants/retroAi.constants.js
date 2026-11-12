export const THEMES = {
  amber: {
    name: 'Cyber Amber',
    bg: '#0F0B00',
    panelBg: '#1A1400',
    border: '#FFB000',
    borderMuted: '#5C4000',
    text: '#FFB000',
    textDim: '#B37B00',
    glow: '0 0 15px rgba(255, 176, 0, 0.4)',
    accentBg: 'rgba(255, 176, 0, 0.15)',
    chip: '#FFC43D'
  },
  cyan: {
    name: 'Vector Cyan',
    bg: '#000F14',
    panelBg: '#001A24',
    border: '#00F0FF',
    borderMuted: '#00545C',
    text: '#00F0FF',
    textDim: '#0099A3',
    glow: '0 0 15px rgba(0, 240, 255, 0.4)',
    accentBg: 'rgba(0, 240, 255, 0.15)',
    chip: '#38F9D7'
  },
  green: {
    name: 'Phosphor Green',
    bg: '#021204',
    panelBg: '#052409',
    border: '#00FF66',
    borderMuted: '#005C24',
    text: '#00FF66',
    textDim: '#00A341',
    glow: '0 0 15px rgba(0, 255, 102, 0.4)',
    accentBg: 'rgba(0, 255, 102, 0.15)',
    chip: '#70FF00'
  },
  magenta: {
    name: 'Synth Magenta',
    bg: '#14000F',
    panelBg: '#24001B',
    border: '#FF007F',
    borderMuted: '#5C002E',
    text: '#FF007F',
    textDim: '#A30052',
    glow: '0 0 15px rgba(255, 0, 127, 0.4)',
    accentBg: 'rgba(255, 0, 127, 0.15)',
    chip: '#FF54B0'
  }
};

export const PROMPT_PRESETS = [
  {
    cmd: 'SYNTHESIZE-INTERFACE --STYLE=NEO-TOKYO-1984',
    output: [
      '>> ACCESSING NEURAL MEMORY SECTOR 0x84...',
      '>> LOADING SAUL BASS VECTOR KERNEL...',
      '>> GENERATING CRT GRID: 1240x800 PIPELINE',
      '>> COLOR PALETTE: [ #0F0B00, #FFB000, #FF007F ]',
      '>> RENDER COMPLETE: 100% FAITHFUL RETRO-FUTURE HARDWARE'
    ],
    resultType: 'wireframe'
  },
  {
    cmd: 'GENERATE-DESIGN-SYSTEM --PARADIGM=BIO-CYBERNETIC',
    output: [
      '>> CONNECTING TO SYNTHETIC ETHICS NODE...',
      '>> PARSING NEURAL UX DENSITY METRICS...',
      '>> COMPOSING TYPOGRAPHIC TIMELINE GRID...',
      '>> STATUS: 4 MODULES COMPILED SUCCESSFULLY'
    ],
    resultType: 'palette'
  },
  {
    cmd: 'SIMULATE-AUDIO-SPECTRUM --FREQ=44100HZ',
    output: [
      '>> INITIALIZING ANALOG SYNTHESIZER OSCILLATOR 1...',
      '>> WAVEFORM: SAWTOOTH + SUB-BASS RESONANCE',
      '>> FILTER CUTOFF: 8.4KHZ WITH LOW-PASS ENVELOPE',
      '>> AUDIO SPECTRUM SYNCHRONIZED TO CRT SCANLINES'
    ],
    resultType: 'audio'
  }
];

export const SPEAKERS = [
  {
    id: 'spk-1',
    name: 'DR. AELITA VANCE',
    title: 'Head of Bio-Cybernetic Interfaces',
    org: 'Cyberdyne Research Labs',
    track: 'NEURAL_UX',
    topic: 'Designing Beyond Screens: Direct Neural Bus Protocols',
    bio: 'Pioneer in tactile neural feedback systems and 16-bit visual syntax for human-AI co-creation.',
    time: 'Day 1 • 10:00 AM',
    avatar: '🤖'
  },
  {
    id: 'spk-2',
    name: 'PROF. KAZUO TAKAHASHI',
    title: 'Director of Synthetic Aesthetics',
    org: 'Neo-Tokyo Institute of Technology',
    track: 'SYNTHETIC_AESTHETICS',
    topic: 'Syd Mead & Saul Bass: Retro-Futurism in the Age of Generative Latent Space',
    bio: 'Author of "Analog Dreams, Digital Realities". Specializes in vector layout synthesis and 1980s computer UI architecture.',
    time: 'Day 1 • 02:00 PM',
    avatar: '🖥️'
  },
  {
    id: 'spk-3',
    name: 'HELENA ROSTOVA',
    title: 'Principal AI Ethicist',
    org: 'World Cybernetics Council',
    track: 'CYBER_ETHICS',
    topic: 'Autonomous Design Agents & The Rights of Synthetic Creators',
    bio: 'Leading researcher in generative AI alignment, cognitive load balancing, and anti-surveillance UI patterns.',
    time: 'Day 2 • 11:30 AM',
    avatar: '👁️'
  },
  {
    id: 'spk-4',
    name: 'MARCUS VORTEX',
    title: 'Chief Audio Engineer',
    org: 'Yamaha Synth Synth-Core',
    track: 'AUDIO_AI',
    topic: 'FM Synthesis & Generative Soundscapes for Neural Interfaces',
    bio: 'Architect of legendary 8-bit sound synthesizers and generative audio neural networks.',
    time: 'Day 2 • 04:00 PM',
    avatar: '🎛️'
  },
  {
    id: 'spk-5',
    name: 'SORA OKONKWO',
    title: 'Lead Architect',
    org: 'Weyland-Yutani Design Systems',
    track: 'NEURAL_UX',
    topic: 'Zero-Latency Spatial Interfaces for Orbital Stations',
    bio: 'Designing mission-critical retro-futurist cockpit interfaces for deep space exploration craft.',
    time: 'Day 3 • 10:00 AM',
    avatar: '🚀'
  },
  {
    id: 'spk-6',
    name: 'VALERIE DECKARD',
    title: 'Synthetic Media Lead',
    org: 'Tyrell Cognitive Group',
    track: 'SYNTHETIC_AESTHETICS',
    topic: 'Replicant Design: Generative Video Synthesis on Vintage Silicon',
    bio: 'Pioneering GPU-accelerated rasterization of 1970s sci-fi interfaces and volumetric vector HUDs.',
    time: 'Day 3 • 02:30 PM',
    avatar: '⚡'
  }
];

export const SCHEDULE = [
  {
    day: 'DAY 1: SILICON DAWN',
    date: 'OCTOBER 24, 2084',
    sessions: [
      { id: 's1', time: '09:00 - 10:00 AM', title: 'KEYNOTE: The Synthetic Paradigm Shift', speaker: 'Dr. Aelita Vance', room: 'Main Terminal Alpha', duration: '60m' },
      { id: 's2', time: '10:30 - 12:00 PM', title: 'Vector Grid Systems & Retro-Futurist Layouts', speaker: 'Prof. Kazuo Takahashi', room: 'Cyber Lab 01', duration: '90m' },
      { id: 's3', time: '01:30 - 03:00 PM', title: 'Generative Color Synthesizers & Phosphor Aesthetics', speaker: 'Valerie Deckard', room: 'Main Terminal Alpha', duration: '90m' },
      { id: 's4', time: '03:30 - 05:00 PM', title: 'LIVE DEMO: Building an 8-Bit AI Assistant in 60 Mins', speaker: 'Marcus Vortex', room: 'Lab Beta', duration: '90m' }
    ]
  },
  {
    day: 'DAY 2: NEURAL LATTICE',
    date: 'OCTOBER 25, 2084',
    sessions: [
      { id: 's5', time: '09:30 - 11:00 AM', title: 'Direct Brain-Computer Interface (BCI) Typography', speaker: 'Dr. Aelita Vance', room: 'Main Terminal Alpha', duration: '90m' },
      { id: 's6', time: '11:30 - 01:00 PM', title: 'Synthetic Ethics: Safeguarding Human Intuition', speaker: 'Helena Rostova', room: 'Auditorium 8', duration: '90m' },
      { id: 's7', time: '02:00 - 03:30 PM', title: 'Spatial HUD Layouts for Orbital Vehicles', speaker: 'Sora Okonkwo', room: 'Cyber Lab 01', duration: '90m' },
      { id: 's8', time: '04:00 - 05:30 PM', title: 'PANEL: Will Synthetic Intelligence Replace Designers?', speaker: 'All Keynote Speakers', room: 'Main Terminal Alpha', duration: '90m' }
    ]
  },
  {
    day: 'DAY 3: SINGULARITY',
    date: 'OCTOBER 26, 2084',
    sessions: [
      { id: 's9', time: '10:00 - 11:30 AM', title: 'FM Sound Design for Interactive UI Feedback', speaker: 'Marcus Vortex', room: 'Sound Dome', duration: '90m' },
      { id: 's10', time: '12:00 - 01:30 PM', title: 'Replicant UI: Designing for Artificial Humans', speaker: 'Valerie Deckard', room: 'Auditorium 8', duration: '90m' },
      { id: 's11', time: '02:30 - 04:30 PM', title: 'GRAND FINALE: The 2085 Synthetic Design Manifesto', speaker: 'Prof. Kazuo Takahashi', room: 'Main Terminal Alpha', duration: '120m' }
    ]
  }
];
