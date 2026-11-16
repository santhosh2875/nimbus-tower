// Everything the site says lives here. Change the words, save, and reload the page.
// The tower, its prices and the contact details are invented for the demo.
//
// Pictures go in assets/tower. "picture" and "plan" are file names without .jpg.
// A room's picture is named <zone id>-<room id>.jpg, for example home-kitchen.jpg.
//
// Positions are in percent of the picture they sit on:
//   band:  where a group of floors is on the tower picture (left, top, width, height)
//   focus: how far across the picture the middle of the tower is (phones show that part)
//   dot:  where a home's marker is on the floor plan (x from the left, y from the top)
// To find a position, open the site with ?place at the end of the address and
// click on the picture: the numbers appear in the corner.
window.NIMBUS = {
  name: "Nimbus 38",
  kind: "Homes in the sky, Gurugram",
  email: "homes@nimbus38.example",
  phone: "+91 124 555 0138",

  title: "Pick your floor.",
  intro: "Twenty floors at 38 Golf Course Road, four homes to a floor. Point at the tower to choose a floor, then walk through the homes on it.",
  facts: [
    ["Floors", "20"],
    ["Homes", "66"],
    ["Height", "78 m"],
    ["Ready", "December 2027"],
  ],
  picture: "tower",
  focus: 64.8,
  startFloor: 12,
  floorHeight: 3.6, // metres from one floor to the next, for the "above the street" figure

  // From the top of the tower down. A zone with a plan can be opened.
  zones: [
    {
      id: "sky",
      name: "Sky Villas",
      from: 19,
      to: 20,
      oneStop: true, // two floors, one home each side: opens as a single level
      line: "Two villas over two floors, each with its own pool on the roof.",
      band: { left: 52.7, top: 14, width: 24.3, height: 9.1 },
      plan: "plan-sky",
      text: "The top two floors hold only two homes. Each has a double-height living room, a private lift lobby and a terrace with a pool, nearly 70 metres above the street.",
      units: [
        { id: "A", kind: "Sky Villa", beds: 4, size: 410, faces: "East, over the golf course", price: 14.5, rise: 0, dot: { x: 28, y: 42 } },
        { id: "B", kind: "Sky Villa", beds: 4, size: 396, faces: "West, over the city", price: 13.9, rise: 0, dot: { x: 55, y: 66 } },
      ],
      rooms: [
        { id: "living", name: "Living room", text: "Two floors of glass on the corner, a marble stair and a view that runs to the Aravalli hills on a clear day." },
        { id: "terrace", name: "Terrace and pool", text: "A long pool along the edge of the roof, a dining table under the pergola and olive trees in pots." },
      ],
    },
    {
      id: "home",
      name: "Residences",
      from: 3,
      to: 18,
      line: "Four homes on every floor: two with three bedrooms, two with two.",
      band: { left: 51.3, top: 23.1, width: 27.2, height: 59.9 },
      plan: "plan-typical",
      text: "Every floor has the same four homes around one lift lobby. Two of them have three bedrooms and two have two, and all four have a balcony the full width of the living room.",
      units: [
        { id: "A", kind: "Corner home", beds: 3, size: 172, faces: "East and south, over the golf course", price: 4.1, rise: 0.05, dot: { x: 26, y: 68 } },
        { id: "B", kind: "Corner home", beds: 3, size: 164, faces: "West and south, over the city", price: 3.85, rise: 0.05, dot: { x: 74, y: 68 } },
        { id: "C", kind: "Garden-side home", beds: 2, size: 121, faces: "East and north, over the gardens", price: 2.7, rise: 0.03, dot: { x: 22, y: 37 } },
        { id: "D", kind: "City-side home", beds: 2, size: 116, faces: "West and north, over the city", price: 2.55, rise: 0.03, dot: { x: 78, y: 37 } },
      ],
      rooms: [
        { id: "living", name: "Living room", text: "Floor-to-ceiling glass on the long side, oak underfoot and room for a table of eight beside the sofas." },
        { id: "kitchen", name: "Kitchen", text: "A stone island you can cook at and eat at, full-height storage and a second, closed kitchen behind it for the heavy work." },
        { id: "bedroom", name: "Main bedroom", text: "A corner of glass, a walk-in wardrobe in walnut and a bathroom with daylight." },
        { id: "balcony", name: "Balcony", text: "Deep enough for a table and chairs, with a glass rail so the view starts at your feet." },
      ],
    },
    {
      id: "lobby",
      name: "Lobby and club",
      from: 0,
      to: 2,
      line: "A double-height lobby, a cafe, the gym and a 25 metre pool in the garden.",
      band: { left: 50.9, top: 83, width: 28, height: 11.6 },
    },
  ],

  // Which homes are taken. A home is its floor and letter, for example 12A.
  sold: "3A 3B 3C 3D 4A 4B 4C 4D 5A 5B 5D 6A 6C 6D 7B 7C 7D 8A 8D 9B 9C 10B 10D 11C 12B 12D 13A 14C 15D 16B 17C",
  held: "5C 9D 11D 13C 16D 19B",

  status: { free: "Available", held: "On hold", sold: "Sold" },
  closedNote: "For residents",
  roomNote: "Every home on these floors has the same finish. The view is the one from your floor.",
};
