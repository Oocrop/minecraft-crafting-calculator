import "../styles/modal.scss";
import { createElement, registerCustomElement } from "../util/dom";
import { ExtendedElement } from "../util/extendedElement";

@registerCustomElement<typeof Modal>()
export class Modal extends ExtendedElement {
	static tagName = "x-modal";

	#content?: HTMLDivElement;
	#children: Array<string | Node> = [];
	connectedCallback() {
		this.classList.add("modal");
		this.#content = <div className="modal-content">{this.#children}</div>;
		this.appendChild(this.#content!);
		this.event("click", (e) => {
			if (e.target === this) this.close();
		});
	}

	append(...nodes: (string | Node)[]): void {
		if (this.#content) this.#content.append(...nodes);
		else this.#children.push(...nodes);
	}

	close() {
		this.remove();
	}
}
