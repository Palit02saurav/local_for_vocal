const { QueryTypes } = require('sequelize');
const { GeoState, GeoDistrict, sequelize } = require('../models');
const num = (v) => Number(v);

// all states: name, center, box, district count (+ outline when asked)
exports.listStates = async (withGeometry) => {
  const rows = await GeoState.findAll({ order: [['name', 'ASC']] });
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    district_count: s.district_count,
    center: { lat: num(s.center_lat), lng: num(s.center_lng) },
    bbox: [num(s.min_lng), num(s.min_lat), num(s.max_lng), num(s.max_lat)],
    ...(withGeometry ? { geometry: JSON.parse(s.geometry) } : {}),
  }));
};

// districts as a GeoJSON FeatureCollection (optionally one state / only famous)
exports.listDistricts = async ({ state, famous }) => {
  const stateWhere = state ? { name: state } : undefined;
  const where = {};
  if (famous === '1' || famous === 'true') where.is_famous = true;

  const rows = await GeoDistrict.findAll({
    where,
    include: [{ model: GeoState, as: 'state', attributes: ['name'], where: stateWhere }],
    order: [['name', 'ASC']],
  });

  return {
    type: 'FeatureCollection',
    features: rows.map((d) => ({
      type: 'Feature',
      properties: {
        id: d.id,
        st_nm: d.state.name,
        district: d.name,
        is_famous: d.is_famous,
        famous_product: d.famous_product,
        center: { lat: num(d.center_lat), lng: num(d.center_lng) },
        bbox: [num(d.min_lng), num(d.min_lat), num(d.max_lng), num(d.max_lat)],
      },
      geometry: JSON.parse(d.geometry),
    })),
  };
};

exports.listDistrictNames = async () => {
  const rows = await GeoDistrict.findAll({
    attributes: ['name'],
    include: [{ model: GeoState, as: 'state', attributes: ['name'] }],
    order: [['name', 'ASC']],
  });
  return rows.map((d) => ({ state: d.state.name, district: d.name }));
};

exports.listDistrictImages = () =>
  sequelize.query(
    'SELECT state_name, district_name, image_url FROM geo_district_images',
    { type: QueryTypes.SELECT }
  );

exports.saveDistrictImage = async ({ state_name, district_name, image_url }) => {
  if (!state_name || !district_name || !image_url) {
    const err = new Error('State, district and image are required.');
    err.status = 400;
    throw err;
  }
  await sequelize.query(
    `INSERT INTO geo_district_images (state_name, district_name, image_url)
     VALUES (:state_name, :district_name, :image_url)
     ON DUPLICATE KEY UPDATE image_url = VALUES(image_url), updated_at = NOW()`,
    { replacements: { state_name, district_name, image_url } }
  );
};

exports.deleteDistrictImage = async (state_name, district_name) => {
  await sequelize.query(
    'DELETE FROM geo_district_images WHERE state_name = :state_name AND district_name = :district_name',
    { replacements: { state_name, district_name } }
  );
};