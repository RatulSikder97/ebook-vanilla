let param = URLSearchParams && new URLSearchParams(document.location.search.substring(1));
const BOOK_URL = param && param.get('url') && decodeURIComponent(param.get('url'));
const USER_ID = param && param.get('userId') && decodeURIComponent(param.get('userId'));
const BOOK_ID = param && param.get('bookId') && decodeURIComponent(param.get('bookId'));

// ELEMENTS
const BOOK_RENDER_VIEWER = document.querySelector('#reader-view');
const TOP_MENU_BAR = document.querySelector('#top-menu-bar');
const BOTTOM_MENU_BAR = document.querySelector('#bottom-menu-bar');
const BOOK_PROGRESS_RANGER = document.querySelector('#js--book-percentage');
const CURRENT_PAGE_ELEMENT = document.querySelector('#js--current-page');
const TOTAL_PAGE_ELEMENT = document.querySelector('#js--total-page');
const TOC_ELEMENT = document.querySelector('#js--toc');
const OVERLAY = document.querySelector('#js--overlay');
const BOOK_META_ELEMENT = document.querySelector('#book-meta-content');
const MENU_BTN = document.querySelector('#js--menu-btn');
const THEME_CHANGE_BTN = document.querySelector('#js--theme-change-btn');
const FONT_SIZE_CHANGE_BTN = document.querySelector('#js--font-size-btn');
const BOOK_THEME_CARD = document.querySelector('#book-theme');
const FONT_RESIZE_CARD = document.querySelector('#js--font-sizer');
const FONT_RESIZE_RANGE = document.querySelector('#js--font-resize-ranger');
const BOOK_NAME_ELEMENT = document.querySelector('#js--book-name');
const BOOK_AUTHOR_ELEMENT = document.querySelector('#js--book-author');
const BOOK_COVER_ELEMENT = document.querySelector('#js--cover-img');
const BOOK_HIGHLIGHT_CONTENT = document.querySelector('#js--highlight-colors');
const BOOK_HIGHLIGHTER = document.querySelector('#js--highlighter');

const BOOK_THEME = ['light', 'brown', 'green', 'purple', 'dark'];
const BOOK_HIGHLIGHT_COLORS = ['blue', 'orange', 'red'];



// book
let book;
let rendition;
let metaData;
let mouseDown;
let isScrolling;
let showTopBar;
let navigation;
let spine;

let bookCoverImage;
let bookName;
let bookAuthor;

let selectedCfi;
let selectedContent;
let epubSelection;
let PageListBase = [];
let BookTotalPage = 0;
let BookPercentage = 0;
let lastReadLocation = localStorage.getItem(BOOK_ID) ? localStorage.getItem(BOOK_ID) : '';
renderBookHighlighterColor();
renderBookThemeChangeCard();
renderBook();

/**
 *
 */
function renderBookThemeChangeCard() {
	let bookThemeHtml = "";
	BOOK_THEME.forEach((data) => {
		bookThemeHtml += `<div class="item ${data}" onclick="changeTheme('${data}')"></div>`;
	});

	BOOK_THEME_CARD.innerHTML = bookThemeHtml;
}

/**
 *
 */
function renderBookHighlighterColor() {
	let bookHighlightColorHtml = "";
	BOOK_HIGHLIGHT_COLORS.forEach((data) => {
		bookHighlightColorHtml += `<div class="${data}" onclick="highlightSelection('${data}')"></div>`;
	});

	BOOK_HIGHLIGHT_CONTENT.innerHTML = bookHighlightColorHtml;
}

/**
 *
 * @param {*} theme
 */
function changeTheme(theme) {
	rendition.themes.register(theme, "/styles/bookTheme.css");
	rendition.themes.select(theme);
	BOTTOM_MENU_BAR.classList = [];
	BOTTOM_MENU_BAR.classList.add(theme);
	TOP_MENU_BAR.classList = [];
	TOP_MENU_BAR.classList.add(theme);
}

/**
 *
 * @param {*} color
 */
function highlightSelection(color) {
	rendition.annotations.highlight(
		selectedCfi, {},
		(e) => {
			console.log(e);
		},
		"h-" + color,
	);

	BOOK_HIGHLIGHTER.style.visibility = "hidden";
	epubSelection.removeAllRanges();
}

/**
 * User Verification
 * @returns status: boolean
 */
function userVerification() {
	if (!USER_ID) {
		console.log("[ERROR] Invalid Authentication!");
		return;
	}

	console.log("[SUCCESS] Authenticate User 😍.");
	return true;
}

/**
 * Check Book Url Nullity
 * @returns status: book status in boolean
 */
function checkBookUrl() {
	if (!BOOK_URL) {
		console.log("[ERROR] BOOK IS NULL!");
		return;
	}

	console.log("[SUCCESS] BOOK INITIATED.");
	return true;
}

/**
 * Initiate Book
 */
function initBook() {
	book = ePub("/assets/Alatchakra.epub");
}

/**
 * Main Render Function
 */
async function renderBook() {
	if (userVerification() && checkBookUrl()) {
		initBook();

		rendition = book.renderTo("reader-view", {
			width: "100%",
			height: "100%",
			flow: "paginated",
			manager: "continuous",
			snap: true,
		});

		loadBookInfo().then(() => {
			renderBookMetaInfo(bookCoverImage, metaData.title, metaData.creator);
			renderToc();
		});
		rendition.display(lastReadLocation == '' ? 0 : lastReadLocation);
		document.addEventListener("keyup", (event) => {
			let kc = event.keyCode || event.which;
			if (kc == 37) rendition.prev();
			if (kc == 39) rendition.next();
		});

		// add effect on reader scroll
		rendition.once("rendered", (e, i) => {
			document
				.querySelector(".epub-container")
				.addEventListener("scroll", () => {
					hideAuxElement();

					clearTimeout(isScrolling);
					let onScrollTimer = setTimeout(() => {
						if (!showTopBar) {
							TOP_MENU_BAR.style.top = "-100%";
						}
					}, 100);

					// Set a timeout to run after scrolling ends
					isScrolling = setTimeout(function () {
						clearTimeout(onScrollTimer);
						showTopBar = false;
						TOP_MENU_BAR.style.top = "0px";
					}, 1000);
				});

			BOOK_PROGRESS_RANGER.addEventListener(
				"mousedown",
				function () {
					mouseDown = true;
				},
				false,
			);
			BOOK_PROGRESS_RANGER.addEventListener(
				"mouseup",
				function () {
					mouseDown = false;
				},
				false,
			);

			let currentLocation = rendition.currentLocation();
			let currentPage = book.locations.percentageFromCfi(
				currentLocation.start.cfi,
			);
			console.log(currentPage);
			BOOK_PROGRESS_RANGER.value = currentPage;
		});

		rendition.once("displayed", (e, i) => {
			BOOK_PROGRESS_RANGER.addEventListener(
				"mousedown",
				function () {
					mouseDown = true;
				},
				false,
			);
			BOOK_PROGRESS_RANGER.addEventListener(
				"mouseup",
				function () {
					mouseDown = false;
				},
				false,
			);

			BOOK_PROGRESS_RANGER.addEventListener(
				"change",
				(e) => {
					showTopBar = true;
					// cfiFromPercentage

					rendition.display(book.locations.cfiFromPercentage(e.target.value/100));
				},
				false,
			);

			let currentLocation = rendition.currentLocation();
			let currentPage = book.locations.percentageFromCfi(
				currentLocation.start.cfi,
			);
			BOOK_PROGRESS_RANGER.value = currentPage;
			getTotalPage();
		});

		rendition.on("click", () => {
			hideAuxElement();
		});

		book.ready.then(() => {
			book.locations.generate(1024).then((data) => {
				BOOK_PROGRESS_RANGER.removeAttribute("disabled");
				BOOK_PROGRESS_RANGER.value =
					book.rendition.currentLocation().end.percentage * 100;
			});
		});

		rendition.on("relocated", (location) => {
			BookPercentage = Math.floor(
				((book.rendition.currentLocation().start.displayed.page +
						(book.rendition.currentLocation().end.index == 0 ?
							0 :
							PageListBase[book.rendition.currentLocation().end.index - 1])) /
					BookTotalPage) *
				100,
			);

			lastReadLocation = rendition.currentLocation().start.cfi;
			localStorage.setItem(BOOK_ID, rendition.currentLocation().start.cfi)


			if (!mouseDown) {
				BOOK_PROGRESS_RANGER.value =
					book.rendition.currentLocation().end.percentage * 100;
			}
			CURRENT_PAGE_ELEMENT.textContent =
				book.rendition.currentLocation().start.displayed.page +
				(book.rendition.currentLocation().end.index == 0 ?
					0 :
					PageListBase[book.rendition.currentLocation().end.index - 1]);
		});

		rendition.on("selected", (cfi, content) => {
			epubSelection = content.window.getSelection();
			const frame = content.document.defaultView.frameElement;

			let range = epubSelection.getRangeAt(0),
				clientRects = range.getBoundingClientRect();

			const {
				left,
				right,
				top,
				bottom
			} = getRect(range, frame);

			selectedCfi = cfi;
			selectedContent = epubSelection.toString();
			BOOK_HIGHLIGHTER.style.top = bottom + "px";
			if (left + 180 >= window.innerWidth) {
				BOOK_HIGHLIGHTER.style.left = left - 100 + "px";
			} else if (left - 30 < 0) {
				BOOK_HIGHLIGHTER.style.left = 30 + "px";
			} else {
				BOOK_HIGHLIGHTER.style.left = left + "px";
			}

			if (epubSelection.toString().length > 0) {
				BOOK_HIGHLIGHTER.style.visibility = "visible";
			} else {
				BOOK_HIGHLIGHTER.style.visibility = "hidden";
			}
		});
	}
}

async function loadBookInfo() {
	metaData = await book.loaded.metadata;
	navigation = await book.loaded.navigation;
	spine = await book.loaded.spine;

	// load cover image
	let cover = await book.loaded.cover;
	bookCoverImage = await book.archive.createUrl(cover, {
		base64: true,
	});
}
let hiddenRender;

function getTotalPage(fontSize) {
	const container = document.createElement("div");
	container.setAttribute("id", "reader-container");
	container.style.visibility = "hidden";
	container.style.overflow = "hidden";
	container.style.height = 0;
	container.style.width = 0;
	ReaderElement = document
		.querySelector("#reader-view")
		.getBoundingClientRect();

	const hiddenEpubElement = document.createElement("div");
	hiddenEpubElement.setAttribute("id", "reader-hidden");
	hiddenEpubElement.style.visibility = "hidden";
	hiddenEpubElement.style.overflow = "hidden";
	hiddenEpubElement.style.height = ReaderElement.height + "px";
	hiddenEpubElement.style.width = ReaderElement.width - 20 + "px";

	container.appendChild(hiddenEpubElement);
	document.body.appendChild(container);

	const hiddenBook = ePub("/assets/Alatchakra.epub");

	hiddenRender = hiddenBook.renderTo(hiddenEpubElement, {
		width: ReaderElement.width,
		height: ReaderElement.height - 20,
		flow: "paginated",
		manager: "continuous",
		snap: true,
	});
	hiddenRender.themes.fontSize(fontSize+'px')
	generatePagination(hiddenBook, hiddenRender).then((data) => {
		hiddenRender.destroy();
		document.querySelector("#reader-container").remove();
		PageListBase = data.pageListBase;

		BOOK_PROGRESS_RANGER.removeAttribute("disabled");
		BookTotalPage = data.totalPage;
		TOTAL_PAGE_ELEMENT.textContent = data.totalPage;
		BOOK_PROGRESS_RANGER.value =
			((book.rendition.currentLocation().start.displayed.page +
					(book.rendition.currentLocation().end.index == 0 ?
						0 :
						PageListBase[book.rendition.currentLocation().end.index - 1])) /
				data.totalPage) *
			100;
		CURRENT_PAGE_ELEMENT.textContent =
			book.rendition.currentLocation().start.displayed.page +
			(book.rendition.currentLocation().end.index == 0 ?
				0 :
				PageListBase[book.rendition.currentLocation().end.index - 1]);
	});
}

function generatePagination(bookInp, renderer) {
	book.rendition.display(lastReadLocation);
	let totalPage = 0;
	let chapterBase = [];
	return bookInp.loaded.spine.then(async (data) => {
		await data.items.reduce(
			(p, x) =>
			p.then(async () => {
				await renderer.display(x.href);
				totalPage += renderer.currentLocation().start.displayed.total;
				chapterBase.push(totalPage);
				console.log(chapterBase, totalPage);
			}),
			Promise.resolve(),
		);

		return new Promise((res) => {
			res({
				pageListBase: chapterBase,
				totalPage: totalPage,
			});
		});
	});
}

function renderToc() {
	let tocHtml = "";
	navigation.toc.forEach((data, index) => {
		tocHtml += `<div class="item" onclick="goToChapter('${data.href}')">
                        <p class="label"> ${data.label}</p>
                        <img src="/assets/icons/circle-fill.svg" alt="">
                    </div>`;
	});

	TOC_ELEMENT.innerHTML = tocHtml;
}
/**
 *
 * @param {*} name
 * @param {*} author
 */
function renderBookMetaInfo(coverImage, name, author) {
	BOOK_COVER_ELEMENT.src = coverImage;
	BOOK_NAME_ELEMENT.textContent = name;
	BOOK_AUTHOR_ELEMENT.textContent = author;
}

function goToChapter(chapter) {
	rendition.display(chapter).then(() => {
		document.querySelector(".epub-view").scrollTo(0, 0);
		BOOK_META_ELEMENT.style.display = "none";
		OVERLAY.style.display = "none";

		rendition.display(chapter);
	});
	showTopBar = true;
}

function hideAuxElement() {
	BOOK_THEME_CARD.style.display = "none";
	BOOK_META_ELEMENT.style.display = "none";
	FONT_RESIZE_CARD.style.display = "none";
}

OVERLAY.addEventListener("click", () => {
	BOOK_META_ELEMENT.style.display = "none";
	OVERLAY.style.display = "none";
});

MENU_BTN.addEventListener(
	"click",
	() => {
		hideAuxElement();
		BOOK_META_ELEMENT.style.display = "block";
		OVERLAY.style.display = "block";
	},
	false,
);

THEME_CHANGE_BTN.addEventListener("click", () => {
	hideAuxElement();
	BOOK_THEME_CARD.style.display = "flex";
});

FONT_SIZE_CHANGE_BTN.addEventListener("click", () => {
	hideAuxElement();
	FONT_RESIZE_CARD.style.display = "flex";
});

FONT_RESIZE_RANGE.addEventListener("change", (e) => {
	rendition.themes.fontSize(e.target.value + "px");
	showTopBar = true;
	getTotalPage(e.target.value);
	book.rendition.display(lastReadLocation);
});

/**
 *
 * @param {*} target
 * @param {*} frame
 * @returns
 */
const getRect = (target, frame) => {
	const rect = target.getBoundingClientRect();
	const viewElementRect = frame ?
		frame.getBoundingClientRect() :
		{
			left: 0,
			top: 0,
		};
	const left = rect.left + viewElementRect.left;
	const right = rect.right + viewElementRect.left;
	const top = rect.top + viewElementRect.top;
	const bottom = rect.bottom + viewElementRect.top;
	return {
		left,
		right,
		top,
		bottom,
	};
};