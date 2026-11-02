/** The board agents: what each is for, and the ones waiting by their boards before anyone has asked them anything. */
import { STATION_AGENT, type StationKind } from '../../shared/layout';
import { cargoDe } from '../../shared/lexia';
import { store } from '../state';
import { Worker } from '../world/character';
import type { DeskView } from '../world/types';
import type { World } from '../world/world';
import { noOutline } from './outline';

/** What each board agent is for: its board's icon, what it offers on the card over its head, and an example ask. */
export const STATION_INFO: Record<StationKind, { icon: string; offer: string; does: string; example: string }> = {
  issues: { icon: '📌', offer: 'Ask me about issues', does: 'I file, find, triage, label and close them', example: 'File an issue: the dog walks straight through the jukebox' },
  pulls: { icon: '🔀', offer: 'Ask me about PRs', does: 'I sum up, review, comment on and merge them', example: 'Review the newest PR and tell me if it’s ready to merge' },
  queue: { icon: '📋', offer: 'Ask me to queue work', does: 'I turn it into tasks for fresh workers', example: 'Queue every open bug issue, most important first' },
};

/**
 * Lexia: who stands at `kind`'s kiosk on the floor you're on: the head of department its oficina.json
 * puts there, or the board agent it always was. Their name, icon and what they offer.
 */
export function stationLabel(kind: StationKind): { name: string; icon: string; offer: string; does: string; example: string } {
  const jefe = store.currentFloor()?.lexia?.jefes?.[kind];
  const info = STATION_INFO[kind];
  if (!jefe) return { name: STATION_AGENT[kind].name, ...info };
  return {
    name: jefe.nombre,
    icon: '⭐',
    offer: `${cargoDe(jefe)}`,
    does: jefe.lema ?? `Dirijo ${jefe.departamento} y reparto el trabajo entre mi equipo`,
    example: jefe.ejemplo ?? `¿Qué tiene pendiente ${jefe.departamento}?`,
  };
}

/** Lexia: the ones waiting by their kiosks, named and labelled for the floor you're on (see stationLabel). */
export function dressIdleAgents(agents: IdleAgent[]) {
  for (const a of agents) {
    const kind = a.view.def.station;
    if (!kind) continue;
    const l = stationLabel(kind);
    a.model.setName(l.name);
    a.model.setTask({ name: l.offer, summary: l.does });
  }
}

/** A board agent waiting by its board before anyone has asked it anything (see buildKiosk), and where. */
export interface IdleAgent {
  model: Worker;
  view: DeskView;
}

/** The board agents waiting by their boards in `w`. */
export function idleAgentsIn(w: World): IdleAgent[] {
  return w.plan.stations.map((def) => {
    const kind = def.station!;
    const agent = STATION_AGENT[kind];
    const model = new Worker(agent.name, agent.color);
    model.setStatus('idle', false);
    model.setTask({ name: STATION_INFO[kind].offer, summary: STATION_INFO[kind].does });
    model.setOutfit(w.plan.agents.outfit === 'peasant' ? 'peasant' : null);
    const view = w.desks.get(def.id)!;
    view.vacancy.children[0].add(model.root);
    noOutline(model.root);
    return { model, view };
  });
}
