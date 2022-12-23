import "../styles/tooltip.scss";

import { ExtendedElement } from "../util/extendedElement";
import { TooltipContainer } from "./tooltipContainer";
import { registerCustomElement } from "../util/dom";

@registerCustomElement<typeof Tooltip>()
export class Tooltip extends ExtendedElement {
	static tagName = "mc-tooltip";

	tooltipContent: HTMLElement | string | null = null;

	#mouseOver = false;

	constructor() {
		super();
		this.prop(
			"tooltipContent",
			(v) => {
				if (this.#mouseOver) {
					const tooltip = document.querySelector(
						"mc-tooltip-container",
					) as TooltipContainer;
					tooltip.tooltip = v;
				}
			},
			null,
		);
	}

	connectedCallback(): void {
		this.event("mouseenter", this.mouseEnter);
		this.event("mousemove", this.mouseMove);
		this.event("mouseleave", this.mouseLeave);
	}

	disconnectedCallback(): void {
		if (this.#mouseOver)
			(
				document.querySelector(
					"mc-tooltip-container",
				) as TooltipContainer
			).tooltip = null;
	}

	mouseEnter(event: MouseEvent) {
		const tooltip = document.querySelector(
			"mc-tooltip-container",
		) as TooltipContainer;
		tooltip.tooltip = this.tooltipContent;
		tooltip.x = event.pageX;
		tooltip.y = event.pageY;
		this.#mouseOver = true;
	}

	mouseMove(event: MouseEvent) {
		const tooltip = document.querySelector(
			"mc-tooltip-container",
		) as TooltipContainer;
		tooltip.x = event.pageX;
		tooltip.y = event.pageY;
	}

	mouseLeave() {
		const tooltip = document.querySelector(
			"mc-tooltip-container",
		) as TooltipContainer;
		tooltip.tooltip = null;
		this.#mouseOver = false;
	}
}
