let cachedEpochs = { globalEpoch: 0, userEpochs: {} };

export function loadSessionEpochs() {
    return cachedEpochs;
}

export function saveSessionEpochs(data) {
    cachedEpochs = data || { globalEpoch: 0, userEpochs: {} };
}

export function isTokenRevoked(payload) {
    if (!payload) return true;
    const epochs = loadSessionEpochs();
    const tokenIat = payload.iat || 0;

    if (epochs.globalEpoch && tokenIat <= epochs.globalEpoch) {
        return true;
    }

    if (payload.id && epochs.userEpochs && epochs.userEpochs[String(payload.id)]) {
        if (tokenIat <= epochs.userEpochs[String(payload.id)]) {
            return true;
        }
    }

    return false;
}
