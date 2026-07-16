/*
 * Vencord userplugin
 * Copyright (c) 2026 Thereallo
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface GiphyImageFormat {
    url?: string;
    width?: string;
    height?: string;
    size?: string;
    mp4?: string;
    webp?: string;
}

export type GiphyImageRecord = Record<string, GiphyImageFormat | undefined>;

export interface GiphyGif {
    id: string;
    title?: string;
    url?: string;
    images?: GiphyImageRecord;
}

export interface GiphyListResponse {
    data?: GiphyGif[];
}

export interface GiphyCategory {
    name?: string;
    name_encoded?: string;
    gif?: GiphyGif;
}

export interface GiphyCategoriesResponse {
    data?: GiphyCategory[];
}

export interface GiphyTagsResponse {
    data?: { name?: string; }[];
}

export interface GiphyTrendingSearchesResponse {
    data?: string[];
}
