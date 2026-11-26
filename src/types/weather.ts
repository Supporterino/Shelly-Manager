export interface WeatherLocation {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  admin2?: string;
  /** District / county — always present and the most reliable disambiguator. */
  admin3?: string;
  /** First postal code, when GeoNames has one for this place (often missing). */
  postcode?: string;
}

export interface GeocodeResult extends WeatherLocation {
  id: number;
  postcodes?: string[];
  country_code?: string;
  population?: number;
}

export interface WeatherCurrent {
  ts: number;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  cloudCover: number;
  windSpeed: number;
  /** Global horizontal irradiance in W/m². */
  radiation: number;
  weatherCode: number;
}

export interface WeatherSample {
  ts: number;
  temperature: number | null;
  radiation: number | null;
  cloudCover: number | null;
  precipitation: number | null;
  windSpeed: number | null;
  windGust: number | null;
  weatherCode: number | null;
}

export interface WeatherSnapshot {
  current: WeatherCurrent;
  /** 15 minute model steps covering yesterday 00:00 to tomorrow 23:45 UTC. */
  samples: WeatherSample[];
  fetchedAt: number;
}
