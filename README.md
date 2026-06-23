# MotoGeo Pro

Python + React prototyp aplikace pro ladeni geometrie motocyklu. Aktualni verze pouziva Python jako vypocetni jadro/API a React jako moderni UI s technickym SVG diagramem.

## Spusteni

React build uz je v `dist/`. Python server servíruje hotovou aplikaci i API:

```powershell
C:\Users\novac\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe backend\server.py
```

Otevri:

```text
http://127.0.0.1:5174/
```

## Vyvoj Reactu

Po uprave `frontend/` znovu sestav:

```powershell
$env:PATH='C:\Users\novac\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:PATH
C:\Users\novac\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd run build
```

## Struktura

- `backend/geometry.py` - Python model geometrie, trail, rake, pitch, rozmery diagramu.
- `backend/server.py` - jednoduchy Python HTTP server a `/api/geometry`.
- `frontend/src/main.jsx` - React aplikace a SVG diagram.
- `frontend/src/styles.css` - vizualni system.
- `dist/` - produkcni React build servirovany Pythonem.

## Co diagram ukazuje

- osu krku rizeni
- osu vidlic
- offset mezi osou krku a osou vidlic
- vysledny trail mezi prusecikem osy krku se zemi a kontaktem predniho kola
- horní a dolní brýle
- cep kyvne vidlice
- kyvnou vidlici a jeji uhel
- osy kol a rozvor

## Model

Zakladni trail:

```text
trail = (R * sin(rake) - offset) / cos(rake)
```

Pitch:

```text
pitch = atan((front_height_delta - rear_height_delta) / wheelbase)
dynamic_rake = base_rake + pitch
```

Je to nastavovaci model, ne plne digitalni dvojce motorky. Pro vyssi presnost bude potreba pridat realne zmerene body konkretni motorky: skutecnou osu krku, souradnice cepu kyvky, vysku os kol, delku vidlic, offset konkretni sady bryli a realny profil pneumatik.
