import * as THREE from 'three';
import { DESKS, DESK_SIZE, FLOOR, STATIONS } from '../../../shared/layout';
import { deskPoint } from '../../../shared/nav';
import { mesh, toon } from '../toon';
import type { Fixture } from './fixture';
import { SEAT_PARTS } from './seats';

// Lexia: what changes floor by floor with its oficina.json (see shared/lexia.ts). A floor only for
// meetings puts its desks and kiosks away, and a floor in the 'chica' style has flowers on the desks,
// hearts hanging over them and fairy lights across the room.

declare module '../types' {
  interface OfficeHandles {
    /** Lexia: puts the desks and the board agents' kiosks away (a floor only for meetings), or back. */
    setSoloReuniones(on: boolean): void;
    /** Lexia: the flowers, hearts and fairy lights of a floor in the 'chica' style, or none. */
    setChica(on: boolean): void;
  }
}

const PINKS = ['#ff8fab', '#ffb3c6', '#f72585', '#ffc8dd', '#cdb4db'];

/** A little heart, `size` across, facing +z. */
function heart(size: number, color: string): THREE.Mesh {
  const s = new THREE.Shape();
  s.moveTo(0, -0.5);
  s.bezierCurveTo(-0.15, -0.35, -0.5, -0.1, -0.5, 0.15);
  s.bezierCurveTo(-0.5, 0.4, -0.25, 0.5, 0, 0.3);
  s.bezierCurveTo(0.25, 0.5, 0.5, 0.4, 0.5, 0.15);
  s.bezierCurveTo(0.5, -0.1, 0.15, -0.35, 0, -0.5);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2 });
  geo.center();
  geo.scale(size, size, size);
  return mesh(geo, toon(color), 0, 0, 0, false);
}

/** A vase with three flowers in it, for the corner of a desk. */
function flowers(i: number): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.16, 12), toon('#fff0f3'), 0, 0.08, 0));
  const stem = toon('#57cc99');
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + i;
    const x = Math.cos(a) * 0.04;
    const z = Math.sin(a) * 0.04;
    g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 5), stem, x, 0.24, z, false));
    g.add(mesh(new THREE.SphereGeometry(0.045, 10, 8), toon(PINKS[(i + k) % PINKS.length]), x * 1.4, 0.34 + (k % 2) * 0.03, z * 1.4, false));
  }
  return g;
}

/** A sagging string of little lights from `a` to `b`, glowing in pinks and white. */
function fairyLights(a: THREE.Vector3, b: THREE.Vector3, sag: number): THREE.Group {
  const g = new THREE.Group();
  const mid = a.clone().add(b).multiplyScalar(0.5);
  mid.y -= sag;
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)), new THREE.LineBasicMaterial({ color: '#c9a0b4' })));
  const n = Math.max(6, Math.round(a.distanceTo(b) / 0.6));
  const bulbs = ['#ffffff', '#ffafcc', '#ffc8dd', '#bde0fe'].map((c) => new THREE.MeshBasicMaterial({ color: c }));
  const geo = new THREE.SphereGeometry(0.05, 8, 6);
  for (let i = 1; i < n; i++) {
    const p = curve.getPoint(i / n);
    g.add(mesh(geo, bulbs[i % bulbs.length], p.x, p.y - 0.06, p.z, false));
  }
  return g;
}

export const lexiaFloor: Fixture<'setSoloReuniones' | 'setChica'> = (site) => {
  // The 'chica' style: built once, shown on the floors that have it.
  const chica = new THREE.Group();
  chica.visible = false;
  DESKS.forEach((def, i) => {
    const [fx, fz] = deskPoint(def, DESK_SIZE.width / 2 - 0.18, -(DESK_SIZE.depth / 2 - 0.16));
    const f = flowers(i);
    f.position.set(fx, DESK_SIZE.height, fz);
    chica.add(f);
    const h = heart(0.3, PINKS[i % PINKS.length]);
    const y = 3.1 + (i % 3) * 0.25;
    h.position.set(def.x, y, def.z);
    h.rotation.y = (i * Math.PI) / 5;
    chica.add(h);
    const string = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(def.x, y + 0.18, def.z), new THREE.Vector3(def.x, 6.8, def.z)]), new THREE.LineBasicMaterial({ color: '#e5c1cf' }));
    chica.add(string);
  });
  for (const z of [-8, -2, 4]) chica.add(fairyLights(new THREE.Vector3(FLOOR.minX + 0.3, 4.4, z), new THREE.Vector3(FLOOR.maxX - 0.3, 4.4, z), 0.7));
  site.group.add(chica);

  // A floor only for meetings: its desks and kiosks put away, with what's in the way and what you'd use there.
  let away = false;
  const setSoloReuniones = (on: boolean) => {
    if (on === away) return;
    away = on;
    for (const def of [...DESKS, ...STATIONS]) {
      const view = site.desks.get(def.id);
      const parts = SEAT_PARTS.get(def.id);
      if (view) view.group.visible = !on;
      if (!parts) continue;
      parts.it.off = on;
      const at = site.colliders.indexOf(parts.collider);
      if (on && at >= 0) site.colliders.splice(at, 1);
      else if (!on && at < 0) site.colliders.push(parts.collider);
    }
  };
  return { handle: { setSoloReuniones, setChica: (on: boolean) => void (chica.visible = on) } };
};
