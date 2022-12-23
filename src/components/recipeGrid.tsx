import "../styles/recipeGrid.scss";

import { DataEvents, DataProvider } from "../data";
import {
	createElement,
	extractChildren,
	registerCustomElement,
} from "../util/dom";

import Arrow from "../assets/arrow.webp";
import CraftingTable from "../assets/crafting_table.webp";
import { ExtendedElement } from "../util/extendedElement";
import Furnace from "../assets/furnace.webp";
import { InvSlot } from "./invslot";
import { secondsToFullTime } from "../util/secondsToFullTime";

@registerCustomElement<typeof RecipeGrid>()
export class RecipeGrid extends ExtendedElement {
	static tagName = "mc-recipe-grid";

	resultMaterial: IMaterial | null = null;

	resultSlotLocked = false;
	recipeSlotsLocked = false;

	type: RecipeType = 0;

	unlimited = false;

	#resultCell?: InvSlot;
	#typeBtn?: HTMLButtonElement;
	#craftingTimeInput?: HTMLInputElement;

	#CraftingTableImg = (
		<img
			src={CraftingTable}
			width={32}
			alt="Crafting Type: Crafting Table"
		/>
	);

	#FurnaceImg = (
		<img src={Furnace} width={32} alt="Crafting Type: Other" />
	);

	recipe: IRecipe | null = null;

	constructor() {
		super();
		this.prop<IMaterial | null>(
			"resultMaterial",
			async (v) => {
				if (v)
					this.recipe = (await DataProvider.getRecipeFor(
						v.name,
					)) || {
						materials: [
							null,
							null,
							null,
							null,
							null,
							null,
							null,
							null,
							null,
						],
						resultItem: v.name,
						resultQuantity: 1,
						type: this.type,
					};
				else this.recipe = null;
				this.type = this.recipe?.type || this.type;
				if (this.#craftingTimeInput)
					this.#craftingTimeInput.value = (
						this.recipe?.craftingTime || 1
					).toString();
				this.render();
			},
			null,
		);
		this.prop(
			"resultSlotLocked",
			(v) => {
				if (this.#resultCell) this.#resultCell.clickable = !v;
			},
			false,
		);
		this.prop("recipeSlotsLocked", () => this.render(), false);
		this.prop(
			"type",
			(v) => {
				if (this.recipe) {
					this.recipe.type = v;
					if (v === 0) {
						this.recipe.craftingTime = 1;
						this.recipe.materials.forEach(
							(e) => e && (e.quantity = 1),
						);
					}
				}
				if (!this.#typeBtn) return;
				extractChildren(this.#typeBtn);
				if (v === 0) this.#typeBtn.append(this.#CraftingTableImg);
				else if (v === 1) this.#typeBtn.append(this.#FurnaceImg);
				this.render();
			},
			0,
		);
	}

	connectedCallback(): void {
		this.#typeBtn = (
			<button onClick={() => (this.type = this.type === 0 ? 1 : 0)}>
				{(this.recipe?.type || this.type) === 0
					? this.#CraftingTableImg
					: this.#FurnaceImg}
			</button>
		);
		this.#craftingTimeInput = (
			<input
				className="time"
				type="number"
				placeholder="Crafting Time"
				value={this.recipe?.craftingTime || 1}
				onKeyUp={() => {
					if (!this.recipe) return;
					this.recipe.craftingTime = parseInt(
						this.#craftingTimeInput!.value,
					);
				}}
				onChange={() => {
					if (!this.recipe) return;
					this.recipe.craftingTime = parseInt(
						this.#craftingTimeInput!.value,
					);
				}}
			/>
		);
		this.render();
		DataProvider.addEventListener(
			DataEvents.ANY.toString() as DataEvents & string,
			this.rerender,
		);
	}

	disconnectedCallback(): void {
		DataProvider.removeEventListener(
			DataEvents.ANY.toString() as DataEvents & string,
			this.rerender,
		);
	}

	#rendering = false;

	rerender = () => this.render();

	async render() {
		if (this.#rendering || !this.isConnected) return;
		this.#rendering = true;
		extractChildren(this);
		const recipeSlots: InvSlot[][] = [];
		/* eslint-disable no-mixed-spaces-and-tabs */
		for (let row = 0; row < 3; row++) {
			recipeSlots[row] = [];
			for (let col = 0; col < 3; col++)
				recipeSlots[row][col] = (
					<InvSlot
						material={
							this.recipe?.materials[row * 3 + col]?.material
								? (await DataProvider.getMaterial(
										this.recipe!.materials[row * 3 + col]!
											.material,
								  )) || {
										name: this.recipe!.materials[
											row * 3 + col
										]!.material,
								  }
								: null
						}
						stack={
							this.recipe?.materials[row * 3 + col]?.quantity
								? this.recipe!.materials[row * 3 + col]!
										.quantity
								: null
						}
						clickable={!this.recipeSlotsLocked}
						onChange={() => {
							if (this.recipe)
								if (!recipeSlots[row][col].material?.name)
									this.recipe.materials[row * 3 + col] =
										null;
								else if (
									this.recipe.materials[row * 3 + col] ===
									null
								)
									this.recipe.materials[row * 3 + col] = {
										material:
											recipeSlots[row][col].material!
												.name,
										quantity: 1,
									};
								else
									this.recipe.materials[
										row * 3 + col
									]!.material =
										recipeSlots[row][col].material!.name;
						}}
						onContextMenu={(e: MouseEvent) => {
							e.preventDefault();
							if (this.recipe)
								this.recipe.materials[row * 3 + col] = null;
							recipeSlots[row][col].material = null;
						}}
						onWheel={(e: WheelEvent) => {
							if (this.type === 0) return;
							if (
								!this.recipe ||
								!recipeSlots[row][col].material?.name
							)
								return;
							e.preventDefault();
							recipeSlots[row][col].stack = Math.max(
								Math.min(
									Math.floor(
										recipeSlots[row][col].stack +
											e.deltaY / -100,
									),
									64,
								),
								1,
							);
							this.recipe.materials[row * 3 + col]!.quantity =
								recipeSlots[row][col].stack;
						}}
						filter={(e: IMaterial) =>
							e.name !== this.resultMaterial?.name
						}
					/>
				);
		}
		/* eslint-enable no-mixed-spaces-and-tabs */
		this.#resultCell = (
			<InvSlot
				classList="large"
				material={this.resultMaterial}
				clickable={!this.resultSlotLocked}
				onChange={async () => {
					this.resultMaterial = this.#resultCell!.material;
					if (this.resultMaterial?.name) {
						this.recipe = await DataProvider.getRecipeFor(
							this.resultMaterial.name,
						);
						this.render();
					}
					this.dispatchEvent(new Event("change"));
				}}
				onWheel={(e: WheelEvent) => {
					if (!this.#resultCell?.material) return;
					e.preventDefault();
					this.#resultCell.stack = Math.max(
						Math.min(
							Math.floor(
								this.#resultCell.stack + e.deltaY / -100,
							),
							this.unlimited || this.type === 1 ? Infinity : 64,
						),
						1,
					);
					if (this.recipe)
						this.recipe.resultQuantity = this.#resultCell.stack;
					this.dispatchEvent(new Event("change"));
				}}
				filter={(e: IMaterial) => DataProvider.getRecipeFor(e.name)}
				stack={this.recipe?.resultQuantity || 1}
			/>
		);
		this.append(
			<div>
				{recipeSlots.map((r) => (
					<div>{r}</div>
				))}
			</div>,
			<img src={Arrow} alt="Crafting result arrow" />,
			this.#resultCell!,
		);
		if (this.recipeSlotsLocked) {
			if (this.recipe && this.type !== 0)
				this.append(
					<span className="time">
						{secondsToFullTime(this.recipe.craftingTime || 1)}
					</span>,
				);
		} else {
			this.append(this.#typeBtn!);
			if (this.type !== 0) this.append(this.#craftingTimeInput!);
		}
		this.#rendering = false;
	}
}
