export type GenderPayGap = {
  Gender: "Male" | "Female";
  "Pay Grade": "One" | "Two" | "Three" | "Four" | "Five";
  Median: number;
  "75-Percentile": number;
  "25-Percentile": number;
  Max: number;
  Min: number;
};

export const payGrade = ["One", "Two", "Three", "Four", "Five"];

export const genderPayGap: GenderPayGap[] = [
  {
    Gender: "Male",
    "Pay Grade": "Five",
    Median: 94000,
    "75-Percentile": 97000,
    "25-Percentile": 92000,
    Max: 103000,
    Min: 85000,
  },
  {
    Gender: "Female",
    "Pay Grade": "Five",
    Median: 83000,
    "75-Percentile": 86000,
    "25-Percentile": 82000,
    Max: 95000,
    Min: 70000,
  },
  {
    Gender: "Male",
    "Pay Grade": "Four",
    Median: 65000,
    "75-Percentile": 68000,
    "25-Percentile": 63000,
    Max: 70000,
    Min: 54000,
  },
  {
    Gender: "Female",
    "Pay Grade": "Four",
    Median: 54000,
    "75-Percentile": 60000,
    "25-Percentile": 51000,
    Max: 62000,
    Min: 48000,
  },
  {
    Gender: "Male",
    "Pay Grade": "Three",
    Median: 44000,
    "75-Percentile": 47000,
    "25-Percentile": 40000,
    Max: 49000,
    Min: 36000,
  },
  {
    Gender: "Female",
    "Pay Grade": "Three",
    Median: 38000,
    "75-Percentile": 41000,
    "25-Percentile": 36000,
    Max: 48000,
    Min: 35000,
  },
  {
    Gender: "Male",
    "Pay Grade": "Two",
    Median: 29500,
    "75-Percentile": 30500,
    "25-Percentile": 25000,
    Max: 35000,
    Min: 24000,
  },
  {
    Gender: "Female",
    "Pay Grade": "Two",
    Median: 27000,
    "75-Percentile": 30000,
    "25-Percentile": 26000,
    Max: 35000,
    Min: 25000,
  },
  {
    Gender: "Male",
    "Pay Grade": "One",
    Median: 23000,
    "75-Percentile": 25000,
    "25-Percentile": 20000,
    Max: 26000,
    Min: 19000,
  },
  {
    Gender: "Female",
    "Pay Grade": "One",
    Median: 17500,
    "75-Percentile": 20000,
    "25-Percentile": 16000,
    Max: 21000,
    Min: 15500,
  },
];
