import {
	createElement,
	extractChildren,
	registerCustomElement,
} from "../util/dom";
import { ExtendedElement } from "../util/extendedElement";

@registerCustomElement<typeof TooltipContainer>()
export class TooltipContainer extends ExtendedElement {
	static tagName = "mc-tooltip-container";

	tooltip: HTMLElement | string | null = null;
	x = 0;
	y = 0;

	constructor() {
		super();
		this.prop("tooltip", () => this.update(), "");
		this.prop(
			"x",
			(v) => {
				const tooltip = this.querySelector<HTMLElement>(":scope>div");
				if (tooltip) tooltip.style.left = `${v + 5}px`;
			},
			0,
		);
		this.prop(
			"y",
			(v) => {
				const tooltip = this.querySelector<HTMLElement>(":scope>div");
				if (tooltip) tooltip.style.top = `${v + 5}px`;
			},
			0,
		);
	}

	update() {
		extractChildren(this);
		if (this.tooltip !== "")
			this.append(
				<div
					className="tooltip"
					style={{
						left: `${this.x + 5}px`,
						top: `${this.y + 5}px`,
					}}>
					{this.tooltip}
				</div>,
			);
	}
}
