const BASE_PATH = window.BASE_PATH || '';
let state = JSON.parse(localStorage.getItem('options') || '{}');
const validPrefixes = ['hsk', 'simplified', 'traditional', 'cantonese'];
let graphPrefix = 'simplified';

let path = document.location.pathname;
if (BASE_PATH && path.startsWith(BASE_PATH)) {
    path = path.slice(BASE_PATH.length);
}
if (path[0] === '/') {
    path = path.substring(1);
}
pathSegments = path.split('/')
if (pathSegments.length > 0 && validPrefixes.includes(pathSegments[0])) {
    graphPrefix = pathSegments[0];
} else if (state && state.selectedCharacterSet && validPrefixes.includes(state.selectedCharacterSet)) {
    graphPrefix = state.selectedCharacterSet;
}
window.sentencesFetch = fetch(`${BASE_PATH}/data/${graphPrefix}/sentences.json`);
window.definitionsFetch = fetch(`${BASE_PATH}/data/${graphPrefix}/definitions.json`);
window.componentsFetch = fetch(`${BASE_PATH}/data/components/components.json`);
// TODO(refactor): it kinda makes sense to still load the HSK stuff as a pre-built graph,
// but this, and the similar code in options and main, aren't great
if (graphPrefix === 'hsk') {
    window.graphFetch = fetch(`${BASE_PATH}/data/${graphPrefix}/graph.json`);
} else {
    window.freqsFetch = fetch(`${BASE_PATH}/data/${graphPrefix}/wordlist.json`);
}