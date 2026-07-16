# GIF Provider Selector

A Vencord userplugin that adds a dropdown to the GIF picker, allowing you to switch between Tenor, Giphy, and Klipy as your GIF search provider.

## Why this plugin exists

Discord removed Tenor as GIF provider and moved to Klipy. On top of that, Discord's GIF endpoints now ignore the `provider` parameter entirely and always return Klipy results, which silently broke Giphy too.

This plugin restores Tenor and Giphy results by calling their public APIs directly for search, trending GIFs, trending categories, search suggestions, and trending search terms. Klipy still uses Discord's GIF endpoints.

> [!NOTE]
> when you pick a GIF in Tenor or Giphy mode, the plugin does **not** report the selection to the provider's tracking endpoints (Tenor's `/registershare`, Giphy's pingback) on purpose. Tracking parameters on Giphy media URLs are stripped as well.

## Features

- Adds a provider selector dropdown next to the search bar in the GIF picker
- Switch between Tenor, Giphy, and Klipy on the fly
- Restores Tenor and Giphy results via their own public APIs.
- Skips Tenor and Giphy share tracking when sharing a GIF
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

5. Fully quit and reopen Discord so the Tenor and Giphy API CSP rules are applied to the main frame.

6. Enable **GifProviderSelector** in Vencord settings under Plugins.

After updating the plugin later, run `pnpm build` from your Vencord root again and restart Discord.

## Usage

Open the GIF picker in Discord. You will see a dropdown next to the search bar. Select your preferred provider (Tenor, Giphy, or Klipy) and search for GIFs.

## License

AGPL-3.0-or-later
