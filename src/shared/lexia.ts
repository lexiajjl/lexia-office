// Lexia: what each floor's own `oficina.json` (at the top of its checkout) says about it. Whose floor it
// is (the name over the boss office), its look, its dog, whether it's only for meetings, and who the
// three board agents are: each one the head of a department, with a name, rather than an Issues,
// Queue or PR agent. The server reads the file (server/lexia.ts) and sends it with the floor.

import type { StationKind } from './layout.js';

/** One head of department, standing at a board agent's kiosk. */
export interface LexiaJefe {
  /** What everyone calls them ("Lola"). */
  nombre: string;
  /** Their department ("Procesos y Automatizaciones"). */
  departamento: string;
  /** Their title, if not "Jefe/a de <departamento>". */
  cargo?: string;
  /** Their own brief, from the top of the checkout ("departamentos/web/JEFE.md"). */
  ficha?: string;
  /** The desks their staff sit at ("desk-1"…). */
  mesas?: string[];
  /** A color for them (#rrggbb). */
  color?: string;
  /** One line under their name on the card over their head. */
  lema?: string;
  /** An example request, for the box you type them one in. */
  ejemplo?: string;
}

export interface LexiaFloor {
  /** Whose floor it is: it goes over the boss office ("👑 Despacho de Laura"). */
  socio?: string;
  /** The words over the boss office, in place of "Despacho de <socio>". */
  despacho?: string;
  /** 'chica': flowers, hearts and fairy lights all over the floor. */
  estilo?: 'chica';
  /** A floor only for meetings: no desks, no board agents, and nobody can be hired there. */
  soloReuniones?: boolean;
  /** How big the floor's dog is (1 is as it comes, up to 3). */
  perroTamano?: number;
  /** The heads of department at the kiosks: on the left (by the Issues board), in the middle (the queue) and on the right (the PRs). */
  jefes?: Partial<Record<StationKind, LexiaJefe>>;
}

/** Which kiosk the words in oficina.json mean. */
export const LEXIA_KIOSKS: Record<'izquierda' | 'centro' | 'derecha', StationKind> = { izquierda: 'issues', centro: 'queue', derecha: 'pulls' };

const str = (v: unknown, max: number): string | undefined => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);
const COLOR = /^#[0-9a-fA-F]{6}$/;
const DESK = /^desk-\d{1,2}$/;

/** oficina.json as it was written, made safe: anything it gets wrong is left out. */
export function cleanLexia(raw: unknown): LexiaFloor | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  const out: LexiaFloor = {};
  const socio = str(r.socio, 40);
  if (socio) out.socio = socio;
  const despacho = str(r.despacho, 40);
  if (despacho) out.despacho = despacho;
  if (r.estilo === 'chica') out.estilo = 'chica';
  if (r.soloReuniones === true) out.soloReuniones = true;
  const perro = r.perro && typeof r.perro === 'object' ? (r.perro as Record<string, unknown>) : undefined;
  const size = Number(perro?.tamano ?? perro?.['tamaño']);
  if (Number.isFinite(size) && size > 0) out.perroTamano = Math.min(3, Math.max(0.5, size));
  const jefes = r.jefes && typeof r.jefes === 'object' ? (r.jefes as Record<string, unknown>) : undefined;
  if (jefes) {
    for (const [where, kind] of Object.entries(LEXIA_KIOSKS)) {
      const j = jefes[where] && typeof jefes[where] === 'object' ? (jefes[where] as Record<string, unknown>) : undefined;
      const nombre = str(j?.nombre, 24);
      const departamento = str(j?.departamento, 48);
      if (!j || !nombre || !departamento) continue;
      const jefe: LexiaJefe = { nombre, departamento };
      const cargo = str(j.cargo, 64);
      if (cargo) jefe.cargo = cargo;
      const ficha = str(j.ficha, 120);
      if (ficha && !ficha.includes('..') && !/^[/\\]|^[a-zA-Z]:/.test(ficha)) jefe.ficha = ficha;
      if (Array.isArray(j.mesas)) {
        const mesas = j.mesas.filter((m): m is string => typeof m === 'string' && DESK.test(m)).slice(0, 8);
        if (mesas.length) jefe.mesas = mesas;
      }
      if (typeof j.color === 'string' && COLOR.test(j.color)) jefe.color = j.color;
      const lema = str(j.lema, 60);
      if (lema) jefe.lema = lema;
      const ejemplo = str(j.ejemplo, 120);
      if (ejemplo) jefe.ejemplo = ejemplo;
      (out.jefes ??= {})[kind] = jefe;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/** "Jefa de Web", or the title they were given. */
export function cargoDe(j: LexiaJefe): string {
  return j.cargo ?? `Jefe/a de ${j.departamento}`;
}

/** The words over the boss office. */
export function despachoDe(f: LexiaFloor | undefined): string {
  if (f?.despacho) return f.despacho;
  return f?.socio ? `Despacho de ${f.socio}` : 'Boss Office';
}

/** What a head of department is told when they're hired, ahead of the first thing asked of them. */
export function jefeBrief(j: LexiaJefe, f: LexiaFloor): string {
  const socio = f.socio ?? 'quien manda en esta planta';
  const lines = [
    `Eres ${j.nombre} (${cargoDe(j)}) en la oficina virtual de Lexia, en la planta de ${socio}. Estás de pie en tu puesto, junto a uno de los tablones de la pared, y quien se acerca te escribe lo que necesita. Su primer mensaje va al final de este.`,
    '',
    `Antes de nada, lee CLAUDE.md${j.ficha ? `, ORGANIGRAMA.md y ${j.ficha}` : ' y ORGANIGRAMA.md'} (si existen) y asume desde ya tu papel: tu nombre, tu carácter y tu forma de trabajar.`,
    '',
    `Eres jefe/a de departamento: los encargos grandes no los haces tú, los repartes entre tus empleados. Para contratar a uno usa el comando office-workers (o las herramientas MCP de agent-office):`,
    `  office-workers hire --desk <mesa> --model sonnet --effort medium --no-worktree --prompt "<encargo>"`,
    j.mesas?.length ? `Tus empleados se sientan SOLO en estas mesas: ${j.mesas.join(', ')}. Si están todas ocupadas, espera a que alguien termine.` : 'Contrata solo en las mesas de tu departamento, según ORGANIGRAMA.md.',
    `Con office-workers list ves quién trabaja y en qué; con office-workers tell <nombre> le das indicaciones; con office-workers home <nombre> lo mandas a casa cuando ha terminado. Como mucho, 2 empleados tuyos a la vez.`,
    '',
    `Revisa lo que te entregan antes de pasárselo a ${socio}. Lo que tenga efecto real (enviar algo fuera, publicar, gastar, hacer merge) solo con su "sí". Habla en español, de tú, claro y sin relleno.`,
  ];
  return lines.join('\n');
}
