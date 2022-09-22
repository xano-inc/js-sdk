function updateDocumentState(state) {
    document.getElementsByTagName('body')[0].setAttribute('data-state', state)
}

var elms = document.getElementsByClassName('reset');
for (var i = 0; i < elms.length; i++) {
    elms[i].addEventListener('click', function () {
        updateDocumentState('initial');
    });
}
