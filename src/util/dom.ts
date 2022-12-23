import { ExtendedElement } from "./extendedElement";

interface IElementProps {
	className?: string;
	attributes?: any;
	style?: {
		[key in keyof CSSStyleDeclaration]?:
			| CSSStyleDeclaration[key]
			| undefined;
	};
	onClick?(e: MouseEvent): void;
	onChange?(e: KeyboardEvent): void;
	[key: string]: any;
}
type createElementTag<TagName> = TagName extends keyof HTMLElementTagNameMap
	? HTMLElementTagNameMap[TagName]
	: HTMLElement;
type createElementRetType<
	TagName extends
		| (keyof HTMLElementTagNameMap | string)
		| typeof ExtendedElement,
> = TagName extends typeof ExtendedElement
	? TagName extends { tagName: "" }
		? never
		: TagName
	: createElementTag<TagName>;

export function createElement<
	TagName extends
		| (keyof HTMLElementTagNameMap | string)
		| typeof ExtendedElement,
>(
	_tag: TagName,
	props?: IElementProps | null,
	...children: Array<SVGElement | HTMLElement | string>
): createElementRetType<TagName> {
	const tag: string = typeof _tag === "string" ? _tag : _tag.tagName;
	const res = document.createElement(tag);
	if (props)
		Object.keys(props).forEach((prop) => {
			if (prop === "classList" || prop === "className") {
				const classes = props[prop]
					.split(" ")
					.filter((c: string) => c !== "");
				if (classes.length === 0) return;
				res.classList.add(...classes);
				return;
			} else if (prop === "style") {
				const style = props[prop] as CSSStyleDeclaration;
				for (const key in style)
					if (typeof res.style[key] === "undefined")
						res.style.setProperty(key, style[key]);
					else res.style[key] = style[key];

				return;
			} else if (prop === "attributes") {
				const attributes = props[prop] as any;
				for (const key in attributes)
					if (attributes[key])
						res.setAttribute(key, attributes[key]);

				return;
			} else if (
				res[prop.toLowerCase() as keyof HTMLElement] === null &&
				prop.toLowerCase().startsWith("on")
			) {
				res.addEventListener(
					prop.toLowerCase().replace("on", ""),
					props[prop],
				);
				return;
			}
			(res as any)[prop] = props[prop];
		});
	if (children)
		res.append(...children.flat().filter((child) => child !== null));
	return res as createElementRetType<TagName>;
}

type createSVGElementRetType<TagName> =
	TagName extends keyof SVGElementTagNameMap
		? SVGElementTagNameMap[TagName]
		: SVGElement;
export function createSVGElement<
	TagName extends keyof SVGElementTagNameMap | string,
>(tag: TagName, props: any, ...children: Array<HTMLElement | SVGElement>) {
	const res = document.createElementNS(
		"http://www.w3.org/2000/svg",
		tag,
	) as createSVGElementRetType<TagName>;
	if (props)
		Object.keys(props).forEach((prop) => {
			if (prop === "classList" || prop === "className") {
				res.classList.add(...props[prop].split(" "));
				return;
			} else if (prop === "style") {
				const style = props[prop] as CSSStyleDeclaration;
				for (const key in style)
					if (typeof res.style[key] === "undefined")
						res.style.setProperty(key, style[key]);
					else res.style[key] = style[key];

				return;
			} else if (prop === "attributes") {
				const attributes = props[prop];
				for (const key in attributes)
					if (attributes[key])
						res.setAttribute(key, attributes[key]);

				return;
			} else if (
				res[prop.toLowerCase() as keyof SVGElement] === null &&
				prop.toLowerCase().startsWith("on")
			) {
				res.addEventListener(
					prop.toLowerCase().replace("on", ""),
					props[prop],
				);
				return;
			}
			(res as any)[prop] = props[prop];
		});
	if (children)
		res.append(...children.flat().filter((child) => child !== null));
	return res;
}

export function extractChildren(obj: HTMLElement): HTMLElement[] {
	const childNodes = [...obj.childNodes] as HTMLElement[];
	childNodes.forEach((child) => child.remove());
	return childNodes;
}

type registerCustomElementReturn<
	N extends string | undefined,
	T,
> = N extends undefined
	? T extends { tagName: "" }
		? never
		: (target: T) => T
	: (target: T) => T;
export function registerCustomElement<
	T extends typeof ExtendedElement,
	N = T extends { tagName: "" } ? string : string | undefined,
>(_name?: N): registerCustomElementReturn<string | undefined, T> {
	if (_name && customElements.get(_name as string))
		return ((target: T) => target) as registerCustomElementReturn<
			string | undefined,
			T
		>;

	return function (target: T) {
		let name = _name as string | undefined;
		if (!name && target.tagName === "") return target;
		if (!name) name = target.tagName;
		if (customElements.get(name)) return target;
		target.tagName = name;
		const proto = target.prototype;
		const ogConnect = proto.connectedCallback;
		const ogDisconnect = proto.disconnectedCallback;
		proto.connectedCallback = function (
			this: InstanceType<T> & {
				hasDisconnected: boolean;
			},
		) {
			if (
				this.hasDisconnected ||
				typeof this.hasDisconnected === "undefined"
			) {
				ogConnect?.apply(this);
				this.hasDisconnected = false;
			}
		};
		proto.disconnectedCallback = function (
			this: InstanceType<T> & {
				hasDisconnected: boolean;
			},
		) {
			if (ogConnect) {
				extractChildren(this);
				this.__$clearListeners();
			}
			if (!this.hasDisconnected) ogDisconnect?.apply(this);

			this.hasDisconnected = true;
		};
		customElements.define(name, target);
		return target;
	} as registerCustomElementReturn<string | undefined, T>;
}

export function fixOverflow(what: HTMLElement, flip = false) {
	const bodyRect = document.body.getBoundingClientRect();
	const thisRect = what.getBoundingClientRect();
	if (thisRect.x + thisRect.width > bodyRect.width)
		what.style.left = `${
			thisRect.x -
			(flip
				? thisRect.width
				: thisRect.x + thisRect.width - bodyRect.width)
		}px`;

	if (thisRect.y + thisRect.height > bodyRect.height)
		what.style.top = `${
			thisRect.y -
			(flip
				? thisRect.height
				: thisRect.y + thisRect.height - bodyRect.height)
		}px`;
}
