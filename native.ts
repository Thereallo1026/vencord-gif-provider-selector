/*
 * Vencord userplugin
 * Copyright (c) 2026 Thereallo
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ConnectSrc, CspPolicies, ImageSrc } from "@main/csp";

CspPolicies["api.tenor.com"] = ConnectSrc;
CspPolicies["media.tenor.com"] = ImageSrc;

CspPolicies["api.giphy.com"] = ConnectSrc;
CspPolicies["*.giphy.com"] = ImageSrc;
