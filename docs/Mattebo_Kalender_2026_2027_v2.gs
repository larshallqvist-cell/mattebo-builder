/**
 * Mattebo Kalenderhanterare 2026/2027
 * Ersätt hela kodfilen i Apps Script (editorn) med detta.
 * Menyn "Mattebo" skapas automatiskt när du laddar om kalkylbladet.
 */


// ===== VERSION =====
const VERSION = "1.9.0";
const VERSION_DATUM = "2026-11-15";

function versionsText() {
  return "Mattebo Kalender v" + VERSION + " (" + VERSION_DATUM + ")";
}

function visaVersion() {
  SpreadsheetApp.getUi().alert(
    versionsText() +
    "\n\nÄndringar i 1.9.0 – KALENDERN BESTÄMMER:" +
    "\n• Ny funktion: Hämta från kalendern (kalenderns titel, tid, sal och beskrivning skrivs in i bladet)" +
    "\n• Automatiken (autoSynk) hämtar nu FRÅN kalendern till alla fyra flikar – den skriver aldrig över kalendern" +
    "\n• Händelser som tagits bort i kalendern tas bort ur bladet, nya läggs till" +
    "\n• 'Skapa saknade händelser' skapar bara händelser för rader utan kalenderhändelse" +
    "\n• 'Skicka beskrivningar till kalendern' skriver över kalendern och frågar först" +
    "\n\nÄndringar i 1.6.0:" +
    "\n• Ny funktion: Uppdatera beskrivningar (skickar kolumn E till kalendern utan att röra tider)" +
    "\n• Ny funktion: Fyll mall i Beskrivning för tomma rader" +
    "\n• Synken hittar även event utan ID (matchar på starttid)" +
    "\n\nÄndringar i 1.5.0:" +
    "\n• Kolumner enligt bladets rubriker: Titel, Starttid, Varaktighet, Plats, Beskrivning, KalenderEventID" +
    "\n• Starttid = datum + klockslag, Varaktighet = minuter" +
    "\n• KalenderEventID i kolumn F" +
    "\n\nÄndringar i 1.4.0:" +
    "\n• Beskrivning synkas till kalendern" +
    "\n• Rättad tidszon vid skapande av event (Europe/Stockholm)" +
    "\n\nÄndringar i 1.3.0:" +
    "\n• Lovdagar enligt skolans officiella läsårstider" +
    "\n• Sportlov 15/2–19/2, påsklov 30/3–2/4" +
    "\n• Långfredag 26/3 + annandag påsk 29/3 borttagna" +
    "\n• Skolavslutning 11/6 = inga lektioner" +
    "\n\nÄndringar i 1.2.0:" +
    "\n• Nytt schema läsåret 26/27 (inga måndagslektioner)" +
    "\n• Rensning per termin (HT/VT) + tömning av kolumn F" +
    "\n• rensaKalender() rensar hela läsåret för aktiv flik" +
    "\n• Rättat felmeddelande vid rensning och synkning"
  );
}


// ===== SCHEMA (ur Lars schema v36) =====
// Veckodag: 1=mån, 2=tis, 3=ons, 4=tor, 5=fre. 0 & 6 = helg. Måndag = ingen matte.
const SCHEMA = {
  6: [
    { day: 2, start: "13:40", slut: "14:30", sal: "H2" },
    { day: 3, start: "08:45", slut: "09:40", sal: "H2" },
    { day: 3, start: "15:05", slut: "15:35", sal: "H1" },
    { day: 4, start: "08:45", slut: "09:35", sal: "Fjäderm" },
    { day: 4, start: "10:50", slut: "11:25", sal: "Fjäderm" }
  ],
  7: [
    { day: 2, start: "10:00", slut: "10:50", sal: "H3" },
    { day: 2, start: "12:55", slut: "13:35", sal: "H2" },
    { day: 4, start: "12:40", slut: "13:30", sal: "H3" },
    { day: 5, start: "08:45", slut: "09:35", sal: "H1" },
    { day: 5, start: "12:50", slut: "13:35", sal: "H2" }
  ],
  8: [
    { day: 2, start: "08:45", slut: "09:40", sal: "H2", grupp: "8" },
    { day: 2, start: "11:25", slut: "12:10", sal: "H2", grupp: "8" },
    { day: 4, start: "10:00", slut: "10:50", sal: "H2", grupp: "8B" },
    { day: 4, start: "13:35", slut: "14:25", sal: "H2", grupp: "8A" },
    { day: 5, start: "10:00", slut: "10:50", sal: "H2", grupp: "8B" },
    { day: 5, start: "13:40", slut: "14:30", sal: "H2", grupp: "8A" }
  ],
  9: [
    { day: 3, start: "10:00", slut: "11:00", sal: "H1" },
    { day: 3, start: "11:10", slut: "12:05", sal: "H2" },
    { day: 3, start: "13:55", slut: "14:20", sal: "H1" },
    { day: 4, start: "14:25", slut: "15:25", sal: "H1" },
    { day: 5, start: "11:00", slut: "11:40", sal: "H1" }
  ]
};


// ===== TERMINER OCH LOV =====
const TERMINSDATUM = {
  ht: { start: "2026-08-18", end: "2026-12-18" },
  vt: { start: "2027-01-11", end: "2027-06-11" }
};

// Lovdagar: måste matcha SVENSK tidszon (Europe/Stockholm)
const LOV = [
  // HT 2026
  { date: "2026-09-25" },                           // utvecklingssamtal
  { from: "2026-10-26", to: "2026-10-30" },         // höstlov v44
  // VT 2027
  { date: "2027-02-12" },                           // utvecklingssamtal
  { from: "2027-02-15", to: "2027-02-19" },         // sportlov v7
  { date: "2027-03-02" },                           // studiedag
  { date: "2027-03-26" },                           // långfredag (röd dag)
  { date: "2027-03-29" },                           // annandag påsk (röd dag)
  { from: "2027-03-30", to: "2027-04-02" },         // påsklov v13
  { from: "2027-05-06", to: "2027-05-07" },         // Kristi himmelsfärd + klämdag
  { date: "2027-06-11" }                            // skolavslutning kl. 9–11
];

// Åk 9 prao vecka 43 (2026-10-19 -- 2026-10-23)
function isPraoVecka(datum) {
  const vecka = getISOWeek(datum);
  return vecka === 43;
}

function isLov(datum) {
  // datum är alltid ett UTC-förankrat datum (midnatt UTC) → läs det som UTC
  const dStr = Utilities.formatDate(datum, "UTC", "yyyy-MM-dd");
  for (const l of LOV) {
    if (l.date) {
      if (dStr === l.date) return true;
    } else {
      if (dStr >= l.from && dStr <= l.to) return true;
    }
  }
  return false;
}

function getISOWeek(date) {
  const d = new Date(date.getTime());
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}


// ===== MENY =====
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Mattebo")
    .addItem("Hämta från kalendern (denna flik)", "hamtaFranKalender")
    .addItem("Hämta från kalendern (alla flikar)", "hamtaAllaFlikarFranKalender")
    .addSeparator()
    .addItem("Generera lektioner", "genereraLasaar")
    .addItem("Skapa saknade händelser i kalendern", "synkaHelaBladetTillKalender")
    .addItem("Fyll mall i Beskrivning", "fyllMallIBeskrivning")
    .addItem("Skicka beskrivningar till kalendern (skriver över!)", "uppdateraBeskrivningar")
    .addSeparator()
    .addItem("Sätt rubriker", "sattRubriker")
    .addItem("Rensa event-ID (kolumn F)", "rensaEventIdKolumn")
    .addItem("Lista kalendrar", "listaKalendrar")
    .addItem("Om / version", "visaVersion")
    .addSeparator()
    .addSubMenu(
      SpreadsheetApp.getUi()
        .createMenu("Rensa HT")
        .addItem("Åk 6 HT", "rensa6a")
        .addItem("Åk 7 HT", "rensa7a")
        .addItem("Åk 8 HT", "rensa8a")
        .addItem("Åk 9 HT", "rensa9a")
    )
    .addSubMenu(
      SpreadsheetApp.getUi()
        .createMenu("Rensa VT")
        .addItem("Åk 6 VT", "rensa6b")
        .addItem("Åk 7 VT", "rensa7b")
        .addItem("Åk 8 VT", "rensa8b")
        .addItem("Åk 9 VT", "rensa9b")
    )
    .addSeparator()
    .addItem("v" + VERSION + " (" + VERSION_DATUM + ")", "visaVersion")
    .addToUi();
}


// ===== KALENDERID =====
function hittaKalenderId(arskurs) {
  const namn = "Åk " + arskurs + " Letebo";
  const kalendrar = CalendarApp.getOwnedCalendarsByName(namn);
  if (kalendrar.length === 0) {
    throw new Error("Hittade inte kalender: " + namn);
  }
  return kalendrar[0].getId();
}

function listaKalendrar() {
  const loggar = [];
  for (let arskurs = 6; arskurs <= 9; arskurs++) {
    const id = hittaKalenderId(arskurs);
    loggar.push("Åk " + arskurs + " Letebo → " + id);
  }
  Logger.log(loggar.join("\n"));
  SpreadsheetApp.getUi().alert("Kalender-ID\n" + loggar.join("\n"));
}


// ===== RUBRIKER =====
const RUBRIKER = ["Titel", "Starttid", "Varaktighet", "Plats", "Beskrivning", "KalenderEventID"];

function sattRubrikerPa(sheet) {
  sheet.getRange(1, 1, 1, RUBRIKER.length).setValues([RUBRIKER]).setFontWeight("bold");
}

function sattRubriker() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sattRubrikerPa(sheet);
  SpreadsheetApp.getUi().alert("Rubrikerna är satta:\n" + RUBRIKER.join(" | "));
}


// ===== GENERERA LEKTIONER =====
function genereraLasaar() {
  Logger.log(versionsText());
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const namn = sheet.getName();
  const arskurs = arskursFranNamn(namn);
  if (!arskurs) {
    SpreadsheetApp.getUi().alert("Aktiv flik måste heta t.ex. 'Åk 6', 'Åk 7', 'Åk 8', 'Åk 9'.");
    return;
  }

  // Radera allt gammalt innehåll utom rubrikraden
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  sattRubrikerPa(sheet);

  const rader = [];
  genereraTermin(arskurs, TERMINSDATUM.ht.start, TERMINSDATUM.ht.end, rader);
  genereraTermin(arskurs, TERMINSDATUM.vt.start, TERMINSDATUM.vt.end, rader);

  if (rader.length > 0) {
    sheet.getRange(2, 1, rader.length, rader[0].length).setValues(rader);
    sheet.getRange(2, 1, rader.length, RUBRIKER.length).sort([
      { column: 2, ascending: true }
    ]);
  }

  SpreadsheetApp.getUi().alert("Genererade " + rader.length + " lektioner för Åk " + arskurs);
}

function genereraTermin(arskurs, startStr, endStr, rader) {
  const start = parseDateStockholm(startStr);
  const end = parseDateStockholm(endStr);
  const dag = new Date(start);
  while (dag <= end) {
    const day = dag.getUTCDay();
    if (day !== 0 && day !== 6 && !isLov(dag)) {
      if (arskurs === 9 && isPraoVecka(dag)) {
        // Åk 9 har prao v43, ingen matte
      } else {
        processDay(dag, arskurs, rader);
      }
    }
    dag.setUTCDate(dag.getUTCDate() + 1);
  }
}

function processDay(datum, arskurs, rader) {
  const day = datum.getUTCDay(); // 0=sön, 1=mån ... 5=fre
  if (day === 0 || day === 6 || day === 1) return; // helg + måndag = inga lektioner
  const pass = SCHEMA[arskurs] || [];
  pass.filter(p => p.day === day).forEach(p => {
    const titel = "Matte Åk " + (p.grupp || arskurs);
    const datumStr = Utilities.formatDate(datum, "UTC", "yyyy-MM-dd");
    rader.push([
      titel,
      datumStr + " " + p.start,       // Starttid
      minuterMellan(p.start, p.slut), // Varaktighet (minuter)
      p.sal,                          // Plats
      "",                             // Beskrivning (fylls i manuellt)
      ""                              // KalenderEventID (fylls i av synken)
    ]);
  });
}

function minuterMellan(start, slut) {
  const [h1, m1] = String(start).split(":").map(Number);
  const [h2, m2] = String(slut).split(":").map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}

function arskursFranNamn(namn) {
  const m = namn.match(/[Åå]k\s*(\d)/);
  return m ? parseInt(m[1], 10) : null;
}

function parseDateStockholm(str) {
  const [y, mo, d] = str.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, 0, 0, 0));
}


// ===== SKAPA SAKNADE HÄNDELSER =====
// Kalendern bestämmer: befintliga händelser rörs aldrig. Rader som saknar
// händelse kopplas till en befintlig (samma starttid) eller skapas.
function synkaHelaBladetTillKalender() {
  Logger.log(versionsText());
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const namn = sheet.getName();
  const arskurs = arskursFranNamn(namn);
  if (!arskurs) {
    SpreadsheetApp.getUi().alert("Aktiv flik måste heta t.ex. 'Åk 6', 'Åk 7', 'Åk 8', 'Åk 9'.");
    return;
  }

  const c = kolumnerFor(sheet);
  const data = sheet.getDataRange().getValues();
  const kalender = CalendarApp.getCalendarById(hittaKalenderId(arskurs));
  if (!kalender) throw new Error("Kunde inte öppna kalendern för Åk " + arskurs);

  let skapade = 0;
  let kopplade = 0;
  let ororda = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const titel = row[c.titel];
    const starttid = row[c.start];
    const varaktighet = c.varaktighet >= 0 ? Number(row[c.varaktighet]) : 0;
    const plats = c.plats >= 0 && row[c.plats] ? String(row[c.plats]) : "";
    const beskrivning = row[c.beskrivning] ? String(row[c.beskrivning]) : "";
    const eventId = row[c.id] ? String(row[c.id]).trim() : "";

    if (!titel || !starttid || !varaktighet) continue;
    if (eventId) {
      let finns = null;
      try { finns = kalender.getEventById(eventId); } catch (e) { finns = null; }
      if (finns) { ororda++; continue; }
    }

    const startDate = parseStarttid(starttid);
    if (!startDate) continue;
    const endDate = new Date(startDate.getTime() + varaktighet * 60000);

    let event = hittaEventPaStarttid(kalender, titel, startDate);
    if (event) {
      kopplade++;
    } else {
      event = kalender.createEvent(titel, startDate, endDate, { location: plats, description: beskrivning });
      skapade++;
    }
    sheet.getRange(i + 1, c.id + 1).setValue(event.getId());
  }

  SpreadsheetApp.getUi().alert(
    "Klart för Åk " + arskurs +
    "\nSkapade: " + skapade +
    "\nKopplade till befintlig händelse: " + kopplade +
    "\nOrörda (finns redan i kalendern): " + ororda +
    "\n\nKalendern bestämmer – befintliga händelser ändras inte." +
    "\n\n" + versionsText()
  );
}

// ===== HÄMTA FRÅN KALENDERN (kalendern bestämmer) =====
// Kolumnerna hittas via rubrikraden, så extra kolumner (t.ex. Veckodag) får vara kvar.
function kolumnerFor(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), RUBRIKER.length);
  const h = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (x) {
    return String(x || "").trim().toLowerCase();
  });
  const f = function (n) { return h.indexOf(n); };
  const c = {
    titel: f("titel"), start: f("starttid"), varaktighet: f("varaktighet"),
    plats: f("plats"), beskrivning: f("beskrivning"), id: f("kalendereventid"), lastCol: lastCol
  };
  if (c.titel < 0 && c.start < 0 && c.beskrivning < 0 && c.id < 0) {
    return { titel: 0, start: 1, varaktighet: 2, plats: 3, beskrivning: 4, id: 5, lastCol: lastCol };
  }
  if (c.titel < 0 || c.start < 0 || c.beskrivning < 0 || c.id < 0) {
    throw new Error("Rubrikraden i '" + sheet.getName() + "' saknar Titel, Starttid, Beskrivning eller KalenderEventID.");
  }
  return c;
}

function normaliseraId(id) {
  return String(id || "").trim().split("@")[0].toLowerCase();
}

function stockholmText(d) {
  return Utilities.formatDate(d, "Europe/Stockholm", "yyyy-MM-dd HH:mm");
}

/** Hämtar alla händelser för läsåret till en flik. Rör aldrig kalendern. */
function hamtaFlikFranKalender(sheet, arskurs) {
  const kalender = CalendarApp.getCalendarById(hittaKalenderId(arskurs));
  if (!kalender) throw new Error("Kunde inte öppna kalendern för Åk " + arskurs);
  const fran = parseDateStockholm(TERMINSDATUM.ht.start);
  const till = parseDateStockholm(TERMINSDATUM.vt.end);
  till.setUTCDate(till.getUTCDate() + 1);

  const c = kolumnerFor(sheet);
  const lastRow = sheet.getLastRow();
  const data = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, c.lastCol).getValues() : [];

  const radPaId = {};
  const utanIdPaStart = {};
  data.forEach(function (r, i) {
    const id = normaliseraId(r[c.id]);
    if (id) { radPaId[id] = i; return; }
    const d = r[c.start] ? parseStarttid(r[c.start]) : null;
    if (d) {
      const k = Math.round(d.getTime() / 60000);
      utanIdPaStart[k] = utanIdPaStart[k] === undefined ? i : -1; // -1 = flera rader, koppla inte
    }
  });

  const sedda = {};
  const nya = [];
  let andrade = 0;
  let aterkommande = 0;
  let tidAndrad = false;

  kalender.getEvents(fran, till).forEach(function (e) {
    if (e.isAllDayEvent()) return;
    if (e.isRecurringEvent()) { aterkommande++; return; }
    const start = e.getStartTime();
    const varde = {
      titel: e.getTitle() || "",
      start: stockholmText(start),
      varaktighet: Math.round((e.getEndTime().getTime() - start.getTime()) / 60000),
      plats: e.getLocation() || "",
      beskrivning: e.getDescription() || "",
      id: e.getId()
    };

    let i = radPaId[normaliseraId(varde.id)];
    if (i === undefined) {
      const k = utanIdPaStart[Math.round(start.getTime() / 60000)];
      if (k !== undefined && k >= 0 && !sedda[k]) i = k;
    }

    if (i === undefined) {
      const rad = new Array(c.lastCol).fill("");
      sattVarden(rad, c, varde);
      nya.push(rad);
      return;
    }

    sedda[i] = true;
    const r = data[i];
    const gammalStart = r[c.start] ? parseStarttid(r[c.start]) : null;
    const startLika = gammalStart && Math.round(gammalStart.getTime() / 60000) === Math.round(start.getTime() / 60000);
    let andrad = false;
    if (String(r[c.titel] || "") !== varde.titel) { r[c.titel] = varde.titel; andrad = true; }
    if (!startLika) { r[c.start] = varde.start; andrad = true; tidAndrad = true; }
    if (c.varaktighet >= 0 && Number(r[c.varaktighet]) !== varde.varaktighet) { r[c.varaktighet] = varde.varaktighet; andrad = true; }
    if (c.plats >= 0 && String(r[c.plats] || "") !== varde.plats) { r[c.plats] = varde.plats; andrad = true; }
    if (String(r[c.beskrivning] || "") !== varde.beskrivning) { r[c.beskrivning] = varde.beskrivning; andrad = true; }
    if (String(r[c.id] || "").trim() !== varde.id) { r[c.id] = varde.id; andrad = true; }
    if (andrad) andrade++;
  });

  // Rader med händelse-ID inom läsåret som inte längre finns i kalendern tas bort.
  const borttagna = [];
  data.forEach(function (r, i) {
    if (sedda[i] || !normaliseraId(r[c.id])) return;
    const d = r[c.start] ? parseStarttid(r[c.start]) : null;
    if (d && d >= fran && d < till) borttagna.push(i);
  });

  // Skriv bara de kolumner synken äger, så formler i andra kolumner lämnas orörda.
  if (andrade > 0) {
    ["titel", "start", "varaktighet", "plats", "beskrivning", "id"].forEach(function (k) {
      if (c[k] < 0) return;
      sheet.getRange(2, c[k] + 1, data.length, 1).setValues(data.map(function (r) { return [r[c[k]]]; }));
    });
  }
  if (nya.length > 0) {
    const forsta = sheet.getLastRow() + 1;
    ["titel", "start", "varaktighet", "plats", "beskrivning", "id"].forEach(function (k) {
      if (c[k] < 0) return;
      sheet.getRange(forsta, c[k] + 1, nya.length, 1).setValues(nya.map(function (r) { return [r[c[k]]]; }));
    });
  }
  borttagna.sort(function (x, y) { return y - x; }).forEach(function (i) { sheet.deleteRow(i + 2); });

  if (nya.length > 0 || tidAndrad) {
    const antal = sheet.getLastRow() - 1;
    if (antal > 1) sheet.getRange(2, 1, antal, sheet.getLastColumn()).sort([{ column: c.start + 1, ascending: true }]);
  }

  return { andrade: andrade, nya: nya.length, borttagna: borttagna.length, aterkommande: aterkommande };
}

function sattVarden(rad, c, v) {
  ["titel", "start", "varaktighet", "plats", "beskrivning", "id"].forEach(function (k) {
    if (c[k] >= 0) rad[c[k]] = v[k];
  });
}

function hamtaResultatText(arskurs, r) {
  return "Åk " + arskurs + ": " + r.andrade + " uppdaterade, " + r.nya + " nya, " + r.borttagna + " borttagna" +
    (r.aterkommande ? " (" + r.aterkommande + " återkommande hoppades över)" : "");
}

/** Menyval: hämtar kalendern till aktiv flik. */
function hamtaFranKalender() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const arskurs = arskursFranNamn(sheet.getName());
  if (!arskurs) {
    SpreadsheetApp.getUi().alert("Aktiv flik måste heta t.ex. 'Åk 6', 'Åk 7', 'Åk 8', 'Åk 9'.");
    return;
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) { SpreadsheetApp.getUi().alert("En annan synk körs just nu. Försök igen om en minut."); return; }
  try {
    const r = hamtaFlikFranKalender(sheet, arskurs);
    SpreadsheetApp.getUi().alert("Hämtat från kalendern\n" + hamtaResultatText(arskurs, r) + "\n\n" + versionsText());
  } finally {
    lock.releaseLock();
  }
}

/** Hämtar alla flikar "Åk 6"–"Åk 9". Används av menyn och av autoSynk (utan dialogrutor). */
function hamtaAllaFlikar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rader = [];
  for (let arskurs = 6; arskurs <= 9; arskurs++) {
    const sheet = ss.getSheetByName("Åk " + arskurs);
    if (!sheet) { rader.push("Åk " + arskurs + ": fliken saknas"); continue; }
    try {
      rader.push(hamtaResultatText(arskurs, hamtaFlikFranKalender(sheet, arskurs)));
    } catch (e) {
      rader.push("Åk " + arskurs + ": FEL " + e);
    }
  }
  return rader;
}

function hamtaAllaFlikarFranKalender() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) { SpreadsheetApp.getUi().alert("En annan synk körs just nu. Försök igen om en minut."); return; }
  try {
    SpreadsheetApp.getUi().alert("Hämtat från kalendern\n" + hamtaAllaFlikar().join("\n") + "\n\n" + versionsText());
  } finally {
    lock.releaseLock();
  }
}

// Skapar ett datum som motsvarar angiven KLOCKSLAG i svensk tid,
// oavsett vilken tidszon Apps Script-projektet eller kalkylbladet har.
function skapaStockholmDatum(y, mo, d, h, mi) {
  let ms = Date.UTC(y, mo - 1, d, h, mi, 0);
  // Iterera två gånger så att sommar-/vintertid hanteras korrekt
  for (let i = 0; i < 2; i++) {
    const offset = stockholmOffsetMs(new Date(ms));
    ms = Date.UTC(y, mo - 1, d, h, mi, 0) - offset;
  }
  return new Date(ms);
}

function stockholmOffsetMs(date) {
  const z = Utilities.formatDate(date, "Europe/Stockholm", "Z"); // t.ex. "+0200"
  const sign = z.charAt(0) === "-" ? -1 : 1;
  const hours = Number(z.substr(1, 2));
  const mins = Number(z.substr(3, 2));
  return sign * (hours * 60 + mins) * 60000;
}

// Starttid kan vara ett riktigt datumvärde eller texten "yyyy-MM-dd HH:mm".
// Klockslaget tolkas alltid som svensk tid.
function parseStarttid(v) {
  if (v instanceof Date) {
    // Läs av datum/tid i kalkylbladets tidszon och tolka det som svensk tid
    const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    const s = Utilities.formatDate(v, tz, "yyyy-MM-dd HH:mm");
    const p = s.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
    if (!p) return null;
    return skapaStockholmDatum(Number(p[1]), Number(p[2]), Number(p[3]), Number(p[4]), Number(p[5]));
  }
  const s = String(v).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/);
  if (!m) return null;
  return skapaStockholmDatum(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5]));
}


// ===== BESKRIVNINGAR =====
// Mall som fylls i på tomma rader i kolumn E (Beskrivning).
function beskrivningsMall(titel, datumStr) {
  return [
    "Dagens mål:",
    "• ",
    "• ",
    "",
    "Vi jobbar med:",
    "• ",
    "",
    "Läxa:",
    "• "
  ].join("\n");
}

// Fyller tomma celler i kolumn E med mallen så att Post-it-lappen får struktur.
function fyllMallIBeskrivning() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert("Inga rader att fylla i.");
    return;
  }
  const range = sheet.getRange(2, 1, lastRow - 1, 6);
  const data = range.getValues();
  let fyllda = 0;
  for (let i = 0; i < data.length; i++) {
    if (!data[i][0]) continue;
    if (String(data[i][4] || "").trim() === "") {
      data[i][4] = beskrivningsMall(data[i][0], data[i][1]);
      fyllda++;
    }
  }
  range.setValues(data);
  SpreadsheetApp.getUi().alert("Fyllde i mall på " + fyllda + " rader.\n\nKör sedan 'Uppdatera beskrivningar'.");
}

// Skickar bladets Beskrivning till befintliga kalenderhändelser.
// OBS: kalendern bestämmer normalt – detta skriver över kalenderns texter och frågar därför först.
function uppdateraBeskrivningar() {
  Logger.log(versionsText());
  const ui = SpreadsheetApp.getUi();
  const svar = ui.alert(
    "Skriva över kalendern?",
    "Kalendern bestämmer. Det här skriver bladets beskrivningar över texterna i kalendern för den här fliken. Ändringar du gjort direkt i kalendern försvinner.\n\nVill du fortsätta?",
    ui.ButtonSet.YES_NO
  );
  if (svar !== ui.Button.YES) return;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const arskurs = arskursFranNamn(sheet.getName());
  if (!arskurs) {
    SpreadsheetApp.getUi().alert("Aktiv flik måste heta t.ex. 'Åk 6', 'Åk 7', 'Åk 8', 'Åk 9'.");
    return;
  }

  const kalender = CalendarApp.getCalendarById(hittaKalenderId(arskurs));
  const data = sheet.getDataRange().getValues();

  let uppdaterade = 0;
  let saknarEvent = 0;
  let tommaRader = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const titel = row[0];
    const starttid = row[1];
    const beskrivning = row[4] ? String(row[4]) : "";
    let eventId = row[5] ? String(row[5]).trim() : "";

    if (!titel || !starttid) continue;
    if (beskrivning.trim() === "") { tommaRader++; continue; }

    const startDate = parseStarttid(starttid);
    if (!startDate) continue;

    let event = null;
    if (eventId) {
      try { event = kalender.getEventById(eventId); } catch (e) { event = null; }
    }
    if (!event) {
      event = hittaEventPaStarttid(kalender, titel, startDate);
      if (event) sheet.getRange(i + 1, 6).setValue(event.getId());
    }

    if (!event) { saknarEvent++; continue; }

    try {
      event.setDescription(beskrivning);
      uppdaterade++;
    } catch (err) {
      Logger.log("Kunde inte uppdatera rad " + (i + 1) + ": " + err);
      saknarEvent++;
    }
  }

  SpreadsheetApp.getUi().alert(
    "Beskrivningar uppdaterade för Åk " + arskurs +
    "\nUppdaterade: " + uppdaterade +
    "\nTomma rader (hoppade över): " + tommaRader +
    "\nHittade ingen händelse: " + saknarEvent +
    "\n\n" + versionsText()
  );
}

// Matchar en rad mot kalenderhändelse på titel + starttid (± 2 minuter).
function hittaEventPaStarttid(kalender, titel, startDate) {
  const fran = new Date(startDate.getTime() - 2 * 60000);
  const till = new Date(startDate.getTime() + 2 * 60000);
  const traffar = kalender.getEvents(fran, till);
  for (const e of traffar) {
    if (String(e.getTitle()).trim() === String(titel).trim()) return e;
  }
  return traffar.length === 1 ? traffar[0] : null;
}


// ===== RENSA =====
function rensaTermin(arskurs, startStr, endStr) {
  Logger.log(versionsText());
  const kalenderId = hittaKalenderId(arskurs);
  const kalender = CalendarApp.getCalendarById(kalenderId);
  const start = parseDateStockholm(startStr);
  const end = parseDateStockholm(endStr);
  end.setDate(end.getDate() + 1); // inkludera sista dagen

  let raderade = 0;
  const events = kalender.getEvents(start, end, { search: "Matte Åk" });
  for (const e of events) {
    try {
      e.deleteEvent();
      raderade++;
    } catch (err) {
      Logger.log("Kunde inte radera: " + e.getTitle() + " - " + err);
    }
  }

  rensaKolumnF(arskurs);

  SpreadsheetApp.getUi().alert(
    "Rensat Åk " + arskurs + " " + startStr + " → " + endStr +
    "\nRaderade " + raderade + " event" +
    "\n\n" + versionsText()
  );
}

// Globala menylänkar måste finnas på top-nivå i Apps Script
function rensa6a() { rensaTermin(6, TERMINSDATUM.ht.start, TERMINSDATUM.ht.end); }
function rensa6b() { rensaTermin(6, TERMINSDATUM.vt.start, TERMINSDATUM.vt.end); }
function rensa7a() { rensaTermin(7, TERMINSDATUM.ht.start, TERMINSDATUM.ht.end); }
function rensa7b() { rensaTermin(7, TERMINSDATUM.vt.start, TERMINSDATUM.vt.end); }
function rensa8a() { rensaTermin(8, TERMINSDATUM.ht.start, TERMINSDATUM.ht.end); }
function rensa8b() { rensaTermin(8, TERMINSDATUM.vt.start, TERMINSDATUM.vt.end); }
function rensa9a() { rensaTermin(9, TERMINSDATUM.ht.start, TERMINSDATUM.ht.end); }
function rensa9b() { rensaTermin(9, TERMINSDATUM.vt.start, TERMINSDATUM.vt.end); }

function rensaEventIdKolumn() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 6, lastRow - 1, 1).clearContent();
  }
}

// Bakåtkompatibelt namn
function rensaKolumnF(arskurs) {
  rensaEventIdKolumn();
}

// Bakåtkompatibel: gamla menyer/utlösare anropar "rensaKalender".
// Rensar aktiv fliks årskurs, först HT och sedan VT.
function rensaKalender() {
  const namn = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getName();
  const arskurs = arskursFranNamn(namn);
  if (!arskurs) {
    SpreadsheetApp.getUi().alert("Kunde inte avgöra årskurs från fliken: " + namn);
    return;
  }
  rensaTermin(arskurs, TERMINSDATUM.ht.start, TERMINSDATUM.ht.end);
  rensaTermin(arskurs, TERMINSDATUM.vt.start, TERMINSDATUM.vt.end);
}


// ===== AUTOMATISK SYNK (TRIGGER) =====
/** Kör en gång manuellt: hämtar från kalendern till bladet var 15:e minut */
function installeraTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'autoSynk') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('autoSynk').timeBased().everyMinutes(15).create();
  Logger.log('Trigger installerad: autoSynk (hämta från kalendern) var 15:e minut.');
}

/** Körs av triggern. Kalendern bestämmer: hämtar till alla flikar, skriver aldrig till kalendern. */
function autoSynk() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) { Logger.log('Autosynk hoppade över: annan synk körs.'); return; }
  try {
    Logger.log(hamtaAllaFlikar().join('\n'));
    Logger.log('Autosynk klar ' + new Date() + ' – ' + versionsText());
  } catch (e) {
    Logger.log('Autosynk FEL: ' + e);
  } finally {
    lock.releaseLock();
  }
}

/** Kör om du vill stänga av automatiken */
function taBortTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'autoSynk') ScriptApp.deleteTrigger(t);
  });
  Logger.log('Automatisk synk avstängd.');
}
