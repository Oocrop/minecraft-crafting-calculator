declare module "*.svg" {
	declare const url: string;
	export default url;
}
declare module "*.webp" {
	declare const url: string;
	export default url;
}

interface IMaterial {
	name: string;
	image?: string;
}

interface IRecipeCell {
	material: string;
	quantity: number;
}

enum RecipeType {
	CRAFTING,
	OTHER,
}

interface IRecipe {
	type: RecipeType;
	materials: (IRecipeCell | null)[];
	resultItem: string;
	resultQuantity: number;
	craftingTime?: number;
}

declare namespace JSX {
	interface ElementClass {
		connectedCallback?(): void;
		disconnectedCallback?(): void;
	}
	type IntrinsicElements = {
		[key: string]: Optional<HTMLElement>;
	};
}
