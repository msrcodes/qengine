'use strict';

export function getQuestionnaireId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("q");
}

export function getURL(page, id) {
    const protocol = window.location.protocol;
    const host = window.location.host;

    return `${protocol}//${host}/${page}?q=${id}`;
}