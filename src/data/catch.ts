export type Lakes =
  | "Lake A"
  | "Lake B"
  | "Lake C"
  | "Lake D"
  | "Lake E"
  | "Lake F";

export type CatchData = {
  lake: Lakes;
  species: "Bass" | "Trout" | "Catfish" | "Perch" | "Salmon";
  count: number;
};

export const catchLocations: Record<Lakes, { x: number; y: number }> = {
  "Lake A": { x: 5.26, y: 22.64 },
  "Lake B": { x: 30.87, y: 120.75 },
  "Lake C": { x: 50.01, y: 60.94 },
  "Lake D": { x: 115.13, y: 94.16 },
  "Lake E": { x: 133.05, y: 50.44 },
  "Lake F": { x: 85.99, y: 172.78 },
};

export const catchLocationsArray = Object.entries(catchLocations).map(
  ([lake, { x, y }]) => ({
    lake,
    x,
    y,
  })
);

export const seafood: CatchData[] = [
  {
    lake: "Lake A",
    species: "Bass",
    count: 23,
  },
  {
    lake: "Lake A",
    species: "Trout",
    count: 31,
  },
  {
    lake: "Lake A",
    species: "Catfish",
    count: 29,
  },
  {
    lake: "Lake A",
    species: "Perch",
    count: 12,
  },
  {
    lake: "Lake A",
    species: "Salmon",
    count: 8,
  },
  {
    lake: "Lake B",
    species: "Bass",
    count: 25,
  },
  {
    lake: "Lake B",
    species: "Trout",
    count: 34,
  },
  {
    lake: "Lake B",
    species: "Catfish",
    count: 41,
  },
  {
    lake: "Lake B",
    species: "Perch",
    count: 21,
  },
  {
    lake: "Lake B",
    species: "Salmon",
    count: 16,
  },
  {
    lake: "Lake C",
    species: "Bass",
    count: 15,
  },
  {
    lake: "Lake C",
    species: "Trout",
    count: 25,
  },
  {
    lake: "Lake C",
    species: "Catfish",
    count: 31,
  },
  {
    lake: "Lake C",
    species: "Perch",
    count: 22,
  },
  {
    lake: "Lake C",
    species: "Salmon",
    count: 31,
  },
  {
    lake: "Lake D",
    species: "Bass",
    count: 12,
  },
  {
    lake: "Lake D",
    species: "Trout",
    count: 17,
  },
  {
    lake: "Lake D",
    species: "Catfish",
    count: 23,
  },
  {
    lake: "Lake D",
    species: "Perch",
    count: 23,
  },
  {
    lake: "Lake D",
    species: "Salmon",
    count: 41,
  },
  {
    lake: "Lake E",
    species: "Bass",
    count: 7,
  },
  {
    lake: "Lake E",
    species: "Trout",
    count: 9,
  },
  {
    lake: "Lake E",
    species: "Catfish",
    count: 13,
  },
  {
    lake: "Lake E",
    species: "Perch",
    count: 20,
  },
  {
    lake: "Lake E",
    species: "Salmon",
    count: 40,
  },
  {
    lake: "Lake F",
    species: "Bass",
    count: 4,
  },
  {
    lake: "Lake F",
    species: "Trout",
    count: 7,
  },
  {
    lake: "Lake F",
    species: "Catfish",
    count: 9,
  },
  {
    lake: "Lake F",
    species: "Perch",
    count: 21,
  },
  {
    lake: "Lake F",
    species: "Salmon",
    count: 47,
  },
];

export const catchData = seafood;

export const catchDataWithLocations = seafood.map((catchItem) => {
  const location = catchLocationsArray.find(
    (loc) => loc.lake === catchItem.lake
  );
  return {
    ...catchItem,
    x: location?.x,
    y: location?.y,
  };
});

export type CatchDataWithLocation = (typeof catchDataWithLocations)[0];
