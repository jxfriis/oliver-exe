// Chaos meltdowns: when the meter fills, Oliver gets MAD and something
// really crazy — and different — happens every time.
export interface Meltdown {
  id: string;
  title: string;
  shout: string;
}

export const MELTDOWNS: Meltdown[] = [
  { id: 'invert', title: 'REALITY FLIP', shout: 'THAT IS IT!!!' },
  { id: 'meteor', title: 'METEOR OLIVERS', shout: 'I HAVE HAD ENOUGH!' },
  { id: 'invasion', title: 'CLONE INVASION', shout: 'FINE! WE ALL QUIT!' },
  { id: 'giant', title: 'MEGA OLIVER', shout: 'LOOK WHAT YOU DID!' },
  { id: 'blackout', title: 'RAGE BLACKOUT', shout: 'TURN IT ALL OFF!!' },
  { id: 'gravity-flip', title: 'GRAVITY REVENGE', shout: 'UP IS DOWN NOW!' },
  { id: 'stampede', title: 'STAMPEDE', shout: 'RUN HIM OVER, BOYS!' },
];

export const MAD_PHRASES = [
  'I AM CALM. I AM CALM?! NO!',
  'STOP CLICKING ME!!',
  'MY CURLS ARE VIBRATING WITH RAGE',
  'THAT IS IT. MELTDOWN TIME.',
  'DO YOU LIKE BEING ANNOYING?!',
  'I WILL TELL MY LANYARD ON YOU',
];

export function pickMeltdown(lastId: string | null, mode?: string): Meltdown {
  // the huge set-pieces (blackout, invasion, giant) only crash the chase tab
  const CHASE_ONLY = ['blackout', 'invasion', 'giant'];
  const pool = MELTDOWNS.filter((m) => m.id !== lastId && (mode === 'chase' || !CHASE_ONLY.includes(m.id)));
  const safe = pool.length ? pool : MELTDOWNS.filter((m) => !CHASE_ONLY.includes(m.id));
  return safe[Math.floor(Math.random() * safe.length)];
}
