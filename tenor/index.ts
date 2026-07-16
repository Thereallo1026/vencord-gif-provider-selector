/*
 * Vencord userplugin
 * Copyright (c) 2026 Thereallo
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { DiscordGif } from "../types";
import type { TenorCategoriesResponse, TenorMediaFormat, TenorMediaRecord, TenorResult, TenorSearchResponse } from "./types";

const apiBase = "https://api.tenor.com/v1";
const apiKey = "3Z0688EVWYKH";
const anonIdStorageKey = "vc-gif-provider-selector-tenor-anon-id";
const defaultLocale = "en-US";

const transparentGifFormats = ["gif_transparent", "tinygif_transparent", "nanogif_transparent"] as const;
const transparentPreviewFormats = ["nanogif_transparent", "tinygif_transparent", "gif_transparent"] as const;
const videoFormats = ["webm", "tinywebm", "mp4", "tinymp4"] as const;
const mediaFilter = [
    "webm",
    "tinywebm",
    "mp4",
    "tinymp4",
    "gif",
    "mediumgif",
    "tinygif",
    "nanogif",
    "gifpreview",
    "tinygifpreview",
    "nanogifpreview",
    "webp",
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

    url.searchParams.set("key", apiKey);
    url.searchParams.set("anon_id", getAnonId());

    for (const [key, value] of Object.entries(params)) {
        if (value != null && value !== "") url.searchParams.set(key, String(value));
    }

    return url.toString();
}

async function request<T>(path: string, params: Record<string, number | string | undefined>): Promise<T> {
    const response = await fetch(makeApiUrl(path, params));
    if (!response.ok) throw new Error(`Tenor req failed with status ${response.status}`);
    return response.json();
}

// v1 results carry formats as array containing formatName -> media record
function getMediaRecord(result: TenorResult): TenorMediaRecord {
    return Object.assign({}, ...(result.media ?? []));
}

function firstFormat(media: TenorMediaRecord, keys: readonly string[]): PickedFormat | undefined {
    for (const key of keys) {
        const format = media[key];
        if (format?.url) return { key, media: format };
    }

    return undefined;
}

function pickFallbackFormat(media: TenorMediaRecord): PickedFormat | undefined {
    const fallback = Object.entries(media).find((entry): entry is [string, TenorMediaFormat] => entry[1]?.url != null);

    if (!fallback) return undefined;

    const [key, format] = fallback;
    return { key, media: format };
}

function pickFormat(media: TenorMediaRecord, format: string): PickedFormat | undefined {
    return firstFormat(media, [format, ...videoFormats])
        ?? firstFormat(media, transparentGifFormats)
        ?? firstFormat(media, ["gif", "mediumgif", "tinygif", "webp"])
        ?? pickFallbackFormat(media);
}

function pickGifFormat(media: TenorMediaRecord): PickedFormat | undefined {
    return firstFormat(media, transparentGifFormats)
        ?? firstFormat(media, ["gif", "mediumgif", "tinygif", "nanogif"])
        ?? pickFormat(media, "gif");
}

function toDiscordFormat(format: string): string {
    if (format.includes("webp")) return "webp";
    if (format.includes("mp4")) return "mp4";
    if (format.includes("webm")) return "webm";

    return "gif";
}

function toDiscordGif(result: TenorResult, order: number, format: string): DiscordGif | null {
    const media = getMediaRecord(result);
    const selected = pickFormat(media, format);
    const gif = pickGifFormat(media);
    if (!selected) return null;

    const [width, height] = selected.media.dims ?? gif?.media.dims ?? [0, 0];
    const preview = transparentPreviewFormats.map(key => media[key]?.url).find(Boolean)
        ?? media.gifpreview?.url
        ?? media.nanogifpreview?.url
        ?? media.tinygifpreview?.url
        ?? media.webp?.url
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

async function gifList(path: "/search" | "/trending", query: string | undefined, mediaFormat: string, locale: string, limit: number | undefined): Promise<DiscordGif[]> {
    const selectedFormat = normalizeMediaFormat(mediaFormat);
    const data = await request<TenorSearchResponse>(path, {
        locale: normalizeLocale(locale),
        contentfilter: "low",
        q: query,
        limit: limit ?? 100,
        media_filter: mediaFilter
    });

    return (data.results ?? [])
        .map((result, index) => toDiscordGif(result, index, selectedFormat))
        .filter((gif): gif is DiscordGif => gif != null);
}

export function search(query: string, mediaFormat: string, locale: string, limit?: number): Promise<DiscordGif[]> {
    return gifList("/search", query, mediaFormat, locale, limit);
}

export function featured(mediaFormat: string, locale: string, limit?: number): Promise<DiscordGif[]> {
    return gifList("/trending", undefined, mediaFormat, locale, limit);
}

export async function categories(locale: string, limit?: number): Promise<{ name: string; src: string; }[]> {
    const data = await request<TenorCategoriesResponse>("/categories", {
        locale: normalizeLocale(locale),
        type: "featured",
        limit
    });

    return (data.tags ?? []).map(tag => ({
        name: tag.searchterm ?? tag.name?.replace(/^#/, "") ?? "",
        src: tag.image ?? ""
    }));
}

export async function trending(mediaFormat: string, locale: string): Promise<{ categories: { name: string; src: string; }[]; gifs: DiscordGif[]; }> {
    const [trendingCategories, gifs] = await Promise.all([
        categories(locale),
        gifList("/trending", undefined, mediaFormat, locale, 20)
    ]);

    return {
        categories: trendingCategories,
        gifs
    };
}

export async function suggestions(query: string, locale: string, limit = 5): Promise<string[]> {
    const data = await request<{ results?: string[]; }>("/search_suggestions", {
        locale: normalizeLocale(locale),
        q: query,
        limit
    });

    return data.results ?? [];
}

export async function trendingTerms(locale: string, limit?: number): Promise<string[]> {
    const data = await request<{ results?: string[]; }>("/trending_terms", {
        locale: normalizeLocale(locale),
        limit
    });

    return data.results ?? [];
}
