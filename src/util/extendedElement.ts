interface IElementProp<T> {
	name: string;
	onChange(v: T): void;
	defaultValue?: T;
	fromAttr?(v: string): T;
	attrName?: string;
}

interface ICustomElement {
	connectedCallback?(): void;
	disconnectedCallback?(): void;
}

const kebabize = (str: string) =>
	str
		.split("")
		.map((c, i) =>
			c.toUpperCase() === c
				? `${i === 0 ? "" : "-"}${c.toLowerCase()}`
				: c,
		)
		.join("");

export class ExtendedElement extends HTMLElement implements ICustomElement {
	static get observedAttributes(): string[] {
		return [];
	}

	static tagName = "";

	logger: {
		log(...args: any[]): void;
		info(...args: any[]): void;
		warn(...args: any[]): void;
		error(...args: any[]): void;
		prefix: (p: string) => string[];
	};

	constructor() {
		super();
		this.logger = {
			log: (...args) => {
				console.log(...this.logger.prefix("🪵"), ...args);
			},
			// eslint-disable-next-line sort-keys
			info: (...args) => {
				console.info(...this.logger.prefix("📎"), ...args);
			},
			warn: (...args) => {
				console.warn(...this.logger.prefix("🤨"), ...args);
			},
			// eslint-disable-next-line sort-keys
			error: (...args) => {
				console.error(...this.logger.prefix("💀"), ...args);
			},
			prefix: (p) => [
				`%c${p} %c<%c${this.tagName.toLowerCase()}%c/> `,
				"font-size:20px",
				"color:#808080",
				"color:#569cd6",
				"color:#808080",
			],
		};
	}

	connectedCallback?(): void;
	disconnectedCallback?(): void;

	#props: IElementProp<any>[] = [];

	attributeChangedCallback(
		name: string,
		oldValue: string,
		newValue: string,
	) {
		const prop: IElementProp<any> | null =
			this.#props.find(
				(e) => kebabize(e.attrName || e.name) === name,
			) || null;
		if (!prop?.fromAttr) return;
		const val = prop.fromAttr(newValue);
		(this as any)[prop.name] = val;
	}

	prop<T>(
		name: string,
		onChange: (v: T) => void,
		defaultValue?: T,
		fromAttr?: (v: string) => T,
		attrName?: string,
	) {
		this.#props.push({
			attrName,
			defaultValue,
			fromAttr,
			name,
			onChange,
		});
		const attrValue = this.getAttribute(kebabize(attrName || name));
		const val =
			(this as any)[name] ||
			(attrValue && fromAttr ? fromAttr(attrValue) : defaultValue);
		(this as any)[`_${name}`] = val;
		Object.defineProperty(this, name, {
			get: () => (this as any)[`_${name}`],
			set: (newValue: T) => {
				if (newValue === (this as any)[`_${name}`]) return;
				(this as any)[`_${name}`] =
					newValue === null || typeof newValue === "undefined"
						? defaultValue
						: newValue;
				try {
					onChange((this as any)[name]);
				} catch (error: any) {
					if (this.isConnected)
						this.logger.warn(
							`${name}: onChange failed`,
							error.message,
						);
				}
			},
		});
	}

	#listeners: Map<
		keyof HTMLElementEventMap,
		Array<(event: Event) => void>
	> = new Map();

	event<
		K extends keyof HTMLElementEventMap,
		V extends HTMLElementEventMap[K],
	>(type: K, listener: (event: V) => void) {
		if (this.#listeners.has(type))
			this.#listeners.get(type)!.push(listener as any);
		else this.#listeners.set(type, [listener as any]);
		super.addEventListener(type, listener as any);
	}

	__$clearListeners() {
		this.#listeners.forEach((v, k) => {
			const values = v.splice(0, v.length);
			values.forEach((v) => {
				super.removeEventListener(k, v);
			});
		});
	}
}
