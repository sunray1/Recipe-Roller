const SHEET_ID = "1w8XswTHvoTdkI1gOL-TtOqC0zCNddr77ULgjxyWkJgA";
const SHEET_GID = "0";

// This CSV endpoint works when the sheet is publicly viewable.
// No API key or server is required.
const SHEET_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

const bookEl = document.querySelector("#book");
const pageEl = document.querySelector("#page");
const statusEl = document.querySelector("#status");
const rerollBookButton = document.querySelector("#rerollBook");
const rerollPageButton = document.querySelector("#rerollPage");

let cookbooks = [];
let currentBook = null;

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some(value => value.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some(value => value.trim() !== "")) rows.push(row);
  return rows;
}

function parseRanges(value) {
  return value
    .split(";")
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const match = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (!match) throw new Error(`Invalid page range: "${part}"`);

      const start = Number(match[1]);
      const end = Number(match[2]);

      if (start < 1 || end < start) {
        throw new Error(`Invalid page range: "${part}"`);
      }

      return { start, end };
    });
}

function randomIndex(length) {
  if (length <= 0) return 0;

  // Avoid modulo bias when crypto.getRandomValues is available.
  if (globalThis.crypto?.getRandomValues) {
    const max = 0x100000000;
    const limit = max - (max % length);
    const values = new Uint32Array(1);
    let value;
    do {
      crypto.getRandomValues(values);
      value = values[0];
    } while (value >= limit);
    return value % length;
  }

  return Math.floor(Math.random() * length);
}

function chooseDifferent(items, current) {
  if (items.length <= 1) return items[0];
  let choice;
  do {
    choice = items[randomIndex(items.length)];
  } while (choice === current);
  return choice;
}

function randomPage(ranges, avoidPage = null) {
  const totalPages = ranges.reduce(
    (sum, range) => sum + (range.end - range.start + 1),
    0
  );

  if (totalPages <= 0) throw new Error("This cookbook has no valid pages.");

  let chosenPage;
  do {
    let offset = randomIndex(totalPages);

    for (const range of ranges) {
      const size = range.end - range.start + 1;
      if (offset < size) {
        chosenPage = range.start + offset;
        break;
      }
      offset -= size;
    }
  } while (totalPages > 1 && chosenPage === avoidPage);

  return chosenPage;
}

function renderBookAndPage() {
  currentBook = chooseDifferent(cookbooks, currentBook);
  bookEl.textContent = currentBook.name;
  pageEl.textContent = randomPage(currentBook.ranges);
}

function renderPage() {
  if (!currentBook) return;
  const previous = Number(pageEl.textContent);
  pageEl.textContent = randomPage(currentBook.ranges, previous);
}

async function loadCookbooks() {
  try {
    const response = await fetch(SHEET_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Google Sheets returned HTTP ${response.status}.`);
    }

    const rows = parseCSV(await response.text());
    if (rows.length < 2) throw new Error("The sheet does not contain any cookbook rows.");

    // First row is expected to be: Book Name | Page Ranges
    cookbooks = rows
      .slice(1)
      .map((row, index) => {
        const name = (row[0] ?? "").trim();
        const rangeText = (row[1] ?? "").trim();
        if (!name || !rangeText) return null;

        try {
          return { name, ranges: parseRanges(rangeText) };
        } catch (error) {
          console.warn(`Skipping sheet row ${index + 2}:`, error.message);
          return null;
        }
      })
      .filter(Boolean);

    if (!cookbooks.length) throw new Error("No valid cookbook rows were found.");

    rerollBookButton.disabled = false;
    rerollPageButton.disabled = false;
    statusEl.textContent = `${cookbooks.length} cookbooks loaded from Google Sheets.`;
    renderBookAndPage();
  } catch (error) {
    console.error(error);
    bookEl.textContent = "Couldn't load the sheet";
    pageEl.textContent = "—";
    statusEl.classList.add("error");
    statusEl.textContent =
      "Make sure the Google Sheet is shared as “Anyone with the link” (Viewer), then reload this page.";
  }
}

rerollBookButton.addEventListener("click", renderBookAndPage);
rerollPageButton.addEventListener("click", renderPage);

loadCookbooks();
