import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { RotateCcw, Ruler, Settings2, Activity, Gauge, ListChecks, Save, Upload, History, Trash2 } from "lucide-react";
import "./styles.css";

const tireOptions = [
  "110/70 ZR17",
  "120/60 ZR17",
  "120/70 ZR17",
  "125/70 ZR17",
  "180/55 ZR17",
  "190/50 ZR17",
  "190/55 ZR17",
  "200/55 ZR17",
  "200/60 ZR17"
];

const factorySetup = {
  riderWeight: 86,
  frontSag: 38,
  rearSag: 33,
  frontTire: "120/70 ZR17",
  rearTire: "190/50 ZR17",
  curbWeight: 195,
  frontPressure: 2.3,
  rearPressure: 2.5,
  forkProtrusion: 7,
  rearRideHeight: 0,
  tripleOffset: 28,
  frontPreloadTurns: 4,
  frontReboundClicks: 6,
  frontHighCompressionTurns: 3,
  frontLowCompressionClicks: 14,
  rearSpringLength: 161,
  rearReboundClicks: 11,
  rearHighCompressionTurns: 3,
  rearLowCompressionClicks: 14
};

const customSetupKey = "motogeo-gsxr1000-k8-custom-setup-v1";
const setupHistoryKey = "motogeo-gsxr1000-k8-setup-history-v1";
const forkProtrusionMin = -1;
const forkProtrusionMax = 15;
const frontPreloadMaxTurns = 10.5;

const manualReference = {
  frontForkProtrusion: 7,
  frontPreload: "cca 4 otáčky od plně povoleného preloadu / 3.5 rysky vidět",
  frontRebound: "6 kliků ven z plně utažené polohy",
  frontHighCompression: "3 otáčky ven z plně utažené polohy",
  frontLowCompression: "14 kliků ven z plně utažené polohy",
  rearSpringLength: "161 mm",
  rearRebound: "11 kliků ven z plně utažené polohy (E-02/E-19)",
  rearHighCompression: "3 otáčky ven z plně utažené polohy",
  rearLowCompression: "14 kliků ven z plně utažené polohy (E-02/E-19)"
};

function readCustomSetup() {
  try {
    const raw = window.localStorage.getItem(customSetupKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const nextSetup = normalizeSetup({ ...factorySetup, ...parsed }, parsed);
    const hasNewSuspensionFields =
      Object.prototype.hasOwnProperty.call(parsed, "frontPreloadTurns") ||
      Object.prototype.hasOwnProperty.call(parsed, "frontPreloadGrooves") ||
      Object.prototype.hasOwnProperty.call(parsed, "rearSpringLength");
    if (!hasNewSuspensionFields && Number(parsed.forkProtrusion) === 0) {
      nextSetup.forkProtrusion = factorySetup.forkProtrusion;
    }
    return nextSetup;
  } catch {
    return null;
  }
}

function readSetupHistory() {
  try {
    const raw = window.localStorage.getItem(setupHistoryKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => ({
      ...entry,
      setup: normalizeSetup({ ...factorySetup, ...entry.setup }, entry.setup)
    }));
  } catch {
    return [];
  }
}

function normalizeSetup(setup, source = setup) {
  const nextSetup = { ...setup };
  if (
    !Object.prototype.hasOwnProperty.call(source ?? {}, "frontPreloadTurns") &&
    Object.prototype.hasOwnProperty.call(source ?? {}, "frontPreloadGrooves")
  ) {
    nextSetup.frontPreloadTurns = preloadGroovesToTurns(source.frontPreloadGrooves);
  }
  return nextSetup;
}

function App() {
  const [savedSetup, setSavedSetup] = useState(() => readCustomSetup());
  const [setup, setSetup] = useState(() => savedSetup ?? factorySetup);
  const [setupHistory, setSetupHistory] = useState(() => readSetupHistory());
  const [logDraft, setLogDraft] = useState(() => ({
    title: "Baseline",
    place: "",
    conditions: "",
    feedback: "",
    rating: 3
  }));
  const [geometry, setGeometry] = useState(null);
  const [tab, setTab] = useState("measure");
  const [presetMessage, setPresetMessage] = useState(savedSetup ? "Načtena tvoje uložená verze" : "Factory GSX-R 1000 K8");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch("/api/geometry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(setup),
        signal: controller.signal
      })
        .then((res) => res.json())
        .then(setGeometry)
        .catch((error) => {
          if (error.name !== "AbortError") console.error(error);
        });
    }, 80);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [setup]);

  const diagnosis = useMemo(() => buildDiagnosis(setup, geometry), [setup, geometry]);
  const saveHistoryEntry = () => {
    const entry = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      setup,
      geometry,
      ...logDraft
    };
    const nextHistory = [entry, ...setupHistory].slice(0, 80);
    setSetupHistory(nextHistory);
    window.localStorage.setItem(setupHistoryKey, JSON.stringify(nextHistory));
    setLogDraft({
      title: `Změna ${nextHistory.length + 1}`,
      place: logDraft.place,
      conditions: logDraft.conditions,
      feedback: "",
      rating: 3
    });
    setTab("log");
  };

  const deleteHistoryEntry = (entryId) => {
    const nextHistory = setupHistory.filter((entry) => entry.id !== entryId);
    setSetupHistory(nextHistory);
    window.localStorage.setItem(setupHistoryKey, JSON.stringify(nextHistory));
  };

  const loadHistoryEntry = (entry) => {
    setSetup(normalizeSetup({ ...factorySetup, ...entry.setup }, entry.setup));
    setPresetMessage(`Načteno z logu: ${entry.title || formatDateTime(entry.createdAt)}`);
    setTab("measure");
  };

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <div className="kicker"><img className="brand-icon" src="/icon-192.png" alt="" /> MotoGeo Pro</div>
          <h1>GSX-R 1000 K8</h1>
          <p>Geometrie podvozku, sag, offset a trail v jedné garážové PWA.</p>
        </div>
        <button
          className="tool-button"
          onClick={() => {
            setSetup(factorySetup);
            setPresetMessage("Factory GSX-R 1000 K8");
          }}
          aria-label="Reset setup"
        >
          <RotateCcw size={20} />
        </button>
      </header>

      <section className="telemetry-grid elevated-card" aria-label="Geometry values">
        <Metric label="Trail" value={geometry ? `${geometry.trail.toFixed(1)} mm` : "--"} tone="green" />
        <Metric label="Rake" value={geometry ? `${geometry.rakeDeg.toFixed(2)}°` : "--"} tone="orange" />
        <Metric label="Offset" value={`${setup.tripleOffset.toFixed(1)} mm`} tone="blue" />
        <Metric label="Pitch" value={geometry ? `${signed(geometry.pitchDeg)}°` : "--"} tone="violet" />
      </section>

      <section className="diagram-shell elevated-card">
        {geometry ? <MotorcycleDiagram geometry={geometry} setup={setup} /> : <div className="loading">Calculating geometry...</div>}
      </section>

      <nav className="tabs" aria-label="App sections">
        <TabButton active={tab === "measure"} onClick={() => setTab("measure")} icon={<Ruler size={17} />} label="Měření" />
        <TabButton active={tab === "setup"} onClick={() => setTab("setup")} icon={<Settings2 size={17} />} label="Geometrie" />
        <TabButton active={tab === "diagnosis"} onClick={() => setTab("diagnosis")} icon={<Activity size={17} />} label="Diagnostika" />
        <TabButton active={tab === "log"} onClick={() => setTab("log")} icon={<History size={17} />} label="Log" />
        <TabButton active={tab === "guide"} onClick={() => setTab("guide")} icon={<ListChecks size={17} />} label="Postup" />
      </nav>

      <section className="workspace">
        {tab === "measure" && (
          <Panel title="Měřený stav" subtitle="Zadej hodnoty tak, jak motorka reálně stojí s jezdcem ve výbavě.">
            <PresetBar
              setup={setup}
              savedSetup={savedSetup}
              message={presetMessage}
              onFactory={() => {
                setSetup(factorySetup);
                setPresetMessage("Factory GSX-R 1000 K8: 120/70, 190/50, offset 28 mm");
              }}
              onLoadCustom={() => {
                if (!savedSetup) return;
                setSetup(savedSetup);
                setPresetMessage(`Moje uložená verze: zadní ${savedSetup.rearTire}, offset ${savedSetup.tripleOffset} mm`);
              }}
              onSaveCustom={() => {
                window.localStorage.setItem(customSetupKey, JSON.stringify(setup));
                setSavedSetup(setup);
                setPresetMessage(`Uloženo: zadní ${setup.rearTire}, offset ${setup.tripleOffset} mm`);
              }}
            />
            <Range label="Váha jezdce" unit="kg" min={55} max={125} step={1} value={setup.riderWeight} onChange={(riderWeight) => setSetup({ ...setup, riderWeight })} />
            <Range label="Curb weight motorky" unit="kg" min={170} max={230} step={1} value={setup.curbWeight} onChange={(curbWeight) => setSetup({ ...setup, curbWeight })} />
            <div className="field-row">
              <Range label="Tlak přední pneu" unit="bar" min={1.8} max={2.7} step={0.05} value={setup.frontPressure} onChange={(frontPressure) => setSetup({ ...setup, frontPressure })} />
              <Range label="Tlak zadní pneu" unit="bar" min={1.6} max={2.9} step={0.05} value={setup.rearPressure} onChange={(rearPressure) => setSetup({ ...setup, rearPressure })} />
            </div>
            <Range label="Rider sag předek" unit="mm" min={15} max={55} step={1} value={setup.frontSag} onChange={(frontSag) => setSetup({ ...setup, frontSag })} />
            <Range label="Rider sag zadek" unit="mm" min={10} max={55} step={1} value={setup.rearSag} onChange={(rearSag) => setSetup({ ...setup, rearSag })} />
            <div className="field-row">
              <Select label="Přední pneu" value={setup.frontTire} onChange={(frontTire) => setSetup({ ...setup, frontTire })} options={tireOptions} />
              <Select label="Zadní pneu" value={setup.rearTire} onChange={(rearTire) => setSetup({ ...setup, rearTire })} options={tireOptions} />
            </div>
            {geometry ? (
              <div className="model-card">
                <span>Model pneumatik</span>
                <p>
                  Zatížený přední poloměr {geometry.frontLoadedRadius.toFixed(1)} mm
                  {" "}({geometry.frontTireDeflection.toFixed(1)} mm deformace), zadní {geometry.rearLoadedRadius.toFixed(1)} mm
                  {" "}({geometry.rearTireDeflection.toFixed(1)} mm). Odhad zatížení: předek {geometry.frontLoad.toFixed(0)} kg, zadek {geometry.rearLoad.toFixed(0)} kg.
                </p>
              </div>
            ) : null}
          </Panel>
        )}

        {tab === "setup" && (
          <Panel title="Geometrie a kliky" subtitle="Zapiš reálné nastavení motorky. Manuál bere kliky a otáčky ven z plně utažené polohy.">
            <ManualBaseline />
            <Range label="Vidlice nad horními brýlemi bez horní zátky" unit="mm" min={forkProtrusionMin} max={forkProtrusionMax} step={0.5} value={setup.forkProtrusion} onChange={(forkProtrusion) => setSetup({ ...setup, forkProtrusion })} />
            <Range label="Zadní ride height" unit="mm" min={-8} max={12} step={0.5} value={setup.rearRideHeight} onChange={(rearRideHeight) => setSetup({ ...setup, rearRideHeight })} />
            <Range label="Offset brýlí" unit="mm" min={25} max={35} step={0.5} value={setup.tripleOffset} onChange={(tripleOffset) => setSetup({ ...setup, tripleOffset })} />
            <div className="setting-group">
              <h3>Přední vidlice</h3>
              <div className="field-row">
                <Range
                  label="Preload od plně povoleného"
                  unit=""
                  min={0}
                  max={frontPreloadMaxTurns}
                  step={0.25}
                  value={setup.frontPreloadTurns}
                  displayValue={formatFrontPreload(setup.frontPreloadTurns)}
                  onChange={(frontPreloadTurns) => setSetup({ ...setup, frontPreloadTurns })}
                />
                <Range label="Rebound" unit="kliků" min={0} max={12} step={1} value={setup.frontReboundClicks} onChange={(frontReboundClicks) => setSetup({ ...setup, frontReboundClicks })} />
              </div>
              <div className="field-row">
                <Range label="High compression" unit="otáček" min={0} max={4} step={0.25} value={setup.frontHighCompressionTurns} onChange={(frontHighCompressionTurns) => setSetup({ ...setup, frontHighCompressionTurns })} />
                <Range label="Low compression" unit="kliků" min={0} max={20} step={1} value={setup.frontLowCompressionClicks} onChange={(frontLowCompressionClicks) => setSetup({ ...setup, frontLowCompressionClicks })} />
              </div>
            </div>
            <div className="setting-group">
              <h3>Zadní tlumič</h3>
              <Range label="Délka pružiny / preload" unit="mm" min={156} max={166} step={0.5} value={setup.rearSpringLength} onChange={(rearSpringLength) => setSetup({ ...setup, rearSpringLength })} />
              <div className="field-row">
                <Range label="Rebound" unit="kliků" min={0} max={18} step={1} value={setup.rearReboundClicks} onChange={(rearReboundClicks) => setSetup({ ...setup, rearReboundClicks })} />
                <Range label="High compression" unit="otáček" min={0} max={4} step={0.25} value={setup.rearHighCompressionTurns} onChange={(rearHighCompressionTurns) => setSetup({ ...setup, rearHighCompressionTurns })} />
              </div>
              <Range label="Low compression" unit="kliků" min={0} max={20} step={1} value={setup.rearLowCompressionClicks} onChange={(rearLowCompressionClicks) => setSetup({ ...setup, rearLowCompressionClicks })} />
            </div>
            <div className="note-card">
              <Gauge size={18} />
              <p>Offset je kolmá vzdálenost mezi osou krku řízení a osou vidlic v brýlích. Větší offset zkracuje trail, menší offset ho prodlužuje.</p>
            </div>
          </Panel>
        )}

        {tab === "diagnosis" && (
          <Panel title="Diagnostika pocitu" subtitle="První hypotéza podle sagu, trailu a výšek.">
            <div className="diagnosis-card">
              <strong>{diagnosis.title}</strong>
              <p>{diagnosis.summary}</p>
              <ul>
                {diagnosis.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </Panel>
        )}

        {tab === "log" && (
          <SetupLog
            setup={setup}
            geometry={geometry}
            logDraft={logDraft}
            setLogDraft={setLogDraft}
            setupHistory={setupHistory}
            onSave={saveHistoryEntry}
            onLoad={loadHistoryEntry}
            onDelete={deleteHistoryEntry}
          />
        )}

        {tab === "guide" && (
          <SetupGuide setup={setup} geometry={geometry} />
        )}
      </section>
    </main>
  );
}

function ManualBaseline() {
  return (
    <div className="manual-card">
      <span>Servisní manuál GSX-R 1000 K7/K8</span>
      <div className="manual-grid">
        <p>Vidlice baseline: {manualReference.frontForkProtrusion} mm nad horními brýlemi bez horní zátky.</p>
        <p>Předek: preload {manualReference.frontPreload}, rebound {manualReference.frontRebound}, HSC {manualReference.frontHighCompression}, LSC {manualReference.frontLowCompression}.</p>
        <p>Zadek: pružina {manualReference.rearSpringLength}, rebound {manualReference.rearRebound}, HSC {manualReference.rearHighCompression}, LSC {manualReference.rearLowCompression}.</p>
      </div>
    </div>
  );
}

function SetupLog({ setup, geometry, logDraft, setLogDraft, setupHistory, onSave, onLoad, onDelete }) {
  return (
    <Panel title="Historie ladění" subtitle="Ulož aktuální stav, po testu dopiš pocit a kdykoliv se vrať ke starému nastavení.">
      <div className="log-form">
        <TextInput label="Název záznamu" value={logDraft.title} onChange={(title) => setLogDraft({ ...logDraft, title })} />
        <div className="field-row">
          <TextInput label="Místo / trať / silnice" value={logDraft.place} onChange={(place) => setLogDraft({ ...logDraft, place })} />
          <TextInput label="Podmínky" value={logDraft.conditions} onChange={(conditions) => setLogDraft({ ...logDraft, conditions })} />
        </div>
        <Range label="Hodnocení pocitu" unit="/ 5" min={1} max={5} step={1} value={logDraft.rating} onChange={(rating) => setLogDraft({ ...logDraft, rating })} />
        <TextArea
          label="Zpětná vazba"
          value={logDraft.feedback}
          onChange={(feedback) => setLogDraft({ ...logDraft, feedback })}
          placeholder="Např. rychlejší nájezd, nervózní na brzdách, lepší apex, horší grip na výjezdu..."
        />
        <div className="current-setup-card">
          <span>Ukládá se aktuální setup</span>
          <p>{summarizeSetup(setup, geometry)}</p>
        </div>
        <button type="button" className="save-log-button" onClick={onSave}>
          <Save size={17} />
          Uložit záznam
        </button>
      </div>

      <div className="history-list">
        {setupHistory.length === 0 ? (
          <div className="empty-state">
            <History size={22} />
            <p>Zatím tu není žádný záznam. Ulož baseline, pak dělej jednu změnu po druhé a piš si pocit.</p>
          </div>
        ) : (
          setupHistory.map((entry, index) => (
            <HistoryEntry
              key={entry.id}
              entry={entry}
              previousEntry={setupHistory[index + 1]}
              onLoad={() => onLoad(entry)}
              onDelete={() => onDelete(entry.id)}
            />
          ))
        )}
      </div>
    </Panel>
  );
}

function HistoryEntry({ entry, previousEntry, onLoad, onDelete }) {
  const changes = previousEntry ? compareSetups(entry.setup, previousEntry.setup) : ["Baseline záznam"];
  return (
    <article className="history-entry">
      <div className="history-entry-head">
        <div>
          <span>{formatDateTime(entry.createdAt)}</span>
          <h3>{entry.title || "Setup záznam"}</h3>
          <p>{[entry.place, entry.conditions].filter(Boolean).join(" · ") || "Bez místa a podmínek"}</p>
        </div>
        <strong>{entry.rating}/5</strong>
      </div>
      <p className="history-summary">{summarizeSetup(entry.setup, entry.geometry)}</p>
      {entry.feedback ? <p className="history-feedback">{entry.feedback}</p> : null}
      <ul className="change-list">
        {changes.map((change) => (
          <li key={change}>{change}</li>
        ))}
      </ul>
      <div className="history-actions">
        <button type="button" className="preset-button primary" onClick={onLoad}>
          <Upload size={16} />
          Načíst
        </button>
        <button type="button" className="preset-button danger" onClick={onDelete} aria-label="Smazat záznam">
          <Trash2 size={16} />
          Smazat
        </button>
      </div>
    </article>
  );
}

function PresetBar({ setup, savedSetup, message, onFactory, onLoadCustom, onSaveCustom }) {
  const stockChanged =
    setup.rearTire !== factorySetup.rearTire ||
    setup.frontTire !== factorySetup.frontTire ||
    setup.tripleOffset !== factorySetup.tripleOffset ||
    setup.curbWeight !== factorySetup.curbWeight ||
    setup.frontPressure !== factorySetup.frontPressure ||
    setup.rearPressure !== factorySetup.rearPressure;

  return (
    <div className="preset-bar">
      <div>
        <span className="preset-eyebrow">Preset</span>
        <strong>{stockChanged ? "Upravená konfigurace" : "Tovární K8"}</strong>
        <p>{message}</p>
      </div>
      <div className="preset-actions">
        <button type="button" className="preset-button" onClick={onFactory}>
          <RotateCcw size={16} />
          Factory
        </button>
        <button type="button" className="preset-button" onClick={onLoadCustom} disabled={!savedSetup}>
          <Upload size={16} />
          Moje
        </button>
        <button type="button" className="preset-button primary" onClick={onSaveCustom}>
          <Save size={16} />
          Uložit
        </button>
      </div>
    </div>
  );
}

function SetupGuide({ setup, geometry }) {
  const frontSagOk = geometry && setup.frontSag >= geometry.frontSagTarget[0] && setup.frontSag <= geometry.frontSagTarget[1];
  const rearSagOk = geometry && setup.rearSag >= geometry.rearSagTarget[0] && setup.rearSag <= geometry.rearSagTarget[1];

  return (
    <Panel title="Postup nastavení" subtitle="Praktický workflow ve stylu trackside tuningu: měř, měň jednu věc, zapisuj pocit.">
      <div className="guide-status">
        <StatusPill label="Přední sag" ok={frontSagOk} value={geometry ? `${setup.frontSag} mm / cíl ${geometry.frontSagTarget[0]}-${geometry.frontSagTarget[1]}` : "--"} />
        <StatusPill label="Zadní sag" ok={rearSagOk} value={geometry ? `${setup.rearSag} mm / cíl ${geometry.rearSagTarget[0]}-${geometry.rearSagTarget[1]}` : "--"} />
      </div>

      <div className="guide-list">
        <GuideStep
          number="01"
          title="Baseline a měření"
          body="Zapiš tlak pneumatik, teplotu, kliky rebound/compression, počet závitů preloadu, vysunutí vidlic a ride height. Bez baseline nevíš, co změna udělala."
          checks={["měř s jezdcem v kompletní výbavě", "měř opakovaně a zprůměruj", "měň vždy jen jednu věc"]}
        />
        <GuideStep
          number="02"
          title="Sag a preload"
          body="Preload nastavuje pracovní výšku, ne tvrdost pružiny. Nejdřív dostaň rider sag do rozumného rozsahu. Když rozsah nejde trefit preloadem, pružina je mimo pro tvoji váhu."
          checks={["málo sagu = motorka stojí vysoko", "moc sagu = motorka sedí nízko", "po změně preloadu znovu zkontroluj geometrii"]}
        />
        <GuideStep
          number="03"
          title="Rebound"
          body="Rebound řeš až po sagu. Příliš zavřený rebound drží podvozek dole po sérii nerovností. Příliš otevřený rebound nechá motorku odskakovat a vlnit se."
          checks={["zavřené: pomalý návrat, packing down", "otevřené: houpání, odskok, nervozita", "měň po 1-2 kliknutích"]}
        />
        <GuideStep
          number="04"
          title="Compression"
          body="Compression dolaďuje oporu při brzdění, nájezdu a nerovnostech. Když je moc zavřená, motorka je tvrdá a ztrácí grip; když je moc otevřená, rychle se propadá."
          checks={["tvrdé ruce nebo chatter = ubrat compression", "velký dive nebo dorazy = přidat oporu", "nejdřív ověř zdvih a zip-tie na vidlici"]}
        />
        <GuideStep
          number="05"
          title="Když sag sedí, ale chování ne"
          body="Pak už neladíš jen sag, ale postoj motorky. Pokud je řízení těžké a motorka nechce padat do zatáčky, typicky potřebuješ snížit předek nebo zvednout zadek. Pokud je předek nervózní, potřebuješ naopak přidat stabilitu."
          checks={[
            "těžké řízení: zvednout zadek nebo snížit předek po malých krocích",
            "nervózní předek: přidat přední preload / zvednout předek / ubrat zadní ride height",
            "utíká ven: zkontroluj zadní sag, rebound a výšku zadku",
            "po každé změně udělej stejný testovací úsek"
          ]}
        />
      </div>

      <div className="guide-warning">
        <strong>Pravidlo pro tvoji situaci</strong>
        <p>Když nastavíš sag preloadem na svou váhu, ale motorka je v zatáčce divná, preload můžeš použít jako ladění výšky: přidáním předního preloadu zmenšíš přední sag, zvedneš předek a obvykle přidáš stabilitu. Uberáním předního preloadu nebo vysunutím vidlic motorku víc postavíš na předek a zrychlíš zatáčení.</p>
      </div>
    </Panel>
  );
}

function StatusPill({ label, value, ok }) {
  return (
    <div className={`status-pill ${ok ? "ok" : "warn"}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function GuideStep({ number, title, body, checks }) {
  return (
    <article className="guide-step">
      <div className="guide-number">{number}</div>
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
        <ul>
          {checks.map((check) => (
            <li key={check}>{check}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function MotorcycleDiagram({ geometry, setup }) {
  const d = geometry.diagram;
  const steer = d.steeringAxis;
  const fork = d.forkAxis;
  const upper = d.upperClamp;
  const lower = d.lowerClamp;
  const frame = d.frame;
  const bodyPath = [
    `M ${frame.rearTop.x} ${frame.rearTop.y}`,
    `L ${d.swingPivot.x - 10} ${d.swingPivot.y - 18}`,
    `L ${frame.front.x} ${frame.front.y}`,
    `Q ${steer.top.x - 78} ${steer.top.y - 18} ${frame.tankTop.x} ${frame.tankTop.y}`,
    `Q ${steer.top.x - 210} ${steer.top.y - 26} ${frame.tankRear.x} ${frame.tankRear.y}`,
    `L ${frame.tail.x} ${frame.tail.y}`
  ].join(" ");

  return (
    <svg className="moto-diagram" viewBox={d.viewBox} role="img" aria-label="Motorcycle geometry diagram">
      <defs>
        <linearGradient id="frameGradient" x1="0%" x2="100%">
          <stop offset="0%" stopColor="#78a7ff" />
          <stop offset="48%" stopColor="#36d7ff" />
          <stop offset="100%" stopColor="#f6fbff" />
        </linearGradient>
        <linearGradient id="forkGradient" x1="0%" x2="100%">
          <stop offset="0%" stopColor="#ff7a2f" />
          <stop offset="100%" stopColor="#ffd166" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <Grid />
      <line className="ground-axis" x1="20" y1={d.groundY} x2="960" y2={d.groundY} />

      <Wheel center={d.rearAxle} radius={d.rearRadius} label={`zadní ${setup.rearTire}`} labelOffset={{ x: -52, y: -34 }} />
      <Wheel center={d.frontAxle} radius={d.frontRadius} label={`přední ${setup.frontTire}`} labelOffset={{ x: -18, y: -34 }} />

      <line className="datum datum-red" x1={d.rearAxle.x} y1="72" x2={d.rearAxle.x} y2={d.groundY + 18} />
      <line className="datum datum-red" x1={d.frontAxle.x} y1="72" x2={d.frontAxle.x} y2={d.groundY + 18} />

      <path className="body-fairing" d={bodyPath} />
      <path className="frame frame-glow" d={`M ${frame.rearTop.x} ${frame.rearTop.y} L ${d.swingPivot.x} ${d.swingPivot.y} L ${frame.front.x} ${frame.front.y} L ${frame.rearTop.x} ${frame.rearTop.y}`} />
      <path className="frame" d={`M ${frame.rearTop.x} ${frame.rearTop.y} L ${d.swingPivot.x} ${d.swingPivot.y} L ${frame.front.x} ${frame.front.y} L ${frame.rearTop.x} ${frame.rearTop.y}`} />

      <line className="swingarm shadow-line" x1={d.rearAxle.x} y1={d.rearAxle.y} x2={d.swingPivot.x} y2={d.swingPivot.y} />
      <line className="swingarm" x1={d.rearAxle.x} y1={d.rearAxle.y} x2={d.swingPivot.x} y2={d.swingPivot.y} />
      <line className="swingarm secondary" x1={d.rearAxle.x + 8} y1={d.rearAxle.y - 18} x2={d.swingPivot.x - 8} y2={d.swingPivot.y - 18} />

      <line className="head-tube-shadow" x1={upper.stem.x} y1={upper.stem.y} x2={lower.stem.x} y2={lower.stem.y} />
      <line className="head-tube" x1={upper.stem.x} y1={upper.stem.y} x2={lower.stem.x} y2={lower.stem.y} />
      <AxisLine axis={steer} className="steering-axis" />
      <AxisLine axis={fork} className="fork-axis-guide" />
      <line className="fork-tube" x1={fork.top.x} y1={fork.top.y} x2={fork.bottom.x} y2={fork.bottom.y} />
      <line className="fork-tube fork-tube-2" x1={fork.top.x + 14} y1={fork.top.y + 4} x2={fork.bottom.x + 14} y2={fork.bottom.y + 4} />

      <TripleClamp clamp={upper} />
      <TripleClamp clamp={lower} />
      <OffsetBridge steer={steer.top} fork={fork.top} offset={d.offsetMm} />

      <Marker point={d.swingPivot} label="čep kyvky" tone="violet" />
      <Marker point={d.rearAxle} label="osa zadního kola" tone="red" labelOffset={{ x: 14, y: -12 }} />
      <Marker point={d.frontAxle} label="osa předního kola" tone="red" labelOffset={{ x: 16, y: -12 }} />
      <Marker point={steer.top} tone="green" />

      <Dimension x1={d.rearAxle.x} x2={d.frontAxle.x} y={d.groundY + 34} label="rozvor" value={`${d.wheelbaseMm.toFixed(0)} mm`} />
      <Dimension x1={steer.ground.x} x2={d.frontAxle.x} y={d.groundY - 34} label="trail" value={`${d.trailMm.toFixed(1)} mm`} tone="green" />

      <Callout x={steer.top.x - 90} y={steer.top.y - 72} label={`rake ${d.rakeDeg.toFixed(2)}°`} tone="orange" />
      <Callout x={fork.top.x + 70} y={fork.top.y - 6} label="osa vidlic" tone="orange" />
      <Callout x={steer.top.x - 178} y={steer.top.y + 34} label="osa krku řízení" tone="green" />
      <Callout x={upper.center.x + 64} y={upper.center.y - 34} label="horní brýle" tone="blue" />
      <Callout x={lower.center.x + 62} y={lower.center.y + 36} label="dolní brýle" tone="blue" />
      <Callout x={d.swingPivot.x - 4} y={d.swingPivot.y + 40} label="úhel kyvky" tone="violet" />
    </svg>
  );
}

function Grid() {
  const lines = [];
  for (let x = 40; x < 980; x += 40) lines.push(<line key={`x-${x}`} className="grid-line" x1={x} y1="0" x2={x} y2="560" />);
  for (let y = 40; y < 560; y += 40) lines.push(<line key={`y-${y}`} className="grid-line" x1="0" y1={y} x2="980" y2={y} />);
  return <g>{lines}</g>;
}

function Wheel({ center, radius, label, labelOffset }) {
  const spokes = Array.from({ length: 8 }, (_, index) => {
    const angle = (index / 8) * Math.PI * 2;
    return (
      <line
        key={index}
        className="spoke"
        x1={center.x}
        y1={center.y}
        x2={center.x + Math.cos(angle) * radius * 0.58}
        y2={center.y + Math.sin(angle) * radius * 0.58}
      />
    );
  });
  return (
    <g>
      <circle className="tire" cx={center.x} cy={center.y} r={radius} />
      <circle className="rim" cx={center.x} cy={center.y} r={radius * 0.58} />
      {spokes}
      <circle className="axle-dot" cx={center.x} cy={center.y} r="5" />
      <text className="tire-label" x={center.x + labelOffset.x} y={center.y - radius + labelOffset.y}>{label}</text>
    </g>
  );
}

function AxisLine({ axis, className }) {
  return <line className={className} x1={axis.top.x} y1={axis.top.y} x2={axis.ground.x} y2={axis.ground.y} />;
}

function TripleClamp({ clamp }) {
  return (
    <g>
      <line className="triple-clamp-shadow" x1={clamp.stem.x} y1={clamp.stem.y} x2={clamp.fork.x} y2={clamp.fork.y} />
      <line className="triple-clamp" x1={clamp.stem.x} y1={clamp.stem.y} x2={clamp.fork.x} y2={clamp.fork.y} />
    </g>
  );
}

function OffsetBridge({ steer, fork, offset }) {
  return (
    <g>
      <line className="offset-line" x1={steer.x} y1={steer.y} x2={fork.x} y2={fork.y} />
      <text className="offset-label" x={(steer.x + fork.x) / 2 - 38} y={(steer.y + fork.y) / 2 - 28}>offset {offset.toFixed(1)} mm</text>
    </g>
  );
}

function Marker({ point, label, tone, labelOffset = { x: 14, y: -14 } }) {
  return (
    <g>
      <circle className={`marker marker-${tone}`} cx={point.x} cy={point.y} r="10" />
      <circle className="marker-core" cx={point.x} cy={point.y} r="4" />
      {label ? <text className={`marker-label text-${tone}`} x={point.x + labelOffset.x} y={point.y + labelOffset.y}>{label}</text> : null}
    </g>
  );
}

function Dimension({ x1, x2, y, label, value, tone = "blue" }) {
  return (
    <g>
      <line className={`dimension dimension-${tone}`} x1={x1} y1={y} x2={x2} y2={y} />
      <line className={`dimension dimension-${tone}`} x1={x1} y1={y - 8} x2={x1} y2={y + 8} />
      <line className={`dimension dimension-${tone}`} x1={x2} y1={y - 8} x2={x2} y2={y + 8} />
      <text className={`dimension-label text-${tone}`} x={(x1 + x2) / 2 - 58} y={y + 24}>{label} {value}</text>
    </g>
  );
}

function Callout({ x, y, label, tone }) {
  return <text className={`callout text-${tone}`} x={x} y={y}>{label}</text>;
}

function Metric({ label, value, tone }) {
  return (
    <article className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button className={`tab ${active ? "active" : ""}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <div className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Range({ label, unit, value, onChange, min, max, step, displayValue = null }) {
  return (
    <label className="range-field">
      <span>
        {label}
        <b>{displayValue ?? `${formatNumber(value)} ${unit}`}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="select-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function TextInput({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="text-field">
      <span>{label}</span>
      <input type="text" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="text-field">
      <span>{label}</span>
      <textarea value={value} placeholder={placeholder} rows={4} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function buildDiagnosis(setup, geometry) {
  if (!geometry) return { title: "Čekám na výpočet", summary: "", points: [] };
  const trailDelta = geometry.trailDelta;
  const absTrailDelta = Math.abs(trailDelta);
  const highTrail = trailDelta >= 1.5;
  const lowTrail = trailDelta <= -1.5;
  const majorTrailChange = absTrailDelta >= 3.0;
  const frontSagHigh = setup.frontSag > geometry.frontSagTarget[1];
  const frontSagLow = setup.frontSag < geometry.frontSagTarget[0];
  const rearSagHigh = setup.rearSag > geometry.rearSagTarget[1];
  const rearSagLow = setup.rearSag < geometry.rearSagTarget[0];
  const noseDown = geometry.pitchDeg < -0.18;
  const noseUp = geometry.pitchDeg > 0.18;
  const points = [];

  if (majorTrailChange) {
    points.push(
      `Trail je mimo sérii o ${signed(trailDelta)} mm. To už není kosmetika: 3-4 mm jezdec obvykle pozná na nájezdu, tlaku do řídítek i stabilitě na brzdách.`
    );
  } else if (absTrailDelta >= 1.5) {
    points.push(
      `Trail je proti sérii posunutý o ${signed(trailDelta)} mm. I 1.5-2 mm je u sportovní motorky použitelná ladicí změna, ne chyba zaokrouhlení.`
    );
  } else {
    points.push(
      "Trail je velmi blízko sérii. Pokud se motorka i tak chová divně, hledej nejdřív sag, tlak pneumatik, hydrauliku a stav pneumatik."
    );
  }

  if (highTrail) {
    points.push(
      "Delší trail: motorka bude klidnější v přímce a na brzdách, ale může vyžadovat víc síly do řídítek, pomaleji padat do zatáčky a hůř dotahovat utažený oblouk k apexu."
    );
    points.push(
      "Když s delším trailem utíká ven po apexu, často pomůže zvednout zadek, snížit předek nebo zkrátit trail offsetem. Dělej malé kroky a vždy znovu zkontroluj sag."
    );
  }

  if (lowTrail) {
    points.push(
      "Kratší trail: nájezd bude lehčí a motorka ochotněji padne do zatáčky, ale může být nervóznější na brzdách, v rychlých změnách směru a při přidání plynu přes nerovnosti."
    );
    points.push(
      "Pokud je předek neklidný nebo se řídítka rozkmitají, vrať stabilitu: zvedni předek, sniž zadek, přidej trail menším offsetem nebo zkontroluj, jestli rebound nepouští předek moc rychle nahoru."
    );
  }

  if (frontSagHigh) {
    points.push(
      `Přední sag ${setup.frontSag} mm je nad cílem ${geometry.frontSagTarget[0]}-${geometry.frontSagTarget[1]} mm. Předek sedí nízko: při brzdění půjde dřív hluboko do zdvihu, může jít na doraz, zavírat geometrii a ztrácet oporu v první fázi nájezdu.`
    );
  } else if (frontSagLow) {
    points.push(
      `Přední sag ${setup.frontSag} mm je pod cílem ${geometry.frontSagTarget[0]}-${geometry.frontSagTarget[1]} mm. Předek stojí vysoko a má málo využitého negativního zdvihu: motorka může být tvrdá na ruce, méně čitelná na hrbolech a hůř zatáčet.`
    );
  } else {
    points.push(
      `Přední sag ${setup.frontSag} mm je v cíli. Pokud jde vidlice na doraz, neřeš to geometrií jako první: přidej oporu kompresí, ověř hladinu oleje/air gap a pružinu.`
    );
  }

  if (rearSagHigh) {
    points.push(
      `Zadní sag ${setup.rearSag} mm je nad cílem ${geometry.rearSagTarget[0]}-${geometry.rearSagTarget[1]} mm. Zadek sedí nízko, prodlužuje trail a motorka typicky hůř zatáčí, víc se veze po zadku a může utíkat ven ze zatáčky.`
    );
  } else if (rearSagLow) {
    points.push(
      `Zadní sag ${setup.rearSag} mm je pod cílem ${geometry.rearSagTarget[0]}-${geometry.rearSagTarget[1]} mm. Zadek stojí vysoko: motorka zatočí rychleji, ale může ztrácet grip na výjezdu, být nervózní a tvrdá přes hrany.`
    );
  } else {
    points.push(
      `Zadní sag ${setup.rearSag} mm je v cíli. Když motorka pořád nechce držet stopu, pracuj s ride heightem po 1-2 mm a zapisuj pocit v nájezdu, apexu a výjezdu.`
    );
  }

  if (noseDown) {
    points.push(
      `Postoj je víc na předku (${signed(geometry.pitchDeg)}° pitch). Čekej rychlejší reakci na řídítka a lepší ochotu zatočit, ale menší rezervu stability při tvrdém brzdění.`
    );
  } else if (noseUp) {
    points.push(
      `Postoj je víc na zadku (${signed(geometry.pitchDeg)}° pitch). Čekej stabilitu, ale pomalejší překlápění a větší tendenci jet široce, hlavně když je zadní rebound moc zavřený.`
    );
  }

  points.push(
    "Praktický test: na stejném úseku si zapiš čtyři věci - ochota začít zatáčet, stabilita na brzdách, držení apexu a klid na výjezdu. Jedna změna, jeden test, žádné hromadné ladění."
  );

  const title = majorTrailChange
    ? trailDelta > 0
      ? "Trail je citelně delší než série"
      : "Trail je citelně kratší než série"
    : highTrail
      ? "Trail je lehce delší než série"
      : lowTrail
        ? "Trail je lehce kratší než série"
        : frontSagHigh || frontSagLow || rearSagHigh || rearSagLow
          ? "Trail je blízko, ale sag mění chování"
          : "Geometrie je blízko baseline";

  return {
    title,
    summary: `Aktuálně ${geometry.trail.toFixed(1)} mm trail proti sérii ${geometry.preset.published_trail.toFixed(1)} mm, rozdíl ${signed(trailDelta)} mm. Rake ${geometry.rakeDeg.toFixed(2)}°, pitch ${signed(geometry.pitchDeg)}°.`,
    points
  };
}

function signed(value) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function formatNumber(value) {
  if (Number.isInteger(value)) return value.toFixed(0);
  return Math.abs(value * 10 - Math.round(value * 10)) < 0.001 ? value.toFixed(1) : value.toFixed(2);
}

function frontPreloadVisibleGrooves(turns) {
  const preloadTurns = Number.isFinite(Number(turns)) ? Number(turns) : factorySetup.frontPreloadTurns;
  const visibleGrooves = 5.5 - preloadTurns / 2;
  return Math.max(0, Math.min(5, visibleGrooves));
}

function preloadGroovesToTurns(grooves) {
  const turns = (5.5 - Number(grooves)) * 2;
  if (!Number.isFinite(turns)) return factorySetup.frontPreloadTurns;
  return Math.max(0, Math.min(frontPreloadMaxTurns, turns));
}

function formatFrontPreload(turns) {
  const preloadTurns = Number.isFinite(Number(turns)) ? Number(turns) : factorySetup.frontPreloadTurns;
  return `${formatNumber(preloadTurns)} ot. / ${formatNumber(frontPreloadVisibleGrooves(preloadTurns))} rysky vidět`;
}

function formatDateTime(value) {
  try {
    return new Intl.DateTimeFormat("cs-CZ", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return "bez data";
  }
}

function summarizeSetup(setup, geometry) {
  const trail = geometry?.trail ? `trail ${geometry.trail.toFixed(1)} mm` : "trail --";
  return [
    trail,
    `pneu ${setup.frontPressure.toFixed(2)}/${setup.rearPressure.toFixed(2)} bar`,
    `vidlice ${formatNumber(setup.forkProtrusion)} mm`,
    `zadek ${formatNumber(setup.rearRideHeight)} mm`,
    `F preload ${formatFrontPreload(setup.frontPreloadTurns)}, R ${setup.frontReboundClicks} kliků, H ${formatNumber(setup.frontHighCompressionTurns)} ot., L ${setup.frontLowCompressionClicks} kliků`,
    `Z pružina ${formatNumber(setup.rearSpringLength)} mm, R ${setup.rearReboundClicks} kliků, H ${formatNumber(setup.rearHighCompressionTurns)} ot., L ${setup.rearLowCompressionClicks} kliků`
  ].join(" · ");
}

function compareSetups(current, previous) {
  const fields = [
    ["frontPressure", "tlak předek", "bar"],
    ["rearPressure", "tlak zadek", "bar"],
    ["frontSag", "sag předek", "mm"],
    ["rearSag", "sag zadek", "mm"],
    ["forkProtrusion", "vidlice nad brýlemi", "mm"],
    ["rearRideHeight", "zadní ride height", "mm"],
    ["frontPreloadTurns", "přední preload", "otáček"],
    ["frontReboundClicks", "přední rebound", "kliků"],
    ["frontHighCompressionTurns", "přední HSC", "otáček"],
    ["frontLowCompressionClicks", "přední LSC", "kliků"],
    ["rearSpringLength", "zadní pružina", "mm"],
    ["rearReboundClicks", "zadní rebound", "kliků"],
    ["rearHighCompressionTurns", "zadní HSC", "otáček"],
    ["rearLowCompressionClicks", "zadní LSC", "kliků"]
  ];
  const changes = fields
    .map(([key, label, unit]) => {
      const before = Number(previous?.[key]);
      const after = Number(current?.[key]);
      if (!Number.isFinite(before) || !Number.isFinite(after) || Math.abs(after - before) < 0.001) return null;
      const delta = after - before;
      return `${label}: ${formatNumber(before)} -> ${formatNumber(after)} ${unit} (${delta > 0 ? "+" : ""}${formatNumber(delta)})`;
    })
    .filter(Boolean);

  if (current.frontTire !== previous.frontTire) changes.push(`přední pneu: ${previous.frontTire} -> ${current.frontTire}`);
  if (current.rearTire !== previous.rearTire) changes.push(`zadní pneu: ${previous.rearTire} -> ${current.rearTire}`);
  return changes.length ? changes : ["Bez změny hodnot proti předchozímu záznamu"];
}

createRoot(document.getElementById("root")).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  });
}
