const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: inline-flex;
            flex-direction: column;
            gap: 6px;
        }

        .label {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--primary, #1f3a5f);
        }

        .stars {
            display: flex;
            gap: 4px;
        }

        button {
            width: 44px;
            height: 44px;
            padding: 0;
            border: none;
            background: none;
            font-size: 1.75rem;
            line-height: 1;
            color: var(--border, #d9c9a8);
            cursor: pointer;
            transition: transform 0.15s, color 0.15s;
        }

        button:hover {
            transform: scale(1.15);
        }

        button.is-on {
            color: var(--accent, #4a7fb5);
        }

        button:focus-visible {
            outline: 2px solid var(--accent, #4a7fb5);
            outline-offset: 2px;
            border-radius: 8px;
        }
    </style>
    <span class="label"><slot>Twoja ocena</slot></span>
    <div class="stars"></div>
`;

class StarRating extends HTMLElement {
    static observedAttributes = ['value'];

    #stars;

    constructor() {
        super();
        this.attachShadow({ mode: 'open'});
        this.shadowRoot.append(template.content.cloneNode(true));
        this.#stars = this.shadowRoot.querySelector('.stars');

        for (let i = 1; i <= 5; i++) {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = '★';
            button.dataset.value =  i;
            button.setAttribute('aria-label', `Ocena ${i} z 5`);
            this.#stars.append(button);
        }
    }

    connectedCallback() {
        this.#stars.addEventListener('click', this.#handleClick);
        this.#render();
    }

    disconnectedCallback() {
        this.#stars.removeEventListener('click', this.#handleClick);
    }

    attributeChangedCallback() {
        this.#render();
    }

    get value() {
        const number = Number(this.getAttribute('value'));
        return number >= 0 && number <= 5 ? number :0;
    }

    set value(number) {
        this.setAttribute('value', number);
    }

    #handleClick = (event) => {
        const button = event.target.closest('button');
        if (!button) {
            return;
        }

        this.value = Number(button.dataset.value);

        this.dispatchEvent(new CustomEvent('rating-change', {
            detail: { value: this.value },
            bubbles: true,
            composed: true,
        }));
    };

    #render() {
        for (const button of this.#stars.children) {
            const isOn = Number(button.dataset.value) <= this.value;
            button.classList.toggle('is-on', isOn);
            button.setAttribute('aria-pressed', isOn);
        }
    }
}

customElements.define('star-rating', StarRating);

