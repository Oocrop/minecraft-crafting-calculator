type HTTPResponse = import("http").ServerResponse<
	import("http").IncomingMessage
> & {
	req: import("http").IncomingMessage;
};

type RouteHandler<T extends { [k: string]: string } | undefined> = (
	req: import("http").IncomingMessage,
	res: HTTPResponse,
	url: URL,
	options: T,
) => void;

interface Router {
	routes: { [k: string]: RouteHandler<any> };
	handle<T>(url: string, handler: RouteHandler<T>): void;
	return404(res: HTTPResponse): void;
	getHandlerFor(url: URL): RouteHandler<any>;
}
