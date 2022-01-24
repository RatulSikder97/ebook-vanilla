let param = URLSearchParams && new URLSearchParams(document.location.search.substring(1));
const BOOK_URL = param && param.get('url') && decodeURIComponent(param.get('url'));
const USER_ID = param && param.get('userId') && decodeURIComponent(param.get('userId'));

// ELEMENTS
const BOOK_RENDER_VIEWER = document.querySelector('#reader-view');
const TOP_MENU_BAR = document.querySelector('#top-menu-bar');
const BOOK_PROGRESS_RANGER = document.querySelector('#js--book-percentage');
const CURRENT_PAGE_ELEMENT = document.querySelector('#js--current-page');
const TOTAL_PAGE_ELEMENT = document.querySelector('#js--total-page');

// book
let book;
let rendition;
let metaData;
let mouseDown;
let isScrolling;
let rangerChanging;


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

/**
 * Initiate Book
 */
function initBook() {
    book = ePub(BOOK_URL);
}

/**
 * Main Render Function
 */
async function renderBook() {
    if (userVerification() && checkBookUrl()) {
        initBook();

        rendition = book.renderTo("reader-view", {
            width: '100%',
            height: '100vh',
            flow: 'scrolled',
            manager: 'continuous'
        });

        rendition.display();
        await loadMetadata();


        // add effect on reader scroll
        rendition.once("rendered", (e, i) => {
            document.querySelector('.epub-container').addEventListener('scroll', () => {
                clearTimeout(isScrolling);
                let onScrollTimer = setTimeout(() => {
                    if(!rangerChanging) {
                        TOP_MENU_BAR.style.top = '-100%';
                    }

                }, 100);

                // Set a timeout to run after scrolling ends
                isScrolling = setTimeout(function () {
                    clearTimeout(onScrollTimer);
                    rangerChanging = false;
                    TOP_MENU_BAR.style.top = '0px';
                }, 1500);
            });

            BOOK_PROGRESS_RANGER.addEventListener("mousedown", function () {
                mouseDown = true;
            }, false);
            BOOK_PROGRESS_RANGER.addEventListener("mouseup", function () {
                mouseDown = false;
            }, false);

            let currentLocation = rendition.currentLocation();
            let currentPage = book.locations.percentageFromCfi(currentLocation.start.cfi);
            BOOK_PROGRESS_RANGER.value = currentPage;
        });

        rendition.once("displayed", (e, i) => {

            BOOK_PROGRESS_RANGER.addEventListener("mousedown", function () {
                mouseDown = true;
            }, false);
            BOOK_PROGRESS_RANGER.addEventListener("mouseup", function () {
                mouseDown = false;
            }, false);

            BOOK_PROGRESS_RANGER.addEventListener('change', (e) => {
                rangerChanging = true;
                // cfiFromPercentage
                rendition.display(book.locations.cfiFromPercentage(e.target.value / 100));
            }, false);

            let currentLocation = rendition.currentLocation();
            let currentPage = book.locations.percentageFromCfi(currentLocation.start.cfi);
            BOOK_PROGRESS_RANGER.value = currentPage;
        });


        book.ready.then(() => {
            book.locations.generate(1024).then(data => {
                BOOK_PROGRESS_RANGER.removeAttribute('disabled')
                TOTAL_PAGE_ELEMENT.textContent = book.locations.total;
                CURRENT_PAGE_ELEMENT.textContent = book.rendition.location.end.location;
            })
        });


        rendition.on("relocated", (location) => {

            let percent = book.locations.percentageFromCfi(location.start.cfi);
            let percentage = Math.floor(percent * 100);
            if (!mouseDown) {
                BOOK_PROGRESS_RANGER.value = percentage;
            }
            CURRENT_PAGE_ELEMENT.textContent = location.end.location;

        });
    }
}


async function loadMetadata() {
    metaData = await book.loaded.metadata;

}