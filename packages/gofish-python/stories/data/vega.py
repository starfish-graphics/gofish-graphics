"""Vega dataset loaders — mirrors vega-datasets npm package used in JS stories."""

import pandas as pd

_VEGA_CDN = "https://cdn.jsdelivr.net/npm/vega-datasets@2/data"


def load_population():
    """Population data (census). Mirrors population.json."""
    return pd.read_json(f"{_VEGA_CDN}/population.json").to_dict("records")


def load_barley():
    """Barley yield data. Mirrors barley.json."""
    return pd.read_json(f"{_VEGA_CDN}/barley.json").to_dict("records")


def load_cars():
    """Cars dataset. Mirrors cars.json."""
    return pd.read_json(f"{_VEGA_CDN}/cars.json").to_dict("records")


def load_seattle_weather():
    """Seattle weather data. Mirrors seattle-weather.csv."""
    return pd.read_csv(f"{_VEGA_CDN}/seattle-weather.csv").to_dict("records")
