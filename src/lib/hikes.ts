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
    name: "Elephant Hill",
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
  {
    name: "Karura Forest",
    area: "Nairobi County",
    altitude: "1,712 m",
    lat: -1.25,
    lon: 36.8333,
  },
  {
    name: "Rurimeria",
    area: "Aberdare Range",
    altitude: "3,860 m",
    lat: -0.3747,
    lon: 36.6233,
  },
  {
    name: "Table Mountain",
    area: "Aberdare Range",
    altitude: "3,792 m",
    lat: -0.5632,
    lon: 36.5754,
  },
  {
    name: "Mount Kenya (Point Lenana via Sirimon)",
    area: "Meru/Nanyuki",
    altitude: "4,985 m",
    lat: -0.1522,
    lon: 37.3081,
  },
] satisfies [HikeLocation, ...HikeLocation[]];

export const defaultLocation = hikeLocations[0];
