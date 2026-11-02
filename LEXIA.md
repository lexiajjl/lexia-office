# Agent Office · versión de Lexia

Copia de [Agent Office](https://github.com/AgentSystemLabs/agent-office) (licencia MIT) adaptada para que los tres socios de Lexia trabajen juntos en una oficina virtual: cada socio tiene su planta y sus jefes de departamento, y hay una sala de socios para reunirse.

## Qué cambia respecto al original

| Cambio | Cómo se configura |
| --- | --- |
| Los 3 agentes de los tablones son **jefes de departamento** con nombre, carácter y su propia ficha. Contratan a sus empleados en las mesas de su departamento | `jefes` en `oficina.json` |
| El despacho del altillo lleva el **nombre del socio** de cada planta en vez de "Boss Office" | `socio` o `despacho` |
| Los **tablones de GitHub** (issues, PR y cola de tareas) se abren desde el **ordenador del despacho** | Siempre |
| **Planta solo para reuniones:** sin mesas, sin puestos y sin contratar a nadie | `soloReuniones: true` |
| **Estilo "chica":** flores en las mesas, corazones colgando y guirnaldas de luces | `estilo: "chica"` |
| **Perro a medida:** tamaño de 0.5 a 3 y nuevo pelaje negro (*Black* en ⚙️ → Office dog) | `perro.tamano` |
| **Sin barandillas** en las escaleras, el balcón y la salida. Siguen estando los límites invisibles para no caerse | Siempre |

## `oficina.json`

Va en la raíz del repositorio de cada planta. Las configuraciones de las cuatro plantas de Lexia están en `lexia/plantas/`. Ejemplo:

```json
{
  "socio": "Laura",
  "estilo": "chica",
  "perro": { "tamano": 1 },
  "jefes": {
    "izquierda": { "nombre": "Lola", "departamento": "Procesos y Automatizaciones", "ficha": "departamentos/automatizaciones/JEFE.md", "mesas": ["desk-1", "desk-2", "desk-3", "desk-4"] },
    "centro":    { "nombre": "Coco", "departamento": "Web", "mesas": ["desk-5", "desk-6", "desk-7", "desk-8"] },
    "derecha":   { "nombre": "Luigi", "departamento": "Laboratorio GitHub", "mesas": ["desk-9", "desk-10", "desk-11", "desk-12"] }
  }
}
```

Los puestos de los jefes son:
- `izquierda`: junto al tablón de Issues;
- `centro`: junto a la cola de tareas;
- `derecha`: junto al tablón de PR.

Otros campos opcionales de cada jefe:
- `cargo`;
- `color` (`#rrggbb`);
- `lema`, que es la línea bajo su nombre;
- `ejemplo`, que sale en la caja para escribirle.

Los cambios en `oficina.json` se aplican solos al guardar el archivo. Un jefe que ya estaba contratado sigue con lo que se le dijo al contratarlo: para que lea su ficha nueva, mándalo a casa (**X**) y vuelve a hablarle.

## Instalar en Windows

```powershell
git clone https://github.com/lexiajjl/lexia-office C:\lexia-office
cd C:\lexia-office
powershell -ExecutionPolicy Bypass -File .\lexia\montar.ps1
lexia-oficina
```

`montar.ps1` hace tres cosas:
1. compila la oficina;
2. copia `oficina.json` y el organigrama a las plantas clonadas en `C:\lexia-proyectos\lexiajjl` y los sube a GitHub;
3. crea el comando `lexia-oficina`.

Los datos (plantas, perro, carteles) son los mismos que los de la oficina original.

## Actualizar

```powershell
cd C:\lexia-office
git pull
npm install
```

## En un servidor

Igual que el original (`docs/self-hosting.md`), pero clonando este repositorio en lugar del oficial. Lo preparamos cuando toque subir la oficina a un servidor.
