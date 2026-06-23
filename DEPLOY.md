# Nasazeni MotoGeo Pro online zdarma

Nejjednodussi varianta pro aktualni Python + React verzi je Render Free Web Service.

## Proc Render

Tahle aplikace ma Python API (`/api/geometry`) a React frontend. Ciste staticky hosting jako GitHub Pages nebo Cloudflare Pages by vyzadoval prepsat Python vypocty do JavaScriptu. Render umi zdarma spustit Python web server a zaroven servirovat React build.

## Postup

1. Vytvor GitHub ucet nebo se prihlas.
2. Vytvor novy public repozitar, napr. `motogeo-pro`.
3. Nahraj do nej obsah teto slozky.
4. Otevri https://render.com a prihlas se pres GitHub.
5. Zvol New -> Web Service.
6. Vyber repozitar `motogeo-pro`.
7. Render by mel nacist `render.yaml`.
8. Zkontroluj:
   - Name: `motogeo-pro`
   - Runtime: Python
   - Plan: Free
   - Build command:
     ```text
     npm install -g pnpm
     pnpm install
     pnpm run build
     ```
   - Start command:
     ```text
     python backend/server.py
     ```
9. Klikni Deploy.
10. Po dokonceni dostanes URL ve stylu:
    ```text
    https://motogeo-pro.onrender.com
    ```

## Instalace na iPhone

1. Otevri URL v Safari.
2. Klepni na Share.
3. Zvol Add to Home Screen.
4. Potvrd Add.

Na plose se objevi ikona MotoGeo.

## Omezeni free hostingu

Render free instance muze po neaktivite usnout. Prvni otevreni pak muze trvat dele, typicky desitky sekund. Jakmile se probudi, aplikace jede normalne.

## Alternativa pozdeji

Pokud budeme chtit rychlejsi a ciste staticke hostovani zdarma na GitHub Pages nebo Cloudflare Pages, muzu prepocet geometrie prevest z Pythonu do JavaScriptu. Pak by appka nepotrebovala server a sla by hostovat jako cisty static PWA.
