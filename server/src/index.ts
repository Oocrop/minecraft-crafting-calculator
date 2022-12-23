import { IncomingMessage, createServer } from "http";

import routes from "./routes";

const handler: Router = {
	getHandlerFor(url) {
		let options: { [k: string]: string };
		let handler: RouteHandler<Record<string, string>>;
		for (const i in this.routes) {
			const pathnameSplit = url.pathname.substring(1).split("/");
			const routeSplit = i.substring(1).split("/");
			if (
				pathnameSplit.length !== routeSplit.length &&
				!routeSplit.at(-1)?.endsWith("*}")
			)
				continue;
			const routeOptions: { [k: string]: string } = {};
			let equal = true;
			for (const j in routeSplit) {
				if (routeSplit[j].startsWith("{")) {
					if (routeSplit[j].endsWith("*}")) {
						routeOptions[
							routeSplit[j].substring(
								1,
								routeSplit[j].length - 2,
							)
						] = [...pathnameSplit]
							.splice(
								parseInt(j),
								pathnameSplit.length - parseInt(j),
							)
							.map(decodeURIComponent)
							.join("/");
						break;
					} else
						routeOptions[
							routeSplit[j].substring(
								1,
								routeSplit[j].length - 1,
							)
						] = decodeURIComponent(pathnameSplit[j]);
					continue;
				}
				if (pathnameSplit[j] !== routeSplit[j]) equal = false;
			}
			if (!equal) continue;
			options = routeOptions;
			handler = this.routes[i];
			break;
		}
		// @ts-ignore
		if (typeof handler === "undefined") return this.routes["404"];
		return (req, res) => handler(req, res, url, options);
	},
	handle(url, handler) {
		this.routes[url] = handler;
	},
	return404(res) {
		return this.routes[404](
			null as unknown as IncomingMessage,
			res,
			null as unknown as URL,
			null as unknown as RouteHandler<Record<string, string>>,
		);
	},
	routes: {
		404(_, res) {
			res.writeHead(404, {
				"Content-Type": "text/plain; charset=utf-8",
			});
			res.write("");
			res.end();
		},
	},
};

routes(handler);

const server = createServer((req, res) => {
	console.info(`${req.method}: ${req.url}`);
	if (req.url) {
		const url = new URL(
			req.url,
			(req.headers.protocol || "http://") +
				(req.headers.host || "localhost"),
		);
		handler.getHandlerFor(url)(
			req,
			res,
			null as unknown as URL,
			null as unknown as RouteHandler<Record<string, string>>,
		);
	} else handler.return404(res);
});

server.listen(80);
