(() => {
  "use strict";

  const data = window.NIMBUS;
  const DIR = "assets/tower";
  const IMAGE_TYPES = ["jpg", "png", "webp", "jpeg"];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wide = window.matchMedia("(min-width: 1100px)");

  const $ = (id) => document.getElementById(id);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const mail = (subject) => `mailto:${data.email}?subject=${encodeURIComponent(subject)}`;
  const money = (crore) => `₹${crore.toFixed(2)} Cr`;
  const cells = (pairs) => pairs.map(([label, value]) => {
    const cell = make("div");
    cell.append(make("dt", "", label), make("dd", "", value));
    return cell;
  });

  /* ================= Pictures ================= */

  // A picture may be saved as .jpg, .png or .webp: try each in turn, once.
  const found = new Map();
  function find(name) {
    if (!found.has(name)) {
      found.set(name, new Promise((resolve) => {
        const attempt = (n) => {
          if (n >= IMAGE_TYPES.length) return resolve(null);
          const img = new Image();
          img.onload = () => resolve(img.src);
          img.onerror = () => attempt(n + 1);
          img.src = `${DIR}/${name}.${IMAGE_TYPES[n]}`;
        };
        attempt(0);
      }));
    }
    return found.get(name);
  }

  // Show a picture as an element's background. Until the file exists, the
  // element says which file it is waiting for.
  function picture(el, name) {
    el.classList.add("pic");
    el.classList.remove("is-empty");
    el.style.backgroundImage = "";
    el.dataset.want = name;
    find(name).then((url) => {
      if (el.dataset.want !== name) return; // a newer picture was asked for meanwhile
      if (url) {
        el.style.backgroundImage = `url("${url}")`;
      } else {
        el.classList.add("is-empty");
        el.dataset.file = `${name}.jpg`;
      }
    });
  }

  /* ================= The homes ================= */

  const sold = new Set(data.sold.split(/\s+/));
  const held = new Set(data.held.split(/\s+/));
  const zones = data.zones;
  const zoneOf = (floor) => zones.find((zone) => floor >= zone.from && floor <= zone.to);

  // The floors that can be opened, from the ground up. A two-floor zone of
  // duplex homes opens as one level.
  const stops = [];
  zones.filter((zone) => zone.plan).forEach((zone) => {
    if (zone.oneStop) stops.push(zone.from);
    else for (let f = zone.from; f <= zone.to; f += 1) stops.push(f);
  });
  stops.sort((a, b) => a - b);

  function unitsOn(floor) {
    const zone = zoneOf(floor);
    return zone.units.map((unit) => {
      const code = `${floor}${unit.id}`;
      return {
        ...unit,
        code,
        floor,
        zone,
        price: unit.price + (floor - zone.from) * unit.rise,
        state: sold.has(code) ? "sold" : held.has(code) ? "held" : "free",
      };
    });
  }

  const floorLabel = (floor) => {
    const zone = zoneOf(floor);
    return zone.oneStop ? `Floors ${zone.from} and ${zone.to}` : `Floor ${floor}`;
  };
  const metres = (floor) => `${Math.round(floor * data.floorHeight)} m`;

  /* ================= Header ================= */

  $("markName").textContent = data.name;
  $("markKind").textContent = data.kind;
  $("enquire").href = mail(`Visit: ${data.name}`);

  /* ================= 1. The tower ================= */

  const views = { tower: $("viewTower"), floor: $("viewFloor"), home: $("viewHome") };

  // Where on the screen (in percent) the last floor and home were opened from,
  // so the page can zoom into that spot and back out of it.
  const origins = { floor: [70, 45], home: [35, 50] };

  function centreOf(el, view) {
    const box = el.getBoundingClientRect();
    const frame = view.getBoundingClientRect();
    return [
      clamp(((box.left + box.width / 2 - frame.left) / frame.width) * 100, 0, 100),
      clamp(((box.top + box.height / 2 - frame.top) / frame.height) * 100, 0, 100),
    ];
  }

  $("towerTitle").textContent = data.title;
  $("towerIntro").textContent = data.intro;
  $("towerFacts").append(...cells(data.facts));
  picture($("towerPic"), data.picture);
  $("towerFrame").style.setProperty("--focus", data.focus);

  // Show only homes of one size (0 means every home).
  let bedsWanted = 0;
  const wanted = (unit) => !bedsWanted || unit.beds === bedsWanted;

  const floorLine = $("floorLine");
  const stackRows = new Map(); // floor -> its row in the list
  let shownFloor = null;

  // Put the highlight strip on one floor of the tower picture.
  function placeLine(zone, floor) {
    const count = zone.to - zone.from + 1;
    const whole = zone.oneStop || !zone.plan;
    const each = zone.band.height / count;
    floorLine.style.left = `${zone.band.left}%`;
    floorLine.style.width = `${zone.band.width}%`;
    floorLine.style.top = `${whole ? zone.band.top : zone.band.top + (zone.to - floor) * each}%`;
    floorLine.style.height = `${whole ? zone.band.height : each}%`;
    floorLine.classList.toggle("is-closed", !zone.plan);
    floorLine.hidden = false;
  }

  // Tell the reader about one floor (or one closed group of floors).
  function show(floor) {
    const zone = zoneOf(floor);
    const open = Boolean(zone.plan);
    if (open && zone.oneStop) floor = zone.from;
    shownFloor = floor;

    placeLine(zone, floor);
    stackRows.forEach((row, f) => row.classList.toggle("is-on", open && f === floor));

    $("readZone").textContent = zone.name;
    $("readOpen").hidden = !open;

    if (!open) {
      $("readWord").textContent = "Floors";
      $("readFloor").textContent = zone.from === 0 ? `G to ${zone.to}` : `${zone.from} to ${zone.to}`;
      $("readLine").textContent = `${zone.line} ${data.closedNote}.`;
      $("floorTag").textContent = zone.name;
      return;
    }

    const units = unitsOn(floor).filter(wanted);
    const free = units.filter((unit) => unit.state === "free");
    $("readWord").textContent = zone.oneStop ? "Floors" : "Floor";
    $("readFloor").textContent = zone.oneStop ? `${zone.from}–${zone.to}` : String(floor);
    if (!units.length) {
      $("readLine").textContent = "No homes of this size on this floor.";
    } else if (!free.length) {
      $("readLine").textContent = units.length === 1 ? "This home is taken." : `All ${units.length} homes here are taken.`;
    } else {
      const from = Math.min(...free.map((unit) => unit.price));
      $("readLine").textContent = `${free.length} of ${units.length} ${units.length === 1 ? "home" : "homes"} free, from ${money(from)}`;
    }
    $("readOpen").textContent = zone.oneStop ? `Open the ${zone.name}` : `Open floor ${floor}`;
    $("readOpen").href = `#/${floor}`;
    $("floorTag").textContent = zone.oneStop ? zone.name : `Floor ${floor}`;
  }

  // The strips over the tower. Pointing at a height picks the floor there.
  zones.forEach((zone) => {
    const open = Boolean(zone.plan);
    const band = make("div", open ? "band is-open" : "band");
    band.setAttribute("aria-hidden", "true");
    Object.entries(zone.band).forEach(([side, value]) => { band.style[side] = `${value}%`; });

    const floorAt = (event) => {
      if (!open || zone.oneStop) return zone.from;
      const box = band.getBoundingClientRect();
      const up = 1 - (event.clientY - box.top) / box.height;
      return clamp(zone.from + Math.floor(up * (zone.to - zone.from + 1)), zone.from, zone.to);
    };

    band.addEventListener("pointermove", (event) => {
      const floor = floorAt(event);
      if (floor !== shownFloor) show(floor);
    });
    band.addEventListener("pointerenter", (event) => show(floorAt(event)));
    if (open) {
      band.addEventListener("click", (event) => {
        const floor = floorAt(event);
        show(floor);
        origins.floor = centreOf(floorLine, views.tower);
        window.location.hash = `#/${floor}`;
      });
    }
    $("bands").append(band);
  });

  $("readOpen").addEventListener("click", () => { origins.floor = centreOf(floorLine, views.tower); });

  // Every home, floor by floor.
  [...stops].reverse().forEach((floor) => {
    const zone = zoneOf(floor);
    const row = make("li");
    const link = make("a", "stack-row");
    link.href = `#/${floor}`;
    link.append(make("span", "stack-n", zone.oneStop ? `${zone.from}–${zone.to}` : String(floor)));
    const strip = make("span", "stack-cells");
    const units = unitsOn(floor);
    units.forEach((unit) => {
      const cell = make("i", `cell is-${unit.state}`);
      cell.dataset.beds = unit.beds;
      strip.append(cell);
    });
    link.append(strip);
    const free = units.filter((unit) => unit.state === "free").length;
    link.setAttribute("aria-label", `${floorLabel(floor)}: ${free} of ${units.length} homes free`);
    link.addEventListener("pointerenter", () => show(floor));
    link.addEventListener("focus", () => show(floor));
    link.addEventListener("click", () => {
      show(floor);
      origins.floor = centreOf(floorLine, views.tower);
    });
    row.append(link);
    stackRows.set(floor, row);
    $("stackRows").append(row);
  });

  $("key").append(...["free", "held", "sold"].map((state) => {
    const item = make("li");
    item.append(make("i", `cell is-${state}`), document.createTextNode(data.status[state]));
    return item;
  }));

  // Size chips: dim every home that is not the chosen size.
  const sizes = [...new Set(zones.filter((zone) => zone.plan).flatMap((zone) => zone.units.map((unit) => unit.beds)))].sort();
  const chips = [0, ...sizes].map((beds) => {
    const chip = make("button", "chip", beds ? `${beds} bed` : "All");
    chip.type = "button";
    chip.setAttribute("aria-pressed", String(beds === 0));
    chip.addEventListener("click", () => {
      bedsWanted = beds;
      chips.forEach((other) => other.setAttribute("aria-pressed", String(other === chip)));
      document.querySelectorAll(".stack-cells .cell").forEach((cell) => {
        cell.classList.toggle("is-dim", Boolean(beds) && Number(cell.dataset.beds) !== beds);
      });
      show(shownFloor);
    });
    return chip;
  });
  $("chips").append(...chips);

  show(data.startFloor);

  /* ================= 2. A floor ================= */

  function fillFloor(floor, moved) {
    const zone = zoneOf(floor);
    const units = unitsOn(floor);
    const free = units.filter((unit) => unit.state === "free");

    $("floorWhere").textContent = zone.oneStop ? `${data.name}, ${floorLabel(floor).toLowerCase()}` : `${data.name}, ${zone.name}`;
    $("floorName").textContent = zone.oneStop ? zone.name : floorLabel(floor);
    $("floorText").textContent = zone.text;
    $("floorEnquire").href = mail(`Visit: ${data.name}, ${floorLabel(floor).toLowerCase()}`);
    picture($("planPic"), zone.plan);

    $("floorFacts").replaceChildren(...cells([
      ["Homes free", `${free.length} of ${units.length}`],
      ["Above the street", metres(floor)],
      ["From", free.length ? money(Math.min(...free.map((unit) => unit.price))) : "All taken"],
    ]));

    // The floors above and below.
    const at = stops.indexOf(floor);
    [["floorUp", stops[at + 1]], ["floorDown", stops[at - 1]]].forEach(([id, other]) => {
      const link = $(id);
      if (other === undefined) {
        link.removeAttribute("href");
        link.setAttribute("aria-disabled", "true");
      } else {
        link.href = `#/${other}`;
        link.removeAttribute("aria-disabled");
        link.title = floorLabel(other);
      }
    });

    const dots = [];
    const rows = [];
    const light = (i, on) => {
      dots[i].classList.toggle("is-hot", on);
      rows[i].classList.toggle("is-hot", on);
    };

    units.forEach((unit, i) => {
      const href = `#/${floor}/${unit.id}`;
      const summary = `${unit.beds} bed, ${unit.size} m²`;

      // The marker on the plan.
      const dot = make("a", `dot is-${unit.state}`, unit.id);
      dot.href = href;
      dot.style.left = `${unit.dot.x}%`;
      dot.style.top = `${unit.dot.y}%`;
      dot.setAttribute("aria-label", `${unit.code}, ${summary}, ${data.status[unit.state]}`);
      const label = make("span", "dot-label");
      label.append(make("b", "", `${unit.code}, ${summary}`), make("small", "", unit.state === "sold" ? data.status.sold : `${money(unit.price)}, ${data.status[unit.state].toLowerCase()}`));
      dot.append(label);
      dots.push(dot);

      // The same home in the panel's list.
      const row = make("li", `is-${unit.state}`);
      const link = make("a");
      link.href = href;
      link.append(
        make("span", "unit-code", unit.code),
        make("span", "unit-what", summary),
        make("span", "unit-price", unit.state === "sold" ? "" : money(unit.price)),
        make("span", `pill is-${unit.state}`, data.status[unit.state]),
      );
      row.append(link);
      rows.push(row);

      [dot, link].forEach((el) => {
        el.addEventListener("click", () => { origins.home = centreOf(dot, views.floor); });
        el.addEventListener("pointerenter", () => light(i, true));
        el.addEventListener("pointerleave", () => light(i, false));
        el.addEventListener("focus", () => light(i, true));
        el.addEventListener("blur", () => light(i, false));
      });
    });
    $("dots").replaceChildren(...dots);
    $("unitList").replaceChildren(...rows);

    zone.rooms.forEach((room) => find(`${zone.id}-${room.id}`)); // start fetching the room pictures now

    // Going up a floor, the plan arrives from above; going down, from below.
    if (moved && !reducedMotion && $("planFrame").animate) {
      const from = moved > 0 ? -34 : 34;
      $("planFrame").animate(
        [{ transform: `translateY(${from}px)`, opacity: 0 }, { transform: "translateY(0)", opacity: 1 }],
        { duration: 420, easing: "cubic-bezier(0.2, 0.7, 0.1, 1)" },
      );
    }
  }

  /* ================= 3. A home ================= */

  function fillHome(floor, unit, room, fade) {
    const zone = unit.zone;
    $("homeWhere").textContent = `${floorLabel(floor)}, ${zone.name}`;
    $("homeName").textContent = unit.code;
    $("homeKind").textContent = `${unit.beds} bedroom ${unit.kind.toLowerCase()}`;
    $("homePrice").textContent = money(unit.price);
    $("homeStatus").textContent = data.status[unit.state];
    $("homeStatus").className = `pill is-${unit.state}`;
    $("homeNote").textContent = data.roomNote;
    $("homeFacts").replaceChildren(...cells([
      ["Size", `${unit.size} m²`],
      ["Bedrooms", String(unit.beds)],
      ["Above the street", metres(floor)],
      ["Faces", unit.faces],
    ]));

    const ask = { free: `Book a visit to ${unit.code}`, held: `Join the list for ${unit.code}`, sold: "Ask about a home like this" }[unit.state];
    $("homeEnquire").textContent = ask;
    $("homeEnquire").href = mail(`${ask} (${data.name})`);
    $("homeBack").textContent = zone.oneStop ? `Back to the ${zone.name}` : `Back to floor ${floor}`;
    $("homeBack").href = `#/${floor}`;

    $("roomName").textContent = room.name;
    $("roomText").textContent = room.text;

    $("thumbs").replaceChildren(...zone.rooms.map((other) => {
      const li = make("li");
      const link = make("a");
      link.href = `#/${floor}/${unit.id}/${other.id}`;
      if (other === room) link.setAttribute("aria-current", "true");
      const thumb = make("span", "thumb");
      picture(thumb, `${zone.id}-${other.id}`);
      link.append(thumb, make("span", "thumb-name", other.name));
      li.append(link);
      return li;
    }));

    // Moving between rooms fades the new picture in over the old one.
    const layer = make("div");
    picture(layer, `${zone.id}-${room.id}`);
    const old = [...$("homePics").children];
    $("homePics").append(layer);
    const clear = () => old.forEach((node) => node.remove());
    if (fade && !reducedMotion && layer.animate) {
      layer.animate([{ opacity: 0, transform: "scale(1.03)" }, { opacity: 1, transform: "scale(1)" }], { duration: 600, easing: "cubic-bezier(0.3, 0, 0.2, 1)" }).onfinish = clear;
    } else {
      clear();
    }
  }

  /* ================= Moving between the three ================= */

  const LEVEL = { tower: 0, floor: 1, home: 2 };
  let state = null;
  let running = [];

  // "in" flies into the spot that was clicked; "out" pulls back out of it.
  function swap(prev, next, direction, origin) {
    running.forEach((a) => a.finish());
    running = [];
    next.hidden = false;

    if (reducedMotion || !wide.matches || !prev.animate) {
      prev.hidden = true;
      window.scrollTo(0, 0);
      if (!reducedMotion && next.animate) next.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
      return;
    }

    const spot = `${origin[0]}% ${origin[1]}%`;
    const easing = "cubic-bezier(0.6, 0, 0.2, 1)";
    const near = { transform: "scale(2.6)", filter: "blur(10px)", opacity: 0 };
    const here = { transform: "scale(1)", filter: "blur(0px)", opacity: 1 };
    let leaving;
    let arriving;
    if (direction === "in") {
      prev.style.transformOrigin = spot;
      prev.style.zIndex = 2;
      leaving = prev.animate([here, near], { duration: 760, easing });
      arriving = next.animate([{ transform: "scale(1.08)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 760, easing });
    } else {
      next.style.transformOrigin = spot;
      next.style.zIndex = 2;
      leaving = prev.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(0.95)", opacity: 0 }], { duration: 560, easing });
      arriving = next.animate([near, here], { duration: 760, easing });
    }
    running = [leaving, arriving];
    leaving.onfinish = () => {
      prev.hidden = true;
      [prev, next].forEach((view) => {
        view.style.transformOrigin = "";
        view.style.zIndex = "";
      });
    };
  }

  // The address says where you are: #/ is the tower, #/12 a floor,
  // #/12/A a home and #/12/A/kitchen one room of it.
  function read() {
    const parts = window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    const floor = Number(parts[0]);
    if (!stops.includes(floor)) return { level: "tower" };
    const unit = unitsOn(floor).find((u) => u.id === (parts[1] || "").toUpperCase());
    if (!unit) return { level: "floor", floor };
    const room = unit.zone.rooms.find((r) => r.id === parts[2]) || unit.zone.rooms[0];
    return { level: "home", floor, unit, room };
  }

  function route() {
    const next = read();
    const sameLevel = Boolean(state) && state.level === next.level;

    if (next.level !== "tower") {
      const moved = sameLevel && next.level === "floor" ? next.floor - state.floor : 0;
      if (!state || state.floor !== next.floor || next.level === "floor") fillFloor(next.floor, moved);
      show(next.floor);
    }
    if (next.level === "home") fillHome(next.floor, next.unit, next.room, sameLevel);

    if (!state) {
      // First arrival: just show the right view.
      Object.entries(views).forEach(([level, view]) => { view.hidden = level !== next.level; });
    } else if (!sameLevel) {
      const deeper = LEVEL[next.level] > LEVEL[state.level];
      const oneStep = Math.abs(LEVEL[next.level] - LEVEL[state.level]) === 1;
      const between = deeper ? next.level : state.level; // the level whose opening spot applies
      swap(views[state.level], views[next.level], deeper ? "in" : "out", oneStep ? origins[between] : [50, 50]);
    }

    const moved = Boolean(state);
    state = next;
    document.title = [
      next.unit && `${next.unit.code}, ${next.room.name}`,
      next.floor !== undefined && floorLabel(next.floor),
      `${data.name} | ${data.kind}`,
    ].filter(Boolean).join(" | ");
    if (moved && !sameLevel) {
      const heading = { tower: "towerTitle", floor: "floorName", home: "homeName" }[next.level];
      $(heading).focus({ preventScroll: true });
    }
  }

  window.addEventListener("hashchange", route);
  route();

  // Escape goes up one level.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !state || state.level === "tower") return;
    window.location.hash = state.level === "home" ? `#/${state.floor}` : "#/";
  });

  /* ================= Finding positions (?place in the address) ================= */

  if (new URLSearchParams(window.location.search).has("place")) {
    const out = $("placeRead");
    out.hidden = false;
    out.textContent = "Click on the tower or on a floor plan to read a position.";
    document.documentElement.classList.add("is-placing");
    [["towerFrame", "band"], ["planFrame", "dot"]].forEach(([id, kind]) => {
      $(id).addEventListener("click", (event) => {
        const box = $(id).getBoundingClientRect();
        const x = (((event.clientX - box.left) / box.width) * 100).toFixed(1);
        const y = (((event.clientY - box.top) / box.height) * 100).toFixed(1);
        out.textContent = kind === "dot" ? `dot: { x: ${x}, y: ${y} }` : `on the tower picture: ${x}% from the left, ${y}% from the top`;
        event.preventDefault();
        event.stopPropagation();
      }, true);
    });
  }
})();
