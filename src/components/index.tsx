import "./tooltip";
import "./tooltipContainer";
import "./newMaterialModal";

import { CraftingCalculator, RecursedRecipe } from "../craftingCalculator";
import { DataEvents, DataProvider } from "../data";
import {
	createElement,
	extractChildren,
	registerCustomElement,
} from "../util/dom";

import { ExtendedElement } from "../util/extendedElement";
import { MaterialSelector } from "./materialSelector";
import { RecipeGrid } from "./recipeGrid";
import { getMaterialImage } from "./invslot";
import { secondsToFullTime } from "../util/secondsToFullTime";

class Main extends ExtendedElement {
	static tagName = "mc-main";

	#unsubscribe?: () => void;
	#renderingDetails = false;

	connectedCallback(): void {
		const grid: RecipeGrid = (
			<RecipeGrid recipeSlotsLocked={true} unlimited={true} />
		);
		const calculatedDetails = <div></div>;
		const renderDetails = async () => {
			if (this.#renderingDetails) return;
			extractChildren(calculatedDetails);
			if (!grid.recipe) return;
			this.#renderingDetails = true;
			const calculator = new CraftingCalculator();
			calculatedDetails.append(
				await this.renderMaterialCost(
					await calculator.calculateRecipeFor(
						grid.recipe.resultItem,
						grid.recipe.resultQuantity,
						// eslint-disable-next-line @typescript-eslint/no-use-before-define
						rawCostCheckbox.checked,
					),
				),
			);
			this.#renderingDetails = false;
		};
		const rawCostCheckbox: HTMLInputElement = (
			<input
				id="raw-cost-checkbox"
				type="checkbox"
				placeholder="Raw Cost"
				onChange={() => renderDetails()}
			/>
		);
		this.append(
			<div className="recipe-cost">
				{grid}
				<label for="raw-cost-checkbox">
					{rawCostCheckbox} Raw Cost
				</label>
				{calculatedDetails}
			</div>,
			<div className="materials-viewer">
				<MaterialSelector alwaysVisible={true} />
			</div>,
		);
		grid.addEventListener("change", renderDetails);
		DataProvider.addEventListener(
			DataEvents.ANY_RECIPE as DataEvents & string,
			renderDetails,
		);
		this.#unsubscribe = () =>
			DataProvider.removeEventListener(
				DataEvents.ANY_RECIPE as DataEvents & string,
				renderDetails,
			);
	}

	disconnectedCallback(): void {
		this.#unsubscribe?.();
	}

	async renderMaterialCost(
		e: [string, number] | RecursedRecipe,
	): Promise<HTMLSpanElement | HTMLDetailsElement> {
		if (Array.isArray(e)) {
			const material = await DataProvider.getMaterial(e[0]);
			const image = material ? getMaterialImage(material) : null;
			if (image) Object.assign(image, { height: 20, width: 20 });
			return (
				<span>
					{image}
					{material?.name || e[0]}
					{` x${e[1]}`}
				</span>
			);
		}
		const material = await DataProvider.getMaterial(e.material);
		const image = material ? getMaterialImage(material) : null;
		if (image) Object.assign(image, { height: 20, width: 20 });
		/* eslint-disable no-mixed-spaces-and-tabs */
		return (
			<details
				classList="material-cost"
				open={
					!(
						e.materials.length === 1 &&
						(Array.isArray(e.materials[0])
							? e.materials[0][1] === e.quantity
							: e.materials[0].quantity === e.quantity)
					)
				}>
				<summary>
					{image}
					{material?.name}
					{` x${e.quantity}, ${secondsToFullTime(
						e.craftingTime,
					)} to craft`}
				</summary>
				{e.sparesUsed
					? Object.entries(e.sparesUsed).map(([n, q]) => (
							<span>
								Used {q} spare {n}
							</span>
					  ))
					: null}
				{await Promise.all(
					e.materials.map((e) => this.renderMaterialCost(e)),
				)}
			</details>
		);
		/* eslint-enable no-mixed-spaces-and-tabs */
	}
}
registerCustomElement<typeof Main>()(Main);
