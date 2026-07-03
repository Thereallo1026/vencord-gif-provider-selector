/*
 * Vencord userplugin
 * Copyright (c) 2026 Thereallo
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// might be the most scuffed implementation i've ever written

import type { DiscordGif, TenorCategoriesResponse, TenorMediaFormat, TenorResult, TenorSearchResponse } from "./types";

const apiBase = "https://api.thereallo.dev/v1/tenor";
const anonIdStorageKey = "vc-gif-provider-selector-tenor-anon-id";
const defaultLocale = "en-US";

const transparentGifFormats = ["gif_transparent", "tinygif_transparent", "nanogif_transparent"] as const;
const transparentPreviewFormats = ["nanogif_transparent", "tinygif_transparent", "gif_transparent"] as const;
const videoFormats = ["webm", "tinywebm", "mp4", "tinymp4"] as const;
const transparentMediaFilter = [
    "webm",
    "tinywebm",
    "mp4",
    "tinymp4",
    "gif_transparent",
    "tinygif_transparent",
    "nanogif_transparent",
    "webp_transparent",
    "tinywebp_transparent",
    "nanowebp_transparent"
].join(",");

interface PickedFormat {
    key: string;
    media: TenorMediaFormat;
}

function normalizeLocale(locale: unknown): string {
    const fallback = navigator.language || defaultLocale;
    return String(locale || fallback).replace("-", "_");
}

function normalizeMediaFormat(format: unknown): string {
    const normalized = String(format || "webm");
    return normalized === "webp" || normalized === "gif" || normalized === "mp4" || normalized === "webm"
        ? normalized
        : "webm";
}

function getAnonId(): string {
    try {
        const stored = localStorage.getItem(anonIdStorageKey);
        if (stored) return stored;
    } catch { }

    const bytes = new Uint8Array(16);
    crypto.getRandomValues?.(bytes);
    const anonId = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");

    try {
        localStorage.setItem(anonIdStorageKey, anonId);
    } catch { }

    return anonId;
}

function makeApiUrl(path: string, params: Record<string, number | string | undefined>): string {
    const url = new URL(`${apiBase}${path}`);

    url.searchParams.set("anon_id", getAnonId());

    for (const [key, value] of Object.entries(params)) {
        if (value != null && value !== "") url.searchParams.set(key, String(value));
    }

    return url.toString();
}

function withAnonId(params: Record<string, string | undefined>): Record<string, string | undefined> {
    return {
        anon_id: getAnonId(),
        ...params
    };
}

async function request<T>(path: string, params: Record<string, number | string | undefined>): Promise<T> {
    const response = await fetch(makeApiUrl(path, params));
    if (!response.ok) throw new Error(`Tenor req failed with status ${response.status}`);
    return response.json();
}

function firstFormat(result: TenorResult, keys: readonly string[]): PickedFormat | undefined {
    for (const key of keys) {
        const media = result.media_formats[key];
        if (media?.url) return { key, media };
    }

    return undefined;
}

function pickFallbackFormat(result: TenorResult): PickedFormat | undefined {
    const fallback = Object.entries(result.media_formats).find((entry): entry is [string, TenorMediaFormat] => entry[1]?.url != null);

    if (!fallback) return undefined;

    const [key, media] = fallback;
    return { key, media };
}

function pickFormat(result: TenorResult, format: string): PickedFormat | undefined {
    return firstFormat(result, [format, ...videoFormats])
        ?? firstFormat(result, transparentGifFormats)
        ?? firstFormat(result, ["gif", "mediumgif", "tinygif", "webp"])
        ?? pickFallbackFormat(result);
}

function pickGifFormat(result: TenorResult): PickedFormat | undefined {
    return firstFormat(result, transparentGifFormats)
        ?? firstFormat(result, ["gif", "mediumgif", "tinygif", "nanogif"])
        ?? pickFormat(result, "gif");
}

function toDiscordFormat(format: string): string {
    if (format.includes("webp")) return "webp";
    if (format.includes("mp4")) return "mp4";
    if (format.includes("webm")) return "webm";

    return "gif";
}

function toDiscordGif(result: TenorResult, order: number, format: string): DiscordGif | null {
    const selected = pickFormat(result, format);
    const gif = pickGifFormat(result);
    if (!selected) return null;

    const [width, height] = selected.media.dims ?? gif?.media.dims ?? [0, 0];
    const preview = transparentPreviewFormats.map(key => result.media_formats[key]?.url).find(Boolean)
        ?? result.media_formats.gifpreview?.url
        ?? result.media_formats.nanogifpreview?.url
        ?? result.media_formats.tinygifpreview?.url
        ?? result.media_formats.webp?.url
        ?? gif?.media.url
        ?? "";

    return {
        id: result.id,
        title: result.title ?? result.content_description ?? "",
        // discord sends `url` as the message content when a gif is picked
        // tenor.com/view pages no longer embed with alpha, so send the direct media URL (gif_transparent when available) instead
        url: gif?.media.url ?? selected.media.url,
        src: selected.media.url,
        gif_src: gif?.media.url ?? selected.media.url,
        preview,
        width,
        height,
        format: toDiscordFormat(selected.key),
        order
    };
}

async function gifList(path: "/featured" | "/search", query: string | undefined, mediaFormat: string, locale: string, limit: number | undefined): Promise<DiscordGif[]> {
    const selectedFormat = normalizeMediaFormat(mediaFormat);
    const data = await request<TenorSearchResponse>(path, {
        locale: normalizeLocale(locale),
        contentfilter: "low",
        searchfilter: "sticker,-static",
        q: query,
        limit: limit ?? 100,
        media_filter: transparentMediaFilter
    });

    return (data.results ?? [])
        .map((result, index) => toDiscordGif(result, index, selectedFormat))
        .filter((gif): gif is DiscordGif => gif != null);
}

export function search(query: string, mediaFormat: string, locale: string, limit?: number): Promise<DiscordGif[]> {
    return gifList("/search", query, mediaFormat, locale, limit);
}

export function featuredGifs(mediaFormat: string, locale: string, limit?: number): Promise<DiscordGif[]> {
    return gifList("/featured", undefined, mediaFormat, locale, limit);
}

export async function categories(locale: string, limit?: number): Promise<{ name: string; src: string; }[]> {
    const data = await request<TenorCategoriesResponse>("/categories", {
        locale: normalizeLocale(locale),
        type: "trending",
        limit
    });

    return (data.tags ?? []).map(tag => ({
        name: tag.searchterm ?? tag.name?.replace(/^#/, "") ?? "",
        src: tag.image ?? ""
    }));
}

export async function trending(mediaFormat: string, locale: string): Promise<{ categories: { name: string; src: string; }[]; gifs: DiscordGif[]; }> {
    const selectedFormat = normalizeMediaFormat(mediaFormat);
    const [trendingCategories, gifs] = await Promise.all([
        categories(locale),
        request<TenorSearchResponse>("/featured", {
            locale: normalizeLocale(locale),
            contentfilter: "low",
            searchfilter: "sticker,-static",
            limit: 20,
            media_filter: transparentMediaFilter
        })
    ]);

    return {
        categories: trendingCategories,
        gifs: (gifs.results ?? [])
            .map((result, index) => toDiscordGif(result, index, selectedFormat))
            .filter((gif): gif is DiscordGif => gif != null)
    };
}

export async function suggestions(query: string, locale: string, limit = 5): Promise<string[]> {
    const data = await request<{ results?: string[]; }>("/autocomplete", {
        locale: normalizeLocale(locale),
        q: query,
        limit,
        profile_limit: 0
    });

    return data.results ?? [];
}

export async function recordShare(id: string, q: string): Promise<void> {
    const response = await fetch(`${apiBase}/registershare`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(withAnonId({
            id,
            q,
            index: "0",
            source_id: "",
            original_query: q
        }))
    });

    if (!response.ok) throw new Error(`Tenor req failed with status ${response.status}`);
}
