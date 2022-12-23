import "../styles/invslot.scss";

import {
	createElement,
	extractChildren,
	registerCustomElement,
} from "../util/dom";

import { DataProvider } from "../data";
import { ExtendedElement } from "../util/extendedElement";
import { MaterialSelector } from "./materialSelector";
import { Tooltip } from "./tooltip";

export function getMaterialImage(
	material: IMaterial,
): HTMLImageElement | null {
	if (!material.image) return null;
	if (material.image === "uploaded") {
		const img = <img src="" alt={material.name} />;
		DataProvider.getImageFor(material.name).then((image) => {
			if (image) img.src = image.data;
		});
		return img;
	} else if (material.image.startsWith("data:"))
		return <img src={material.image} alt={material.name} />;
	return (
		<img
			src={`/proxy/${encodeURIComponent(material.image)}`}
			alt={material.name}
		/>
	);
}

function getMaterialImageOrFallback(
	material: IMaterial,
): HTMLImageElement | string {
	if (material.image) return getMaterialImage(material)!;
	return material.name.substring(0, 2).trim();
}

@registerCustomElement<typeof InvSlot>()
export class InvSlot extends ExtendedElement {
	static tagName = "mc-inv-slot";

	material: IMaterial | null = null;
	customClickListener = false;
	clickable = true;
	stack = 1;
	filter?: (e: IMaterial) => boolean;

	#content?: HTMLDivElement;

	constructor() {
		super();
		this.prop(
			"clickable",
			(v) => this.classList.toggle("unclickable", !v),
			true,
		);
		this.prop<IMaterial | null>("material", () => this.update(), null);
		this.prop("stack", () => this.update(), 1);
	}

	connectedCallback() {
		this.#content = <div className="content"></div>;
		this.append(this.#content!);
		this.update();
		this.event("click", this.clickListener);
	}

	async clickListener(event: MouseEvent) {
		if (!this.clickable || this.customClickListener) return;
		const prev = this.material;
		this.material = await MaterialSelector.open(
			{ x: event.clientX, y: event.clientY },
			this.material,
			this.filter,
		);
		if (prev !== this.material) this.dispatchEvent(new Event("change"));
	}

	update() {
		if (!this.#content) return;
		extractChildren(this.#content);
		// @ts-expect-error
		if (this.material?.synthetic)
			this.#content.append(this.material.name.substring(0, 2));
		else if (this.material)
			this.#content.append(
				<Tooltip tooltipContent={this.material.name}>
					{getMaterialImageOrFallback(this.material)}
				</Tooltip>,
			);
		if (this.stack !== 1)
			this.#content.append(<span className="stack">{this.stack}</span>);
	}
}
