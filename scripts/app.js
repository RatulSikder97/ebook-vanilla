let param = URLSearchParams && new URLSearchParams(document.location.search.substring(1));
const BOOK_URL = param && param.get('url') && decodeURIComponent(param.get('url'));
const USER_ID = param && param.get('userId') && decodeURIComponent(param.get('userId'));

// ELEMENTS
const BOOK_RENDER_VIEWER = document.querySelector('#reader-view');

// book
let book;
let rendition;


renderBook();

/**
 * User Verification
 * @returns status: boolean
 */
function userVerification() {
    if (!USER_ID) {
        console.log('[ERROR] Invalid Authentication!');
        return;
    }

    console.log('[SUCCESS] Authenticate User 😍.');
    return true;
}

/**
 * Check Book Url Nullity
 * @returns status: book status in boolean
 */
function checkBookUrl() {
    if (!BOOK_URL) {
        console.log('[ERROR] BOOK IS NULL!');
        return;
    }

    console.log('[SUCCESS] BOOK INITIATED.');
    return true;
}

function initBook() {
    book = ePub(BOOK_URL);
}

function renderBook() {
    if (userVerification() && checkBookUrl()) {
        initBook();

        rendition = book.renderTo("reader-view", {
            width: '100%',
            height: '100vh',
            flow: 'scrolled',
            manager: 'continuous'
        });

        rendition.display();
    }
}