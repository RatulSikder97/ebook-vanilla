let param = URLSearchParams && new URLSearchParams(document.location.search.substring(1));
const BOOK_URL = param && param.get('url') && decodeURIComponent(param.get('url'));
const USER_ID = param && param.get('userId') && decodeURIComponent(param.get('userId'));

// ELEMENTS
const BOOK_RENDER_VIEWER = document.querySelector('#reader-view');
const TOP_MENU_BAR = document.querySelector('#top-menu-bar');
const BOOK_PROGRESS_RANGER = document.querySelector('#js--book-percentage');
const CURRENT_PAGE_ELEMENT = document.querySelector('#js--current-page');
const TOTAL_PAGE_ELEMENT = document.querySelector('#js--total-page');
const TOC_ELEMENT = document.querySelector('#js--toc');
const OVERLAY = document.querySelector('#js--overlay');
const BOOK_META_ELEMENT = document.querySelector('#book-meta-content');
const MENU_BTN = document.querySelector('#js--menu-btn');
const THEME_CHANGE_BTN = document.querySelector('#js--theme-change-btn');
const BOOK_THEME_CARD = document.querySelector('#book-theme');

const BOOK_THEME = ['light', 'brown', 'green', 'purple', 'dark'];



// book
let book;
let rendition;
let metaData;
let mouseDown;
let isScrolling;
let showTopBar;
let navigation;
let spine;

renderBookThemeChangeCard();
renderBook();

function renderBookThemeChangeCard() {
    let bookThemeHtml = '';
    BOOK_THEME.forEach(data => {
        bookThemeHtml += `<div class="item ${data}" onclick="changeTheme('${data}')"></div>`
    });

    BOOK_THEME_CARD.innerHTML = bookThemeHtml;
}

function changeTheme(theme) {
    console.log(theme);
    rendition.themes.register(theme, '/styles/bookTheme.css')
    rendition.themes.select(theme)
}

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

        await loadBookInfo();
        rendition.display();
        renderToc()

        let scrollingDiv;
        // add effect on reader scroll
        rendition.once("rendered", (e, i) => {
            document.querySelector('.epub-container').addEventListener('scroll', () => {
                clearTimeout(isScrolling);
                let onScrollTimer = setTimeout(() => {
                    if (!showTopBar) {
                        TOP_MENU_BAR.style.top = '-100%';
                    }

                }, 100);

                // Set a timeout to run after scrolling ends
                isScrolling = setTimeout(function () {
                    clearTimeout(onScrollTimer);
                    showTopBar = false;
                    TOP_MENU_BAR.style.top = '0px';
                }, 1000);
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
                showTopBar = true;
                // cfiFromPercentage
                rendition.display(book.locations.cfiFromPercentage(e.target.value / 100));
            }, false);

            let currentLocation = rendition.currentLocation();
            let currentPage = book.locations.percentageFromCfi(currentLocation.start.cfi);
            BOOK_PROGRESS_RANGER.value = currentPage;
        });

        rendition.on('click', () => {
            hideAuxElement();
        });


        book.ready.then(() => {
            book.locations.generate(1024).then(data => {
                BOOK_PROGRESS_RANGER.removeAttribute('disabled')
                TOTAL_PAGE_ELEMENT.textContent = book.locations.total;
                console.log(book.rendition.currentLocation().end.percentage * 100);
                BOOK_PROGRESS_RANGER.value = book.rendition.currentLocation().end.percentage * 100;
                CURRENT_PAGE_ELEMENT.textContent = book.rendition.currentLocation().end.location;
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


async function loadBookInfo() {
    metaData = await book.loaded.metadata;
    navigation = await book.loaded.navigation;
    spine = await book.loaded.spine;
}

function renderToc() {
    let tocHtml = '';
    navigation.toc.forEach((data, index) => {
        tocHtml += `<div class="item" onclick="goToChapter('${data.href}')">
                        <p class="label"> ${data.label}</p>
                        <img src="/assets/icons/circle-fill.svg" alt="">
                    </div>`
    });

    TOC_ELEMENT.innerHTML = tocHtml;
}

function goToChapter(chapter) {
    rendition.display(chapter).then(() => {
        document.querySelector('.epub-view').scrollTo(0, 0);
        BOOK_META_ELEMENT.style.display = 'none';
        OVERLAY.style.display = 'none';

        rendition.display(chapter);
    });
    showTopBar = true;
}

function hideAuxElement() {
    BOOK_THEME_CARD.style.display = 'none';
    BOOK_META_ELEMENT.style.display = 'none';
}

OVERLAY.addEventListener('click', () => {
    BOOK_META_ELEMENT.style.display = 'none';
    OVERLAY.style.display = 'none';
});


MENU_BTN.addEventListener('click', () => {
    BOOK_META_ELEMENT.style.display = 'block';
    OVERLAY.style.display = 'block';

    // hide others
    BOOK_THEME_CARD.style.display = 'none';
}, false);

THEME_CHANGE_BTN.addEventListener('click', () => {
    BOOK_THEME_CARD.style.display = 'flex';
});