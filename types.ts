/*
 * Vencord userplugin
 * Copyright (c) 2026 Thereallo
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { providers } from ".";

export type Provider = typeof providers[keyof typeof providers];

export interface GifPickerInstance {
    props: {
        query?: string;
    };
    state: {
        searchQuery?: string;
        resultType?: string;
    };
    search?: (query: string) => void;
    forceUpdate?: () => void;
}

export interface WrapperProps {
    searchBar: React.ReactNode;
    instance?: GifPickerInstance;
}

export interface RestApi {
    get(request: RestRequest): Promise<RestResponse>;
    post(request: RestRequest): Promise<RestResponse>;
}

export interface RestRequest {
    url: string;
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
    oldFormErrors?: boolean;
    rejectWithError?: boolean;
}

export interface RestResponse<T = unknown> {
    body: T;
    headers: Record<string, string>;
    ok: boolean;
    status: number;
    text: string;
}

export type RestComplete = (response: RestResponse & { hasErr: boolean; }) => void;
