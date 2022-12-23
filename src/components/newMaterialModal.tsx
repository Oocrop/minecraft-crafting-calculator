import "../styles/newmaterialmodal.scss";

import { createElement, registerCustomElement } from "../util/dom";

import { DataProvider } from "../data";
import { Modal } from "./modal";
import { RecipeGrid } from "./recipeGrid";

class ImagePicker {
	#pickerElement: HTMLInputElement = (
		<input
			id="importer"
			placeholder="Image picker"
			type="file"
			accept="image/*"
		/>
	);

	#downscalingCanvas: HTMLCanvasElement = (
		<canvas width="16" height="16" />
	);

	#downscalingCtx = this.#downscalingCanvas.getContext("2d")!;

	constructor() {
		this.#downscalingCtx.imageSmoothingEnabled = false;
		this.#downscalingCtx.fillStyle = "#fff";
	}

	pick(): Promise<string | null> {
		return new Promise((res) => {
			this.#pickerElement.addEventListener(
				"change",
				() => {
					const file = this.#pickerElement.files?.[0];
					if (file) {
						const img = new Image();
						img.src = URL.createObjectURL(file);
						img.onload = () => {
							this.#downscalingCtx.drawImage(img, 0, 0, 16, 16);
							res(
								this.#downscalingCanvas.toDataURL(
									"image/png",
									1,
								),
							);
							URL.revokeObjectURL(img.src);
							this.#downscalingCtx.clearRect(0, 0, 16, 16);
						};
					} else res(null);
				},
				{
					once: true,
				},
			);
			this.#pickerElement.click();
		});
	}
}

const picker = new ImagePicker();

@registerCustomElement<typeof NewMaterialModal>()
export class NewMaterialModal extends Modal {
	static tagName = "mc-new-material-modal";

	material: IMaterial | null = null;

	#nameInput?: HTMLInputElement;
	#imageInput?: HTMLInputElement;

	#recipePreview?: RecipeGrid;

	#selectedImage: string | null = null;

	connectedCallback() {
		this.#nameInput = (
			<input
				placeholder="Material Name"
				onChange={() => this.changeRecipePreview()}
				value={this.material?.name || ""}
				disabled={this.material !== null}
			/>
		);
		this.#imageInput = (
			<input
				placeholder="External Image URL"
				onChange={() => this.changeRecipePreview()}
				value={this.material?.image || ""}
			/>
		);

		this.#recipePreview = (
			<RecipeGrid
				resultMaterial={this.material}
				resultSlotLocked={true}
			/>
		);

		this.append(
			<div className="wrapper">
				{this.#nameInput!}
				<div className="image-selection">
					{this.#imageInput!} or
					<button
						onClick={async () => {
							const res = await picker.pick();
							if (!res) return;
							this.#imageInput!.value = "uploaded";
							this.#selectedImage = res;
							this.changeRecipePreview();
						}}>
						Choose a file
					</button>
				</div>
				{this.#recipePreview!}
			</div>,
			<div className="buttons-container">
				<button onClick={() => this.close()}>Confirm</button>
			</div>,
		);
		super.connectedCallback();
	}

	changeRecipePreview() {
		this.#recipePreview!.resultMaterial = {
			image:
				this.#imageInput!.value === "uploaded" && this.#selectedImage
					? this.#selectedImage
					: this.#imageInput!.value,
			name: this.#nameInput!.value,
		};
	}

	close(): void {
		const result = this.#nameInput!.value.trim();
		if (result !== "") {
			DataProvider.editMaterial({
				image: this.#imageInput!.value,
				name: result,
			});
			if (this.#imageInput!.value === "uploaded" && this.#selectedImage)
				DataProvider.editImage(result, this.#selectedImage);
			else if (this.#imageInput!.value !== "uploaded" && this.material)
				DataProvider.removeImage(result);
		}
		if (this.#recipePreview?.recipe?.materials.some((m) => m !== null))
			DataProvider.editRecipe(this.#recipePreview.recipe);
		this.dispatchEvent(
			new CustomEvent("change", {
				detail: result === "" ? null : result,
			}),
		);
		super.close();
	}
}
