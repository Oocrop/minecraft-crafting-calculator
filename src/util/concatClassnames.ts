export type ClassnamesType = string | string[] | { [s: string]: boolean };
export function concatClassnames(...classes: ClassnamesType[]): string {
	const result = [];
	// eslint-disable-next-line guard-for-in
	for (const i in classes)
		switch (typeof classes[i]) {
			case "string":
				result.push(classes[i]);
				break;
			case "object":
				if (Array.isArray(classes[i]))
					result.push(
						concatClassnames(...(classes[i] as string[])),
					);
				else
					for (const k in classes[i] as { [s: string]: boolean })
						if ((classes[i] as { [s: string]: boolean })[k])
							result.push(k);

				break;
			default:
				break;
		}

	return result.join(" ");
}
