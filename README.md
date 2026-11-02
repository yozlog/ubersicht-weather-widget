# ubersicht-weather-widget

[繁體中文](README.zh-TW.md) | [한국어](README.ko.md)

A highly customizable weather widget for [Übersicht](https://tracesof.net/uebersicht/) on macOS, with multiple cities and daily and hourly forecasts.

No API key is required to check the weather.

- Weather data is provided by [Open-Meteo](https://open-meteo.com/).
- Location search uses [GeoNames](https://www.geonames.org/) data. Some districts may not appear in search results.

## Installation

Requires macOS, Übersicht, and Node.js. Settings synchronization currently calls `/usr/local/bin/node`. If Node.js is installed elsewhere, update the executable path in `index.jsx`.

1. Download the project and name its folder `ubersicht-weather-widget`.
2. Place the entire folder in `~/Library/Application Support/Übersicht/widgets/`.
3. Select **Refresh All Widgets** in the Übersicht menu, then follow the steps below to add a city.

You can also install directly from Terminal:

```sh
mkdir -p "$HOME/Library/Application Support/Übersicht/widgets"
git clone https://github.com/yozlog/ubersicht-weather-widget.git "$HOME/Library/Application Support/Übersicht/widgets/ubersicht-weather-widget"
```

Then select **Refresh All Widgets** in the Übersicht menu.

## Usage

Enable interaction in Übersicht first.

- **Location**: Manage cities. **→**: Switch cities.
- Hold and drag **☰** to reorder cities.
- **Forecast**: Choose 1–16 forecast days.
- Select a daily forecast to view its hourly forecast.

## Data Updates

- Current weather, daily forecasts, and hourly forecasts refresh every 15 minutes for the selected city.
- Switching cities fetches data for the new city immediately.
- If an update fails, the last successful data from the current session remains visible with a message.
- Timestamps use the city's local time zone.

## City and forecast settings synchronization

`config.json` is the main source of settings. Adding or removing cities, reordering, switching the current city, and changing forecast days in the UI all write back to the file. Direct file edits also apply to the widget. Updates change only the relevant fields, preserving dimensions and other settings.

Example fields; preserve other fields when editing an existing file:

```json
{
  "cities": [
    { "name": "Seoul", "latitude": 37.566, "longitude": 126.9784 },
    { "name": "Taipei", "latitude": 25.033, "longitude": 121.5654 }
  ],
  "location": { "name": "Seoul", "latitude": 37.566, "longitude": 126.9784 },
  "forecastDays": 7
}
```

The order of `cities` determines the switching order. `location` is the current city; when it is `null`, the first saved city is used. `forecastDays` accepts 1–16. Each city needs at least a name, latitude, and longitude. Search result fields such as region and country may also be kept. To clear all cities, set `cities` to `[]` and `location` to `null`.

Keep the file valid JSON. The widget displays a message if saving fails; unsaved changes may be lost after reloading. If you edit the same field in the UI and an editor at the same time, the last saved value wins.

## Position

Set the offsets from the top and left edges of the screen in `config.json`, in pixels:

```json
{
  "top": 44,
  "left": 20
}
```

Defaults are `top: 44` and `left: 20`. Missing, `null`, or nonnumeric values use the defaults.

## Width

Edit `config.json` in the same directory. Enter a positive number in pixels:

```json
{
  "width": 288
}
```

The default and minimum width are both 288px. A `null`, missing, nonnumeric, or smaller value uses 288px.

## Height

Set `maxHeight` and `minHeight` in `config.json`, also in pixels. The included defaults are:

```json
{
  "width": 288,
  "maxHeight": null,
  "minHeight": null
}
```

Both height settings default to `null`. Missing, nonnumeric, or nonpositive values also mean no limit. Height follows the content: a two-day forecast stays short rather than filling the maximum height. Content scrolls only when it exceeds `maxHeight`. A configured `minHeight` reserves that much height even with less content. Heights include padding; if the minimum exceeds the maximum, the maximum takes priority.

To limit height, set `maxHeight` to the desired pixel value. Enable Übersicht interaction, move the pointer over the widget, and scroll with a mouse wheel or trackpad. You can also focus the content and use arrow keys. The scrollbar appears only while hovering and hides when the pointer leaves.

**Location** and weather views share the same height limits and scroll container. Long saved-city lists or search results scroll beyond `maxHeight` and respect `minHeight`. No separate list height is needed. When `maxHeight` is `null`, neither view has a height limit.

## Weather condition display

Set the following in `config.json`:

```json
{
  "weatherDisplay": "both"
}
```

Supported values:

- `"text"`: English text only, such as `Rain`.
- `"emoji"`: Emoji only, such as 🌧️. Hover to see the text description; screen readers can also read the condition name.
- `"both"`: Emoji and English text, such as `🌧️ Rain` (default).

This applies to current weather, daily forecasts, and hourly forecasts. Missing, `null`, or unsupported values use `"both"`. Clear conditions distinguish day and night using current or hourly data. Saving cities or forecast days through the UI preserves this setting.

## Colors

Set light and dark mode colors under `colors` in `config.json`. The widget switches automatically with the system appearance. Defaults:

```json
{
  "colors": {
    "light": {
      "background": "#ffffff",
      "foreground": "#000000",
      "backgroundOpacity": 0.25
    },
    "dark": {
      "background": "#000000",
      "foreground": "#ffffff",
      "backgroundOpacity": 0.2
    }
  }
}
```

- `background`: Background color in `#RGB` or `#RRGGBB` format, such as `#263238`.
- `foreground`: Text and control color in the same format. Secondary text, separators, button borders, and scrollbars use this color at different opacity levels.
- `backgroundOpacity`: A number from `0` (fully transparent) to `1` (fully opaque).

You can override individual modes or fields. Missing, `null`, or invalid fields fall back individually to their defaults. Emoji retain their original colors. Saving cities or forecast days in the UI preserves color settings.

## Development and Testing

Run `node check.cjs` to verify JSX and data states using Babel / React bundled with Übersicht. No packages are installed.

## License

This project uses [The Unlicense](LICENSE). Third-party dependencies, services, and data remain subject to their respective licenses and terms.

## Development Statement

This project is developed and maintained with assistance from an AI code agent.
