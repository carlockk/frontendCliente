export const normalizeCoordinate = (raw) => {
  const lat = Number(raw?.lat);
  const lng = Number(raw?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
};

const isPointOnSegment = (point, start, end) => {
  const cross =
    (point.lng - start.lng) * (end.lat - start.lat) -
    (point.lat - start.lat) * (end.lng - start.lng);
  if (Math.abs(cross) > 1e-10) return false;

  const dot =
    (point.lng - start.lng) * (end.lng - start.lng) +
    (point.lat - start.lat) * (end.lat - start.lat);
  if (dot < 0) return false;

  const squaredLength =
    (end.lng - start.lng) * (end.lng - start.lng) +
    (end.lat - start.lat) * (end.lat - start.lat);
  return dot <= squaredLength;
};

export const isPointInPolygon = (point, polygon = []) => {
  const normalizedPoint = normalizeCoordinate(point);
  if (!normalizedPoint || !Array.isArray(polygon) || polygon.length < 3) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const current = polygon[i];
    const previous = polygon[j];

    if (isPointOnSegment(normalizedPoint, current, previous)) {
      return true;
    }

    const intersects =
      current.lat > normalizedPoint.lat !== previous.lat > normalizedPoint.lat &&
      normalizedPoint.lng <
        ((previous.lng - current.lng) * (normalizedPoint.lat - current.lat)) /
          (previous.lat - current.lat || Number.EPSILON) +
          current.lng;

    if (intersects) inside = !inside;
  }

  return inside;
};

export const resolveMatchingZone = (zones = [], point) => {
  const normalizedPoint = normalizeCoordinate(point);
  if (!normalizedPoint) return null;

  return (
    (Array.isArray(zones) ? zones : []).find((zone) => {
      if (zone?.active === false) return false;
      return isPointInPolygon(normalizedPoint, Array.isArray(zone?.polygon) ? zone.polygon : []);
    }) || null
  );
};
