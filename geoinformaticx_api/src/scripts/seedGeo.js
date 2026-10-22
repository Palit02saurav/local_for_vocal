require('dotenv').config();
const { sequelize, GeoState, GeoDistrict } = require('../models');
const { buildGeoData } = require('./geoBuild');

const TOPO_URL =
  'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@2884453/topojson/india.json';

(async () => {
  try {
    console.log('Downloading India map data...');
    const res = await fetch(TOPO_URL);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const topo = await res.json();

    const { states, districts } = buildGeoData(topo);
    console.log(`Prepared ${states.length} states and ${districts.length} districts`);

    await sequelize.transaction(async (t) => {
      // start clean so the script can be run again safely
      await GeoDistrict.destroy({ where: {}, transaction: t });
      await GeoState.destroy({ where: {}, transaction: t });

      const savedStates = await GeoState.bulkCreate(states, { transaction: t });
      const idByName = {};
      savedStates.forEach((s) => (idByName[s.name] = s.id));

      const rows = districts.map(({ state_name, ...d }) => ({
        ...d,
        state_id: idByName[state_name],
      }));
      await GeoDistrict.bulkCreate(rows, { transaction: t });
    });

    console.log('✅ Done. geo_states and geo_districts are filled.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
})();