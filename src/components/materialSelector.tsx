import "../styles/materialselector.scss";

import { DataEvents, DataProvider } from "../data";
import {
	createElement,
	extractChildren,
	fixOverflow,
	registerCustomElement,
} from "../util/dom";

import { ContextMenu } from "./contextMenu";
import { ExtendedElement } from "../util/extendedElement";
import { InvSlot } from "./invslot";
import { NewMaterialModal } from "./newMaterialModal";
import { concatClassnames } from "../util/concatClassnames";

interface IPosition {
	x: number;
	y: number;
}

@registerCustomElement<typeof MaterialSelector>()
export class MaterialSelector extends ExtendedElement {
	static tagName = "mc-material-selector";

	alwaysVisible = false;
	filter?: (e: IMaterial) => Promise<boolean>;
	material?: IMaterial | null;
	#container?: HTMLDivElement;
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	#close: (material?: IMaterial | null) => void = () => {};

	connectedCallback() {
		this.#container = (
			<div
				className={concatClassnames({
					"material-list-container": true,
					visible: this.alwaysVisible,
				})}
			/>
		);
		this.append(this.#container!);

		this.update();
		DataProvider.addEventListener(
			DataEvents.ANY_MATERIAL.toString() as DataEvents & string,
			this.update,
		);
	}

	disconnectedCallback(): void {
		DataProvider.removeEventListener(
			DataEvents.ANY_MATERIAL.toString() as DataEvents & string,
			this.update,
		);
	}

	#updating = false;

	update = async () => {
		if (this.#updating) return;
		if (!this.#container) return;
		this.#updating = true;
		extractChildren(this.#container!);
		const materialsCells: InvSlot[] = (
			await Promise.all(
				(
					await DataProvider.getMaterials()
				).map(async (m) => {
					if (this.filter && !(await this.filter(m))) return null;
					return (
						<InvSlot
							classList={
								this.material?.name === m.name
									? "selected"
									: ""
							}
							material={m}
							onClick={() => this.close(m)}
							customClickListener={true}
							onContextMenu={(e: MouseEvent) => {
								e.preventDefault();
								const menu = (
									<ContextMenu x={e.clientX} y={e.clientY}>
										<button
											onClick={() => {
												menu.remove();
												this.close(this.material);
												document.body.append(
													<NewMaterialModal
														material={m}
													/>,
												);
											}}>
											Edit
										</button>
										<button
											onClick={() => {
												menu.remove();
												if (
													this.material?.name ===
													m.name
												)
													this.close(null);
												else
													this.close(this.material);
												DataProvider.removeMaterial(
													m.name,
												);
											}}>
											Delete
										</button>
									</ContextMenu>
								);
								document.body.append(menu);
							}}
						/>
					);
				}),
			)
		).filter((e) => e !== null);
		const searchInput: HTMLInputElement = (
			<input
				placeholder="Search..."
				onKeyDown={setTimeout.bind(
					null,
					() => {
						const { value } = searchInput;
						materialsCells.forEach((c) =>
							c.style.setProperty(
								"display",
								c.material?.name
									.toLowerCase()
									.includes(value.toLowerCase())
									? null
									: "none",
							),
						);
					},
					1,
				)}
			/>
		);
		this.#container?.append(
			searchInput,
			<div className="material-list">
				{...materialsCells}
				{document.querySelector("mc-new-material-modal") === null ? (
					<InvSlot
						material={{ name: "+", synthetic: true }}
						customClickListener={true}
						onClick={() => {
							if (!this.alwaysVisible)
								this.#container?.classList.remove("visible");
							document.body.append(
								<NewMaterialModal
									onChange={
										async ({
											detail: materialName,
										}: CustomEvent) =>
											/* eslint-disable no-mixed-spaces-and-tabs, max-len */
											this.close(
												materialName === ""
													? null
													: await DataProvider.getMaterial(
															materialName,
													  ),
											)
										/* eslint-enable no-mixed-spaces-and-tabs, max-len */
									}
								/>,
							);
						}}
					/>
				) : null}
			</div>,
		);
		this.#updating = false;
	};

	offClick = (e: MouseEvent) => {
		if (this.contains(e.target as HTMLElement)) return;
		this.close(this.material);
	};

	open(position: IPosition, material?: IMaterial | null) {
		this.material = material;
		this.update();
		this.style.top = `${position.y}px`;
		this.style.left = `${position.x}px`;
		fixOverflow(this);
		this.#container?.classList.add("visible");
		setTimeout(
			() => document.addEventListener("click", this.offClick),
			1,
		);
		return new Promise<IMaterial | null>((res) => {
			this.#close = (material?: IMaterial | null) => {
				res(material || null);
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				this.#close = () => {};
			};
		});
	}

	close(material?: IMaterial | null) {
		if (this.alwaysVisible) return;
		this.#close(material);
		document.removeEventListener("click", this.offClick);
		this.remove();
	}

	static open(
		position: IPosition,
		material?: IMaterial | null,
		filter?: (e: IMaterial) => boolean,
	) {
		const instance = <MaterialSelector filter={filter} />;
		document.body.append(instance);
		return instance.open(position, material);
	}
}
