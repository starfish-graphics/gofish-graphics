"""Shared datasets mirroring packages/gofish-graphics/src/data/catch.ts."""

SEAFOOD = [
    {"lake": "Lake A", "species": "Bass", "count": 23},
    {"lake": "Lake A", "species": "Trout", "count": 31},
    {"lake": "Lake A", "species": "Catfish", "count": 29},
    {"lake": "Lake A", "species": "Perch", "count": 12},
    {"lake": "Lake A", "species": "Salmon", "count": 8},
    {"lake": "Lake B", "species": "Bass", "count": 25},
    {"lake": "Lake B", "species": "Trout", "count": 34},
    {"lake": "Lake B", "species": "Catfish", "count": 41},
    {"lake": "Lake B", "species": "Perch", "count": 21},
    {"lake": "Lake B", "species": "Salmon", "count": 16},
    {"lake": "Lake C", "species": "Bass", "count": 15},
    {"lake": "Lake C", "species": "Trout", "count": 25},
    {"lake": "Lake C", "species": "Catfish", "count": 31},
    {"lake": "Lake C", "species": "Perch", "count": 22},
    {"lake": "Lake C", "species": "Salmon", "count": 31},
    {"lake": "Lake D", "species": "Bass", "count": 12},
    {"lake": "Lake D", "species": "Trout", "count": 17},
    {"lake": "Lake D", "species": "Catfish", "count": 23},
    {"lake": "Lake D", "species": "Perch", "count": 23},
    {"lake": "Lake D", "species": "Salmon", "count": 41},
    {"lake": "Lake E", "species": "Bass", "count": 7},
    {"lake": "Lake E", "species": "Trout", "count": 9},
    {"lake": "Lake E", "species": "Catfish", "count": 13},
    {"lake": "Lake E", "species": "Perch", "count": 20},
    {"lake": "Lake E", "species": "Salmon", "count": 40},
    {"lake": "Lake F", "species": "Bass", "count": 4},
    {"lake": "Lake F", "species": "Trout", "count": 7},
    {"lake": "Lake F", "species": "Catfish", "count": 9},
    {"lake": "Lake F", "species": "Perch", "count": 21},
    {"lake": "Lake F", "species": "Salmon", "count": 47},
]

# Vega-Lite Simple Bar Chart data
SIMPLE_BAR_DATA = [
    {"a": "A", "b": 28},
    {"a": "B", "b": 55},
    {"a": "C", "b": 43},
    {"a": "D", "b": 91},
    {"a": "E", "b": 81},
    {"a": "F", "b": 53},
    {"a": "G", "b": 19},
    {"a": "H", "b": 87},
    {"a": "I", "b": 52},
]

# Vega-Lite Grouped Bar Chart data
GROUPED_BAR_DATA = [
    {"category": "A", "group": "x", "value": 0.1},
    {"category": "A", "group": "y", "value": 0.6},
    {"category": "A", "group": "z", "value": 0.9},
    {"category": "B", "group": "x", "value": 0.7},
    {"category": "B", "group": "y", "value": 0.2},
    {"category": "B", "group": "z", "value": 1.1},
    {"category": "C", "group": "x", "value": 0.6},
    {"category": "C", "group": "y", "value": 0.1},
    {"category": "C", "group": "z", "value": 0.2},
]

# Bar negative data
NEGATIVE_BAR_DATA = [
    {"category": "A", "value": -30},
    {"category": "B", "value": 80},
    {"category": "C", "value": 45},
    {"category": "D", "value": 60},
    {"category": "E", "value": 20},
]
