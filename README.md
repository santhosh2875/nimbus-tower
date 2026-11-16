# NIMBUS 38 · Homes in the sky, Gurugram

A site for a 20-floor tower of homes. You point at a picture of the tower to choose a floor, see which homes on that floor are available, on hold or sold, open the floor plan, and walk through a home's rooms. The Residences (floors 3 to 18) and the Sky Villas (floors 19 and 20) have full plans; the lobby and club floors are marked "For residents".

Nimbus 38 is a demo. The tower, its prices and the contact details are invented.

Plain HTML, CSS and JavaScript. No build step and no dependencies.

## Run it
```bash
python -m http.server 5190
```
Then open http://localhost:5190.

## Edit it
Everything the site says is in `config.js`: the tower's facts, the three groups of floors, the homes on each floor with their sizes and prices, the rooms, and which homes are sold or on hold.

Positions are in percent of the picture they sit on: `band` is where a group of floors is on the tower picture, and `dot` is where a home is on the floor plan. To find a position, open the site with `?place` at the end of the address and click on the picture; the numbers appear in the corner.

## Media
`assets/tower/` holds the tower picture, the two floor plans, and one picture per room named `<zone id>-<room id>.jpg` (for example `home-kitchen.jpg`).

## Files
```
index.html      all sections
styles.css      all styles
config.js       all the content
app.js          floor picker, plans and room viewer
guide.html      how the pictures were made
```
