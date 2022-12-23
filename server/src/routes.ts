import { extname, join } from "path";

import { createReadStream } from "fs";
import { getType } from "./mimeTypes";
import { request as httpRequest } from "http";
import { request as httpsRequest } from "https";
import { stat } from "fs/promises";

export default function (router: Router) {
	router.handle<{ url: string }>("/proxy/{url}", (req, res, _, { url }) => {
		const parsedUrl = new URL(url);
		const fn =
			parsedUrl.protocol === "https:" ? httpsRequest : httpRequest;
		fn(url, (reqRes) => reqRes.pipe(res)).end();
	});
	router.handle("/{file*}", async (req, res, url) => {
		const path = join("./dist/", url!.pathname);
		const pathInfo = await stat(path).catch(() => null);
		if (!pathInfo?.isFile()) {
			if (pathInfo?.isDirectory()) {
				if ((await stat(join(path, "index.html"))).isFile()) {
					res.writeHead(200, {
						"Content-Type": "text/html; charset=utf-8",
					});
					return createReadStream(join(path, "index.html")).pipe(
						res,
					);
				}
				return router.return404(res);
			}
			return router.return404(res);
		}
		res.writeHead(200, {
			"Content-Type": getType(extname(path).replace(".", "")),
		});
		return createReadStream(path).pipe(res);
	});
}
