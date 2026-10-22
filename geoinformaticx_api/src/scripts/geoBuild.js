const { feature, merge } = require('topojson-client');

// [State, District, Product] — names spelled as in the map data
const FAMOUS = [
  ['Andhra Pradesh', 'Guntur', 'Red chillies'],
  ['Andhra Pradesh', 'Krishna', 'Wooden toys, Kalamkari prints'],
  ['Andhra Pradesh', 'Anantapur', 'Silk sarees (Dharmavaram)'],
  ['Telangana', 'Yadadri Bhuvanagiri', 'Ikat sarees (Pochampally)'],
  ['Telangana', 'Karimnagar', 'Silver filigree'],
  ['Tamil Nadu', 'Kancheepuram', 'Silk sarees'],
  ['Tamil Nadu', 'Virudhunagar', 'Fireworks, matches, printing (Sivakasi)'],
  ['Tamil Nadu', 'Tiruppur', 'Knitwear and hosiery'],
  ['Tamil Nadu', 'Thanjavur', 'Paintings, bronze work'],
  ['Tamil Nadu', 'Erode', 'Turmeric, handloom'],
  ['Karnataka', 'Ramanagara', 'Wooden toys (Channapatna)'],
  ['Karnataka', 'Bidar', 'Bidriware metal craft'],
  ['Karnataka', 'Haveri', 'Byadgi chillies'],
  ['Karnataka', 'Kodagu', 'Coffee (Coorg)'],
  ['Karnataka', 'Mysuru', 'Silk, sandalwood, incense'],
  ['Kerala', 'Idukki', 'Cardamom and spices'],
  ['Kerala', 'Alappuzha', 'Coir products'],
  ['Maharashtra', 'Nashik', 'Grapes, wine, onions (Lasalgaon)'],
  ['Maharashtra', 'Ratnagiri', 'Alphonso mangoes'],
  ['Maharashtra', 'Kolhapur', 'Chappals, jaggery'],
  ['Maharashtra', 'Aurangabad', 'Paithani sarees (Paithan)'],
  ['Maharashtra', 'Nagpur', 'Oranges'],
  ['Gujarat', 'Surat', 'Diamonds, synthetic textiles'],
  ['Gujarat', 'Morbi', 'Ceramic tiles, wall clocks'],
  ['Gujarat', 'Kutch', 'Embroidery, bandhani'],
  ['Gujarat', 'Patan', 'Patola silk'],
  ['Gujarat', 'Mehsana', 'Cumin and fennel (Unjha)'],
  ['Rajasthan', 'Jaipur', 'Gems and jewellery, block print, blue pottery'],
  ['Rajasthan', 'Bikaner', 'Bhujia and namkeen'],
  ['Rajasthan', 'Nagaur', 'Marble (Makrana)'],
  ['Punjab', 'Ludhiana', 'Hosiery, bicycles'],
  ['Punjab', 'Jalandhar', 'Sports goods'],
  ['Haryana', 'Panipat', 'Blankets, handloom, carpets'],
  ['Uttar Pradesh', 'Moradabad', 'Brassware'],
  ['Uttar Pradesh', 'Firozabad', 'Glass bangles and glassware'],
  ['Uttar Pradesh', 'Aligarh', 'Locks'],
  ['Uttar Pradesh', 'Varanasi', 'Banarasi silk'],
  ['Uttar Pradesh', 'Lucknow', 'Chikankari embroidery'],
  ['Uttar Pradesh', 'Bhadohi', 'Hand-knotted carpets'],
  ['Uttar Pradesh', 'Kannauj', 'Attar (perfume)'],
  ['Uttar Pradesh', 'Meerut', 'Sports goods, scissors'],
  ['Uttar Pradesh', 'Agra', 'Petha, leather shoes'],
  ['Bihar', 'Madhubani', 'Madhubani paintings'],
  ['Bihar', 'Bhagalpur', 'Tussar silk'],
  ['West Bengal', 'Darjeeling', 'Tea'],
  ['West Bengal', 'Malda', 'Mangoes'],
  ['West Bengal', 'Nadia', 'Tant sarees (Shantipur)'],
  ['West Bengal', 'Bankura', 'Terracotta horses'],
  ['Odisha', 'Cuttack', 'Silver filigree'],
  ['Odisha', 'Sambalpur', 'Ikat sarees'],
  ['Assam', 'Dibrugarh', 'Tea'],
  ['Assam', 'Jorhat', 'Tea'],
  ['Assam', 'Kamrup', 'Muga silk (Sualkuchi)'],
  ['Jammu and Kashmir', 'Pulwama', 'Saffron (Pampore)'],
  ['Himachal Pradesh', 'Shimla', 'Apples'],
  ['Himachal Pradesh', 'Kullu', 'Apples, Kullu shawls'],
  ['Madhya Pradesh', 'Ashoknagar', 'Chanderi sarees'],
  ['Madhya Pradesh', 'Khargone', 'Maheshwari sarees'],
  ['Chhattisgarh', 'Bastar', 'Dhokra metal craft'],
];

const round = (n) => Math.round(n * 1e4) / 1e4; // about 11 m, keeps the data small

function roundCoords(c) {
  return typeof c[0] === 'number' ? [round(c[0]), round(c[1])] : c.map(roundCoords);
}

// closes open rings and removes repeated points (Google Maps rejects open rings)
function fixRing(r) {
  const out = r.filter((p, i) => i === 0 || p[0] !== r[i - 1][0] || p[1] !== r[i - 1][1]);
  const a = out[0];
  const b = out[out.length - 1];
  if (a[0] !== b[0] || a[1] !== b[1]) out.push([a[0], a[1]]);
  return out;
}
function fixPolys(polys) {
  return polys.map((poly) => poly.map(fixRing)).filter((poly) => poly[0] && poly[0].length >= 4);
}

function bboxOf(coords) {
  let minLng = 180, minLat = 90, maxLng = -180, maxLat = -90;
  const walk = (c) => {
    if (typeof c[0] === 'number') {
      if (c[0] < minLng) minLng = c[0];
      if (c[0] > maxLng) maxLng = c[0];
      if (c[1] < minLat) minLat = c[1];
      if (c[1] > maxLat) maxLat = c[1];
    } else c.forEach(walk);
  };
  walk(coords);
  return { minLng, minLat, maxLng, maxLat };
}

// Turns the public India TopoJSON into plain rows for the two tables
function buildGeoData(topo) {
  const obj = topo.objects.districts;
  const famous = new Map(FAMOUS.map(([s, d, p]) => [`${s}|${d}`, p]));

  const byState = new Map();
  obj.geometries.forEach((g) => {
    const st = g.properties.st_nm;
    if (!byState.has(st)) byState.set(st, []);
    byState.get(st).push(g);
  });

  const states = [];
  const districts = [];

  byState.forEach((geoms, stateName) => {
    const sGeom = merge(topo, geoms); // one outline for the whole state
    // merge() can return an open ring, or nothing at all for duplicated pieces
    let statePolys = sGeom.coordinates.length ? roundCoords(sGeom.coordinates) : [];
    if (!statePolys.length) {
      geoms.forEach((g) => {
        const f = feature(topo, g);
        const ps = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
        ps.forEach((p) => statePolys.push(roundCoords(p)));
      });
    }
    const sg = { type: 'MultiPolygon', coordinates: fixPolys(statePolys) };
    const sb = bboxOf(sg.coordinates);
    states.push({
      name: stateName,
      district_count: geoms.length,
      min_lat: sb.minLat, min_lng: sb.minLng, max_lat: sb.maxLat, max_lng: sb.maxLng,
      center_lat: round((sb.minLat + sb.maxLat) / 2),
      center_lng: round((sb.minLng + sb.maxLng) / 2),
      geometry: JSON.stringify(sg),
    });

    // a few districts come in two pieces with the same name: join them into one
    const parts = new Map();
    geoms.forEach((g) => {
      const f = feature(topo, g);
      const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      const name = g.properties.district;
      if (!parts.has(name)) parts.set(name, []);
      polys.forEach((p) => parts.get(name).push(roundCoords(p)));
    });

    parts.forEach((polys0, name) => {
      const polys = fixPolys(polys0);
      const geo =
        polys.length === 1
          ? { type: 'Polygon', coordinates: polys[0] }
          : { type: 'MultiPolygon', coordinates: polys };
      const b = bboxOf(geo.coordinates);
      const product = famous.get(`${stateName}|${name}`) || null;
      districts.push({
        state_name: stateName,
        name,
        min_lat: b.minLat, min_lng: b.minLng, max_lat: b.maxLat, max_lng: b.maxLng,
        center_lat: round((b.minLat + b.maxLat) / 2),
        center_lng: round((b.minLng + b.maxLng) / 2),
        is_famous: !!product,
        famous_product: product,
        geometry: JSON.stringify(geo),
      });
    });
    states[states.length - 1].district_count = parts.size;
  });

  return { states, districts, famousCount: FAMOUS.length };
}

module.exports = { buildGeoData };