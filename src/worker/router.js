const { Router } = require('itty-router');
const { assertField } = require('./util');
const config = require('../../config');
const Login = require('../shiftboard/login');
const Shifts = require('../shiftboard/shifts');
const Misc = require('../shiftboard/misc');

const router = Router();

router.options('*', () => {
	return new Response(null, {
		headers: {
			'Access-Control-Allow-Headers': '*',
		},
	});
})

router.get('/', () => {
	return new Response('{}');
});

router.get('/configurations/routes', async request => {
	return new Response(JSON.stringify(config.routes, null, 4), {
		headers: {
			'Content-Type': 'application/json',
		}
	});
})

router.post('/login', async request => {
	// Create a base object with some fields.
	let fields = {};

	// If the POST data is JSON then attach it to our response.
	let json = await request.json();
	assertField('username', json);
	assertField('password', json);

	let loginResponse = await Login.login(json['username'], json['password']);
	if (!loginResponse) {
		return new Response(JSON.stringify({error: true}), {
			status: 400
		});
	}
	fields.session = loginResponse.session;
	fields.access_token = loginResponse.access_token;


	// Serialise the JSON to a string.
	return new Response(
		JSON.stringify(fields, null, 4), 
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
});

router.post('/check', async request => {
	let json = await request.json();
	assertField('session', json);
	assertField('access_token', json);

	let fields = await Login.login_check(json.session, json.access_token);
	if (!fields) {
		return new Response(JSON.stringify({error: true, success: false}), {
			status: 400
		});
	}

	return new Response(
		JSON.stringify(fields, null, 4), 
		{
			headers: {
				'Content-Type': 'application/json',
			},
		})
});

router.post('/shifts', async (request) => {
	let json = await request.json();
	assertField('session', json);
	assertField('access_token', json);

	let shiftRequest = await Shifts.shifts(json.session, json.access_token);
	if (!shiftRequest) {
		return new Response(JSON.stringify({error: true}), {
			status: 400
		});
	}
	let rawShifts = await shiftRequest.json();
	let fields = await Shifts.simplifyAndCacheShifts(rawShifts.data.shifts);

	return new Response(
		JSON.stringify(fields, null, 4), 
		{
			headers: {
				'Content-Type': 'application/json',
			},
		})
});


router.post('/trades', async request => {
	let json = await request.json();
	assertField('session', json);
	assertField('access_token', json);

	let shiftRequest = await Shifts.trades(json.session, json.access_token);
	if (!shiftRequest) {
		return new Response(JSON.stringify({error: true}), {
			status: 400
		});
	}
	let rawShifts = await shiftRequest.json();
	let fields = Shifts.simplifyTrades(rawShifts.data.trades);

	return new Response(
		JSON.stringify(fields, null, 4), 
		{
			headers: {
				'Content-Type': 'application/json',
			},
		})
});


router.post('/news', async request => {
	let json = await request.json();
	assertField('session', json);
	assertField('access_token', json);

	let req = await Misc.news(json.session, json.access_token);
	if (!req) {
		return new Response(JSON.stringify({error: true}), {
			status: 400
		});
	}
	let raw = await req.json();
	let fields = raw.data.news;

	return new Response(
		JSON.stringify(fields, null, 4), 
		{
			headers: {
				'Content-Type': 'application/json',
			},
		})
});

router.post('/masterschedule', async (request) => {
	let json = await request.json();
	//assertField('session', json);
	//assertField('access_token', json);
	let req = await Shifts.cachedScheduleOn(new Date(json.date));
	if (!req) {
		/*return new Response(JSON.stringify({error: true}), {
			status: 400
		});*/
		req = {};
	}
	let fields = req;

	return new Response(
		JSON.stringify(fields, null, 4), 
		{
			headers: {
				'Content-Type': 'application/json',
			},
		});
});

router.post('/me', async (request) => {
	let json = await request.json();
	assertField('session', json);
	assertField('access_token', json);
	let req = await Misc.me(json.session, json.access_token);
	console.log(JSON.stringify(req));
	if (!req) {
		return new Response(JSON.stringify({error: true}), {
			status: 400
		});
	}
	return new Response(
		JSON.stringify(req, null, 4), 
		{
			headers: {
				'Content-Type': 'application/json',
			},
		});
});

/*
 * 404 page
*/
router.all('*', () => new Response(JSON.stringify({error: true, reason: "Endpoint not found!"}), { status: 404 }));

module.exports = router;