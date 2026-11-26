import { searchBooks } from './api.js';

const form = document.querySelector('#search-form');
const input = document.querySelector('#search-input');
const button = form.querySelector('button');
const status = document.querySelector('#search-status');
const results = document.querySelector('#results');
const template = document.querySelector('#result-template');

let lastQuery = '';
let currentBooks = [];
let isLoading = false;

function setStatus(text, type = '') {
    status.textContent = text;
    status.className = type;
}

function createCard(book, index) {
    const card = template.content.firstElementChild.cloneNode(true);
    const cover = card.querySelector('.cover');
    const img = card.querySelector('img');
    const coverTitle = card.querySelector('.cover-title');

    card.style.setProperty('--delay', `${index * 60}ms`);
    card.querySelector('.book-title').textContent = book.title;
    card.querySelector('.book-meta').textContent = book.year ? `${book.author} · ${book.year}` : book.author;
    card.querySelector('.add-btn').dataset.id = book.id;

    if (book.cover) {
        img.src = book.cover;
        img.alt = `Okładka ${book.title}`;
        coverTitle.remove();
    } else {
        img.remove();
        coverTitle.textContent = book.title;
        cover.classList.add(`cover--${index % 4}`);
    }

    return card;
}

function renderResults(books) {
    results.replaceChildren(...books.map(createCard));
}

async function handleSubmit(event) {
    event.preventDefault();
    const query = input.value.trim();

    if (query.length < 2) {
        setStatus('Wpisz co najmniej 2 znaki.', 'is-error');
        return;
    }

    if (isLoading || query.toLowerCase() === lastQuery) {
        return;
    }

    isLoading = true;
    button.disabled = true;
    setStatus('Szukam...', 'is-loading');

    try {
        const books = await searchBooks(query);
        lastQuery = query.toLowerCase();
        currentBooks = books;
        renderResults(books);

        if (books.length === 0) {
            setStatus(`Brak wyników dla "${query}". Spróbuj innego tytułu lub autora.`, 'is-empty');
        } else {
            setStatus(`Wyniki dla "${query}": ${books.length}`);
        }
    } catch (error) {
        setStatus(error.message, 'is-error');
    } finally {
        isLoading = false;
        button.disabled = false;
    }
}

function handleResultsClick(event) {
    const addButton = event.target.closest('.add-btn');
    if (!addButton) {
        return;
    }

    const book = currentBooks.find((item) => item.id === addButton.dataset.id);

    results.dispatchEvent(new CustomEvent('add-to-shelf', {
        detail: book,
        bubbles: true,
    }));

    addButton.textContent = '✓ Na półce';
    addButton.disabled = true;
}

export function initSearch() {
    form.addEventListener('submit', handleSubmit);
    results.addEventListener('click', handleResultsClick);
}