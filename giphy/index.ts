/*
 * Vencord userplugin
 * Copyright (c) 2026 Thereallo
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { DiscordGif } from "../types";
import type { GiphyCategoriesResponse, GiphyGif, GiphyImageRecord, GiphyListResponse, GiphyTagsResponse, GiphyTrendingSearchesResponse } from "./types";

const apiBase = "https://api.giphy.com/v1";
const apiKey = "b2PMhj6oGqDkhnHgwtLEHTUZVxG8oVjL";
// contentfilter=low but for giphy
const contentRating = "pg-13";
const defaultLocale = "en";

type MediaFormat = "gif" | "mp4" | "webp";

async function request<T>(path: string, params: Record<string, number | string | undefined>): Promise<T> {
    const url = new URL(`${apiBase}${path}`);

    // app sends pingback_id device identifier
    // optional, left out on purpose
    url.searchParams.set("api_key", apiKey);

    for (const [key, value] of Object.entries(params)) {
        if (value != null && value !== "") url.searchParams.set(key, String(value));
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Giphy req failed with status ${response.status}`);
    return response.json();
}

function stripTracking(url: string): string {
    const queryStart = url.indexOf("?");
    return queryStart === -1 ? url : url.slice(0, queryStart);
}

function toDiscordGif(result: GiphyGif, order: number, format: MediaFormat): DiscordGif | null {
    const images: GiphyImageRecord = result.images ?? {};
    const rendition = images.fixed_width ?? images.fixed_height ?? images.original;
    if (!rendition) return null;

    const sources = {
        gif: rendition.url,
        webp: rendition.webp,
        mp4: rendition.mp4
    };
    const sourceFormat = ([format, "gif", "webp", "mp4"] as const)
        .find(candidate => sources[candidate]);
    if (!sourceFormat) return null;

    const source = {
        format: sourceFormat,
        url: stripTracking(sources[sourceFormat]!)
    };

    const originalGif = images.original?.url ?? rendition.url;
    const gifSrc = originalGif ? stripTracking(originalGif) : source.url;

    const stillUrl = images.fixed_width_still?.url
        ?? images.fixed_height_still?.url
        ?? images.original_still?.url;
    const preview = stillUrl ? stripTracking(stillUrl) : source.url;

    const width = Number(rendition.width ?? images.original?.width) || 0;
    const height = Number(rendition.height ?? images.original?.height) || 0;

    return {
        id: result.id,
        title: result.title ?? "",
        url: result.url ?? gifSrc,
        src: source.url,
        gif_src: gifSrc,
        preview,
        width,
        height,
        format: source.format,
        order
    };
}

async function gifList(path: "/gifs/search" | "/gifs/trending", query: string | undefined, mediaFormat: string, locale: string, limit: number | undefined): Promise<DiscordGif[]> {
    const data = await request<GiphyListResponse>(path, {
        q: query,
        limit: limit ?? 100,
        rating: contentRating,
        lang: String(locale || navigator.language || defaultLocale).split(/[-_]/)[0].toLowerCase()
    });

    return (data.data ?? [])
        .map((result, index) => toDiscordGif(
            result,
            index,
            mediaFormat === "webp" || mediaFormat === "gif" ? mediaFormat : "mp4"
        ))
        .filter((gif): gif is DiscordGif => gif != null);
}

export function search(query: string, mediaFormat: string, locale: string, limit?: number): Promise<DiscordGif[]> {
    return gifList("/gifs/search", query, mediaFormat, locale, limit);
}

export function featured(mediaFormat: string, locale: string, limit?: number): Promise<DiscordGif[]> {
    return gifList("/gifs/trending", undefined, mediaFormat, locale, limit);
}

export async function categories(limit?: number): Promise<{ name: string; src: string; }[]> {
    const data = await request<GiphyCategoriesResponse>("/gifs/categories", {});

    const tags = (data.data ?? [])
        .map(tag => ({
            name: tag.name ?? "",
            src: tag.gif?.images?.fixed_width?.url ? stripTracking(tag.gif.images.fixed_width.url) : ""
        }))
        .filter(tag => tag.name && tag.src);

    return limit != null ? tags.slice(0, limit) : tags;
}

export async function trending(mediaFormat: string, locale: string): Promise<{ categories: { name: string; src: string; }[]; gifs: DiscordGif[]; }> {
    const [trendingCategories, gifs] = await Promise.all([
        categories(),
        gifList("/gifs/trending", undefined, mediaFormat, locale, 20)
    ]);

    return {
        categories: trendingCategories,
        gifs
    };
}

export async function suggestions(query: string, limit = 5): Promise<string[]> {
    const data = await request<GiphyTagsResponse>("/gifs/search/tags", {
        q: query,
        limit
    });

    return (data.data ?? [])
        .map(tag => tag.name)
        .filter((name): name is string => !!name);
}

export async function trendingTerms(limit?: number): Promise<string[]> {
    const data = await request<GiphyTrendingSearchesResponse>("/trending/searches", {});
    const terms = data.data ?? [];

    return limit != null ? terms.slice(0, limit) : terms;
}
