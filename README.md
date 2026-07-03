# GIF Provider Selector

A Vencord userplugin that adds a dropdown to the GIF picker, allowing you to switch between Tenor, Giphy, and Klipy as your GIF search provider.

> [!IMPORTANT]
> This plugin calls an external API hosted by me ([thereallo](https://github.com/Thereallo1026)) at [`api.thereallo.dev`](https://api.thereallo.dev). When Tenor mode is selected, GIF search, trending, suggestions, and related requests are sent to that service instead of Discord's default endpoints.
>
> The plugin source code in this repository is open source, but the API source code is private for privacy and operational reasons. If you do not trust the results returned by my API, do not use this plugin.

## Why this plugin exists

Discord moved its GIF picker away from Tenor and toward Klipy. This plugin restores Tenor results by calling my personal tenor API proxy and adapting the proxied Tenor response into Discord's GIF picker format.

Giphy and Klipy still use Discord's GIF endpoints with the selected provider parameter. Tenor mode uses proxied endpoints for search, trending GIFs, trending categories, search suggestions, trending search terms, and selection tracking.

## Features

- Adds a provider selector dropdown next to the search bar in the GIF picker
- Switch between Tenor, Giphy, and Klipy on the fly
- Restores Tenor API
- Your selection persists across sessions

## Installation

This is a [userplugin](https://docs.vencord.dev/installing/custom-plugins/). You need to build Vencord from source.

### Prerequisites

- [Node.js](https://nodejs.org/), [Git](https://git-scm.com/), and [pnpm](https://pnpm.io/)
- Follow the [Installing from Source](https://docs.vencord.dev/installing/) guide if you do not already have a local Vencord clone.

### Steps

1. Clone Vencord and install dependencies (skip this if you already have a local Vencord folder):

```bash
git clone https://github.com/Vendicated/Vencord
cd Vencord
pnpm install --frozen-lockfile
```

2. Create `src/userplugins` if it does not exist, then clone this repository into it:

```bash
mkdir -p src/userplugins
cd src/userplugins
git clone https://github.com/Thereallo1026/vencord-gif-provider-selector.git
cd ../..
```

3. Build Vencord from the repo root:

```bash
pnpm build
```

4. Install your custom build (first time only, or if you are not already using a source build). Close Discord first, then run:

```bash
pnpm inject
```

Patch your Discord install with the Vencord installer when it opens.

5. Fully quit and reopen Discord so the API proxy CSP rule is applied to the main frame.

6. Enable **GifProviderSelector** in Vencord settings under Plugins.

After updating the plugin later, run `pnpm build` from your Vencord root again and restart Discord.

## Usage

Open the GIF picker in Discord. You will see a dropdown next to the search bar. Select your preferred provider (Tenor, Giphy, or Klipy) and search for GIFs.

## License

AGPL-3.0-or-later
