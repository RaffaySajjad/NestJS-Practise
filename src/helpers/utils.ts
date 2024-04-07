export const IP_API_FIELDS = 'country,countryCode,lat,lon,currency';

export const calculateDistanceToUS = (destination: {
  lat: number;
  lon: number;
}): number => {
  // Using harvesine formula to calculate distance between two points
  // Assumption: Assuming Washington DC, USA as the origin
  const origin = { lat: 38.9072, lon: -77.0369 };

  // We need to calculate distance in kilometers
  const R = 6371.0;

  const lat1 = toRadians(origin.lat);
  const lon1 = toRadians(origin.lon);
  const lat2 = toRadians(destination.lat);
  const lon2 = toRadians(destination.lon);

  const dlat = lat2 - lat1;
  const dlon = lon2 - lon1;

  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};
