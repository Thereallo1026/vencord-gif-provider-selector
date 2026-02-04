# GIF Provider Selector

A Vencord userplugin that adds a dropdown to the GIF picker, allowing you to switch between Tenor, Giphy, and Klipy as your GIF search provider.

## Features

- Adds a provider selector dropdown next to the search bar in the GIF picker
- Switch between Tenor, Giphy, and Klipy on the fly
- Your selection persists across sessions
- Replaces provider-specific placeholder text with generic "Search GIFs"

## Installation

1. Clone this repository into your Vencord `src/userplugins` folder:

```bash
cd path/to/Vencord/src/userplugins
git clone https://github.com/Thereallo1026/vencord-gif-provider-selector.git gifProviderSelector
```

2. Rebuild Vencord:

```bash
pnpm build
```

3. Restart Discord

4. Enable the plugin in Vencord settings under "GifProviderSelector"

## Usage

Open the GIF picker in Discord. You will see a dropdown next to the search bar. Select your preferred provider (Tenor, Giphy, or Klipy) and search for GIFs.

## Note

Discord is experimenting with GIF provider selection internally, so this functionality may eventually become a native Discord feature. This plugin provides the feature now for those who want it.

## License

GPL-3.0-or-later
