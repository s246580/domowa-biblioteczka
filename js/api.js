const API_URL = 'https://openlibrary.org/search.json';
const CACHE_KEY = 'biblioteczka-cache';
const CACHE_LIMIT = 10;
const TIMEOUT = 8000;

function readCache() {
    try {
        const data = JSON.parse(localStorage.getItem(CACHE_KEY));
        return data && typeof data === 'object' ? data : {};
    } catch (error) {
        return {};
    }
}

function saveToCache(key, books) {
    const cache = readCache();
    delete cache[key];
    cache[key] = books;

    const keys = Object.keys(cache);
    if (keys.length > CACHE_LIMIT) {
        delete cache[keys[0]];
    }

    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        // brak miejsca w localStorage - wyniki i tak się wyświetlą 
    }
}

function toBook(doc) {
    return {
        id: doc.key,
        title: doc.title,
        author: doc.author_name ? doc.author_name.join(', ') : 'Autor nieznany',
        year: doc.first_publish_year ?? '',
        cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : '',
    };
}

export async function searchBooks(query) {
    const key = query.trim().toLowerCase();
    const cache = readCache();

    if (cache[key]) {
        return cache[key];
    }

    const params = new URLSearchParams({
        q: query.trim(),
        limit: 12,
        fields: 'key,title,author_name,cover_i,first_publish_year',
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    try {
        const response = await fetch(`${API_URL}?${params}`, { signal: controller.signal });

        if (!response.ok) {
            throw new Error(`Błąd serwera: ${response.status}`);
        }

        const data = await response.json();
        const books = data.docs.map(toBook);
        saveToCache(key, books);
        return books;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Open Library nie odpowiada. Spróbuj ponownie za chwilę.');
        }
        throw new Error('Nie udało się pobrać wyników. Sprawdź połączenie i spróbuj ponownie.');
    } finally {
        clearTimeout(timer);
    }
}