import { DataProvider } from "./data";

type MaterialsRecord = Record<
	string,
	{
		total: number;
		spares: number;
	}
>;

export interface RecursedRecipe {
	craftingTime: number;
	material: string;
	materials: Array<[string, number] | RecursedRecipe>;
	quantity: number;
	sparesUsed?: Record<string, number>;
}

export class CraftingCalculator {
	materials: MaterialsRecord = {};

	async calculateRecipeFor(
		material: string,
		quantity: number,
		rawCostOnly = false,
	): Promise<RecursedRecipe | [string, number]> {
		const recipe = await DataProvider.getRecipeFor(material);
		if (recipe === null || typeof recipe === "undefined")
			return [material, quantity];
		/* eslint-disable no-mixed-spaces-and-tabs */
		const realQuantity =
			quantity % recipe.resultQuantity === 0
				? quantity
				: Math.floor(quantity / recipe.resultQuantity + 1) *
				  recipe.resultQuantity;
		/* eslint-enable no-mixed-spaces-and-tabs */
		if (typeof this.materials[material] === "undefined")
			this.materials[material] = {
				spares: realQuantity - quantity,
				total: realQuantity,
			};
		else {
			this.materials[material].spares += realQuantity - quantity;
			this.materials[material].total += realQuantity;
		}
		const materialsQuantity = realQuantity / recipe.resultQuantity;
		const materials: Record<string, number> = {};
		const sparesUsed: Record<string, number> = {};
		recipe.materials.forEach((m) => {
			if (m)
				if (typeof materials[m.material] === "undefined")
					materials[m.material] = m.quantity * materialsQuantity;
				else materials[m.material] += m.quantity * materialsQuantity;
		});
		Object.keys(materials).forEach((name) => {
			if (this.materials[name]?.spares > 0) {
				sparesUsed[name] = Math.min(
					this.materials[name].spares,
					materials[name],
				);
				materials[name] -= sparesUsed[name];
				this.materials[name].spares -= sparesUsed[name];
			}
		});
		let craftingTime = (recipe.craftingTime || 1) * materialsQuantity;
		const calculatedMaterials = await Promise.all(
			Object.entries(materials).map(([m, q]) =>
				this.calculateRecipeFor(m, q),
			),
		);
		calculatedMaterials.forEach((m) => {
			if (!Array.isArray(m)) craftingTime += m.craftingTime;
		});
		if (rawCostOnly) {
			const rawMaterials: Record<string, number> = {};
			const walk = (material: RecursedRecipe | [string, number]) => {
				if (Array.isArray(material)) {
					const [m, q] = material;
					if (typeof rawMaterials[m] === "undefined")
						rawMaterials[m] = q;
					else rawMaterials[m] += q;
				} else material.materials.forEach(walk);
			};
			calculatedMaterials.forEach(walk);
			return {
				craftingTime,
				material,
				materials: Object.entries(rawMaterials),
				quantity,
			};
		}
		return {
			craftingTime,
			material,
			materials: calculatedMaterials,
			quantity: realQuantity,
			sparesUsed,
		} as RecursedRecipe;
	}
}
