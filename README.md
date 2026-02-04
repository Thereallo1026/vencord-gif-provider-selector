# GIF Provider Selector

A Vencord userplugin that adds a dropdown to the GIF picker, allowing you to switch between Tenor, Giphy, and Klipy as your GIF search provider.

## Why this plugin exists

The Tenor API is shutting down in June 2025. Discord is currently running an experiment to test whether users prefer Giphy or Klipy as a replacement, but this experiment is only available to a random subset of users.

If you are not part of the experiment, you are stuck with whatever provider Discord defaults to. This plugin gives you the choice regardless of whether you have access to the experiment.

If Discord eventually settles on a single provider without giving users a choice, this plugin will remain useful. If they add a native provider selector, this plugin becomes unnecessary.

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

## License

GPL-3.0-or-later
