export type HikeLocation = {
  name: string;
  area: string;
  altitude: string;
  lat: number;
  lon: number;
};

export const hikeLocations = [
  {
    name: "Ngong Hills",
    area: "Kajiado County",
    altitude: "2,460 m",
    lat: -1.3954,
    lon: 36.6413,
  },
  {
    name: "Longonot",
    area: "Naivasha",
    altitude: "2,776 m",
    lat: -0.9147,
    lon: 36.4569,
  },
  {
    name: "Elephant Hills",
    area: "Aberdare Range",
    altitude: "3,650 m",
    lat: -0.6613,
    lon: 36.7002,
  },
  {
    name: "Kilimabogo",
    area: "Machakos County",
    altitude: "2,145 m",
    lat: -1.0951,
    lon: 37.3362,
  },
] satisfies [HikeLocation, ...HikeLocation[]];

export const defaultLocation = hikeLocations[0];
