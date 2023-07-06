const router = require('./src/worker/router');

async function handleRequest(event) {
	var response = await router.handle(event.request);
	response = new Response(response.body, response);
	response.headers.set("Access-Control-Allow-Origin", "*");
	response.headers.append("Vary", "Origin");
	return response;
}

addEventListener('fetch', (event) => {
	event.respondWith(handleRequest(event));
});
