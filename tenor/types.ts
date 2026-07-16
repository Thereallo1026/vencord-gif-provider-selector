/*
 * Vencord userplugin
 * Copyright (c) 2026 Thereallo
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface TenorMediaFormat {
    url: string;
    duration?: number;
    preview?: string;
    dims?: [number, number];
    size?: number;
}

export type TenorMediaRecord = Record<string, TenorMediaFormat | undefined>;

export interface TenorResult {
    id: string;
    title?: string;
    content_description?: string;
    itemurl?: string;
    url?: string;
    media?: TenorMediaRecord[];
}

export interface TenorSearchResponse {
    results?: TenorResult[];
    next?: string;
}

export interface TenorCategory {
    searchterm?: string;
    name?: string;
    image?: string;
}

export interface TenorCategoriesResponse {
    tags?: TenorCategory[];
}
