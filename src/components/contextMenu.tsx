import "../styles/contextmenu.scss";

import { ExtendedElement } from "../util/extendedElement";
import { registerCustomElement } from "../util/dom";

@registerCustomElement<typeof ContextMenu>()
export class ContextMenu extends ExtendedElement {
	static tagName = "context-menu";

	x?: number;
	y?: number;
	target?: HTMLElement;

	connectedCallback() {
		this.classList.add("context-menu");
		this.#initialWidth = document.scrollingElement!.scrollWidth;
		this.#initialHeight = document.scrollingElement!.scrollHeight;
		setTimeout(
			() =>
				document.addEventListener("mousedown", this.offClickListener),
			0,
		);
		this.calcPosition();

		const start = Date.now();

		const repeatFix = () => {
			if (Date.now() - start > 1100) return;

			this.fixOverflow();
			requestAnimationFrame(repeatFix);
		};

		requestAnimationFrame(repeatFix);
	}

	disconnectedCallback() {
		document.removeEventListener("mousedown", this.offClickListener);
	}

	offClickListener = (e: MouseEvent) => {
		if (!this.contains(e.target as HTMLElement)) this.remove();
	};

	#initialWidth?: number;
	#initialHeight?: number;

	calcPosition() {
		const rect = this.getBoundingClientRect();
		const doc = document.scrollingElement!;
		if (typeof this.x !== "undefined" && typeof this.y !== "undefined") {
			if (this.x + doc.scrollLeft + rect.width > this.#initialWidth!)
				this.style.left = `${
					this.#initialWidth! + doc.scrollLeft - 8
				}px`;
			else this.style.left = `${this.x + doc.scrollLeft}px`;
			if (this.y + doc.scrollTop + rect.height > this.#initialHeight!)
				this.style.top = `${
					this.#initialHeight! + doc.scrollTop - 8
				}px`;
			else this.style.top = `${this.y + doc.scrollTop}px`;
		} else if (this.target) {
			const trect = this.target.getBoundingClientRect();
			let left = trect.left + doc.scrollLeft;
			let top = trect.bottom + doc.scrollTop + 8;
			if (left + rect.width >= this.#initialWidth!)
				left = this.#initialWidth! - 8;

			if (top + rect.height >= this.#initialHeight!)
				top = this.#initialHeight! - 8;

			this.style.left = `${left}px`;
			this.style.top = `${top}px`;
		} else {
			this.style.left = "8px";
			this.style.top = "8px";
		}
		this.fixOverflow();
	}

	fixOverflow = () => {
		const rect = this.getBoundingClientRect();
		const doc = document.scrollingElement!;
		if (rect.bottom + doc.scrollTop >= this.#initialHeight!)
			this.style.top = `${this.#initialHeight! - rect.height - 8}px`;

		if (rect.right + doc.scrollLeft >= this.#initialWidth!)
			this.style.left = `${this.#initialWidth! - rect.width - 8}px`;

		if (rect.left < 0) this.style.left = "8px";

		if (rect.top < 0) this.style.top = "8px";

		if (this.target) {
			const rect = this.getBoundingClientRect();
			const trect = this.target.getBoundingClientRect();
			if (
				(trect.bottom <= rect.bottom && trect.bottom >= rect.top) ||
				(trect.top <= rect.bottom && trect.top >= rect.top)
			)
				this.style.top = `${
					document.scrollingElement!.scrollTop +
					trect.top -
					rect.height -
					8
				}px`;
		}
	};
}
