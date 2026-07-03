/*
 * Vencord userplugin
 * Copyright (c) 2026 Thereallo
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import "./style.css";

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import definePlugin, { OptionType } from "@utils/types";
import { type React, Select, useEffect } from "@webpack/common";

import * as Tenor from "./tenor";
import type { GifPickerInstance, Provider, RestApi, RestComplete, RestRequest, RestResponse, WrapperProps } from "./types";

// consts
export const providers = {
    tenor: "tenor",
    giphy: "giphy",
    klipy: "klipy"
} as const;

const providerOptions = [
    { label: "Tenor", value: providers.tenor },
    { label: "Giphy", value: providers.giphy },
    { label: "Klipy", value: providers.klipy }
];

export const settings = definePluginSettings({
    provider: {
        type: OptionType.SELECT,
        description: "Default GIF provider to use for searches",
        options: [
            { label: "Tenor", value: providers.tenor, default: true },
            { label: "Giphy", value: providers.giphy },
            { label: "Klipy", value: providers.klipy }
        ] as const
    }
});


function ProviderSelector({ instance }: { instance?: GifPickerInstance }) {
    const currentProvider = settings.use(["provider"]).provider ?? providers.tenor;

    const handleClick = (e: React.MouseEvent) => {
        // prevent click from bubbling up and closing the GIF picker
        e.stopPropagation();
    };

    const handleSelect = (v: Provider) => {
        settings.store.provider = v;

        const currentQuery = instance?.props?.query;

        if (currentQuery && instance) {
            if (typeof (instance as any).search === "function") {
                // clear search to invalidate cache, then immediately restore
                (instance as any).search("");

                setTimeout(() => {
                    (instance as any).search(currentQuery);
                }, 0);
            }
        }
    };

    return (
        <div
            className="vc-gif-provider-selector"
            onClick={handleClick}
            onMouseDown={handleClick}
        >
            <Select
                options={providerOptions}
                isSelected={(v: string) => v === currentProvider}
                select={handleSelect}
                serialize={(v: string) => v}
                popoutPosition="bottom"
                closeOnSelect={true}
            />
        </div>
    );
}

function HeaderWrapper({ searchBar, instance }: WrapperProps) {
    // autofocus
    useEffect(() => {
        const timer = setTimeout(() => {
            const input = document.querySelector<HTMLInputElement>(
                '.vc-gif-provider-search input[type="text"]'
            );
            input?.focus();
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    return (
        <ErrorBoundary noop>
            <div className="vc-gif-provider-header">
                <div className="vc-gif-provider-search">{searchBar}</div>
                <ProviderSelector instance={instance} />
            </div>
        </ErrorBoundary>
    );
}

function getProvider(): Provider {
    return settings.store.provider ?? providers.tenor;
}

function makeRestResponse<T>(body: T): RestResponse<T> {
    return {
        body,
        headers: {},
        ok: true,
        status: 200,
        text: JSON.stringify(body)
    };
}

function toLimit(limit: unknown): number | undefined {
    return typeof limit === "number" ? limit : undefined;
}

function getRestQueryString(query: Record<string, unknown> | undefined, key: string, fallback = ""): string {
    const value = query?.[key];
    return typeof value === "string" ? value : fallback;
}

function asRestResponse<T>(promise: Promise<T>): Promise<RestResponse<T>> {
    return promise.then(makeRestResponse);
}

export default definePlugin({
    name: "GifProviderSelector",
    description: "Adds a dropdown to select between Giphy, Klipy, and Tenor for GIF searches",
    authors: [{ name: "Thereallo", id: 896388612764090448n }],
    settings,

    /**
     * Patches to inject our component into the GIF picker header.
     *
     * Based on Discord's GIF picker header code:
     *
     * renderHeaderContent(){
     *   ...
     *   default:{
     *     let t=(0,m.cf)(),n=(0,h.w)(t);
     *     return(0,r.jsx)(l.IWV,{query:e,onChange:this.handleChangeQuery,
     *            onClear:this.handleClearQuery,placeholder:n,"aria-label":n,
     *            ref:this.props.searchBarRef,autoFocus:!0})
     *   }
     * }
     *
     * Discord changes the mangled component name and occasionally inserts
     * extra props, so the injection matches the search-bar props instead of a
     * specific component export or final prop.
     */
    patches: [
        // patch 1: change placeholder
        {
            find: "Search Tenor",
            replacement: {
                match: /"Search Tenor"/g,
                replace: '"Search GIFs"'
            }
        },
        {
            find: "Search Giphy",
            replacement: {
                match: /"Search Giphy"/g,
                replace: '"Search GIFs"'
            }
        },
        {
            find: "Search Klipy",
            replacement: {
                match: /"Search Klipy"/g,
                replace: '"Search GIFs"'
            }
        },

        // patch 2: inject ProviderSelector into the GIF picker header
        {
            find: "renderHeaderContent()",
            replacement: {
                // match: return(0,r.jsx)(l.IWV,{...search bar props...})
                // capture the jsx call without the return keyword
                match: /return(\(0,\i\.jsx\)\(\i\.\i,\{(?=[^}]*query:\i)(?=[^}]*onChange:this\.handleChangeQuery)(?=[^}]*onClear:this\.handleClearQuery)(?=[^}]*ref:this\.props\.searchBarRef)[^}]*\}\))/,
                replace: "return $self.wrapWithSelector($1, this)"
            }
        },

        // patch 3: route GIF picker actions through the selected provider
        {
            find: "GIFS_SEARCH,query",
            replacement: [
                {
                    match: /(\i\.Bo)\.get\(\{url:(\i\.Rsh\.GIFS_SEARCH),query:\{q:(\i),media_format:(\i\.A\.getSelectedFormat\(\)),provider:\(0,\i\.cf\)\(\),locale:(\i\.default\.locale),limit:(\i)\},oldFormErrors:!0,rejectWithError:!0\}\)/,
                    replace: "$self.getSearch($1,$2,$3,$4,$5,$6)"
                },
                {
                    match: /(\i\.Bo)\.get\(\{url:(\i\.Rsh\.GIFS_SUGGEST),query:\{q:(\i),provider:\(0,\i\.cf\)\(\),limit:5,locale:(\i\.default\.locale)\},oldFormErrors:!0,rejectWithError:!0\}\)/,
                    replace: "$self.getSuggest($1,$2,$3,$4)"
                },
                {
                    match: /(\i\.Bo)\.get\(\{url:(\i\.Rsh\.GIFS_TRENDING),query:\{provider:\(0,\i\.cf\)\(\),locale:(\i\.default\.locale),media_format:(\i\.A\.getSelectedFormat\(\))\},oldFormErrors:!0,rejectWithError:!0\}\)/,
                    replace: "$self.getTrending($1,$2,$3,$4)"
                },
                {
                    match: /(\i\.Bo)\.get\(\{url:(\i\.Rsh\.GIFS_TRENDING_GIFS),query:\{media_format:(\i\.A\.getSelectedFormat\(\)),provider:\(0,\i\.cf\)\(\),locale:(\i\.default\.locale),limit:(\i)\},oldFormErrors:!0,rejectWithError:!0\}\)/,
                    replace: "$self.getTrendingGifs($1,$2,$3,$4,$5)"
                },
                {
                    match: /(\i\.Bo)\.post\(\{url:(\i\.Rsh\.GIFS_SELECT),body:\{id:(\i),q:(\i),provider:(\i)\},oldFormErrors:!0,rejectWithError:!0\}\)/,
                    replace: "$self.selectGif($1,$2,$3,$4,$5)"
                },
                {
                    match: /\(0,\i\.cf\)\(\)/g,
                    replace: "$self.getProvider()"
                }
            ]
        },

        // patch 4: intercept Discord REST GIF requests before XHR is created
        {
            find: "makeRequest: queueing request",
            replacement: {
                match: /function (\i)\((\i),(\i),(\i)\)\{return new Promise\(\((\i),(\i)\)=>\{"string"==typeof \3&&\(\3=\{url:\3,rejectWithError:!1\}\);let (\i)=(\i)\.get\(\3\.url\);if\(null!=\7&&\3\.failImmediatelyWhenRateLimited\)/,
                replace: "function $1($2,$3,$4){return new Promise(($5,$6)=>{\"string\"==typeof $3&&($3={url:$3,rejectWithError:!1});let $gifProviderResponse=$self.handleGifRequest($2,$3,$4);if($gifProviderResponse)return void $gifProviderResponse.then($5,$6);let $7=$8.get($3.url);if(null!=$7&&$3.failImmediatelyWhenRateLimited)"
            }
        }
    ],

    wrapWithSelector(searchBarElement: React.ReactNode, instance?: GifPickerInstance): React.ReactNode {
        return <HeaderWrapper searchBar={searchBarElement} instance={instance} />;
    },

    getProvider(): Provider {
        return getProvider();
    },

    getSearch(rest: RestApi, url: string, query: string, mediaFormat: string, locale: string, limit?: number) {
        const provider = getProvider();

        if (provider !== providers.tenor) {
            return rest.get({
                url,
                query: { q: query, media_format: mediaFormat, provider, locale, limit },
                oldFormErrors: true,
                rejectWithError: true
            });
        }

        return asRestResponse(Tenor.search(query, mediaFormat, locale, toLimit(limit)));
    },

    getSuggest(rest: RestApi, url: string, query: string, locale: string) {
        const provider = getProvider();

        if (provider !== providers.tenor) {
            return rest.get({
                url,
                query: { q: query, provider, limit: 5, locale },
                oldFormErrors: true,
                rejectWithError: true
            });
        }

        return asRestResponse(Tenor.suggestions(query, locale, 5));
    },

    getTrending(rest: RestApi, url: string, locale: string, mediaFormat: string) {
        const provider = getProvider();

        if (provider !== providers.tenor) {
            return rest.get({
                url,
                query: { provider, locale, media_format: mediaFormat },
                oldFormErrors: true,
                rejectWithError: true
            });
        }

        return asRestResponse(Tenor.trending(mediaFormat, locale));
    },

    getTrendingGifs(rest: RestApi, url: string, mediaFormat: string, locale: string, limit?: number) {
        const provider = getProvider();

        if (provider !== providers.tenor) {
            return rest.get({
                url,
                query: { media_format: mediaFormat, provider, locale, limit },
                oldFormErrors: true,
                rejectWithError: true
            });
        }

        return asRestResponse(Tenor.featuredGifs(mediaFormat, locale, toLimit(limit)));
    },

    // ik this is scuffed asf but it works somehow
    handleGifRequest(_method: string, request: RestRequest, onComplete?: RestComplete) {
        const route = String(request.url ?? "").match(/\/gifs\/(?:trending-search|trending-gifs|trending|search|suggest|select)(?=$|[?#])/)?.[0] ?? null;
        if (!route) return null;

        const provider = getProvider();

        if (provider !== providers.tenor) {
            request.query = { ...request.query, provider };
            if (request.body?.provider != null) request.body = { ...request.body, provider };
            return null;
        }

        const mediaFormat = getRestQueryString(request.query, "media_format", "webm");
        const locale = getRestQueryString(request.query, "locale", navigator.language || "en-US");
        const rawLimit = request.query?.limit;
        let limit = 100;

        if (typeof rawLimit === "number") {
            limit = rawLimit;
        } else if (typeof rawLimit === "string") {
            const parsedLimit = Number(rawLimit);
            if (Number.isFinite(parsedLimit)) limit = parsedLimit;
        }

        let response: Promise<RestResponse>;

        switch (route) {
            case "/gifs/search":
                response = asRestResponse(Tenor.search(getRestQueryString(request.query, "q"), mediaFormat, locale, limit));
                break;
            case "/gifs/trending":
                response = asRestResponse(Tenor.trending(mediaFormat, locale));
                break;
            case "/gifs/trending-gifs":
                response = asRestResponse(Tenor.featuredGifs(mediaFormat, locale, limit));
                break;
            case "/gifs/suggest":
                response = asRestResponse(Tenor.suggestions(getRestQueryString(request.query, "q"), locale, limit));
                break;
            case "/gifs/trending-search":
                response = asRestResponse(
                    Tenor.categories(locale, limit).then(categories => categories.map(({ name }) => name).filter(Boolean))
                );
                break;
            case "/gifs/select":
                response = asRestResponse(Tenor.recordShare(
                    getRestQueryString(request.body, "id"),
                    getRestQueryString(request.body, "q")
                ).then(() => null));
                break;
            default:
                return null;
        }

        return response.then(
            res => {
                onComplete?.({ ...res, hasErr: false });
                return res;
            }
        );
    },

    selectGif(rest: RestApi, url: string, id: string, query: string, provider: Provider) {
        if (getProvider() !== providers.tenor) {
            return rest.post({
                url,
                body: { id, q: query, provider },
                oldFormErrors: true,
                rejectWithError: true
            });
        }

        return Tenor.recordShare(id, query).then(() => makeRestResponse(null));
    }
});
