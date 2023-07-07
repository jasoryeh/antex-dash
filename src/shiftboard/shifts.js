const {
    shiftboard_proxy_get_request
} = require('./common');
const scheduleCache = require('../cache/schedule');

/**
 * @param {Date} date 
 * @returns Shiftboard API compatible date string
 */
function dateToShiftboard(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// date formats are yyyy-mm-dd
async function get_user_shifts_request(session, key, start, end, count = 1000, page = 1) {
    var s_start = dateToShiftboard(start);
    var s_end = dateToShiftboard(end);
    let url = `https://m.shiftboard.com/api/v1/shifts?end_date=${s_end}&page_number=${page}&page_size=${count}&start_date=${s_start}`;
    return await shiftboard_proxy_get_request(session, key, url);
}

const LookAhead = 7;
const LookBehind = 7;
// afaik, there's no pagination yet???, so todo: pagination?
/**
 * @param {String} session 
 * @param {String} key 
 * @param {Date} reqStart 
 * @param {Date} reqEnd 
 * @returns 
 */
async function shifts(session, key, reqStart = null, reqEnd = null) {
    var start = reqStart;
    var end = reqEnd;
    if (!reqStart || !reqEnd) {
        var start = new Date(Date.now());
        var end = new Date(start);
        end.setDate(end.getDate() + LookAhead);
        start.setDate(start.getDate() - LookBehind);
    }
    let req = await get_user_shifts_request(session, key, start, end, 1000, 1);
    if (!req.ok) {
        return null;
    }
    return req;
}


/**
 * returns a array of [simplified/clean, raw] pairs
 * accepts an array of shiftboard-formatted shifts
 */
function simplifyShifts(raw) {
    var interm = [];
    for (let sh of raw) {
        interm.push([{
            shiftboard_id: sh.id,
            covered: sh.covered,
            user: sh.covering_member,
            details: sh.details,
            assigned_on: sh.created,
            updated_at: sh.updated,
            in_trade: sh.is_a_trade,
            yours: sh.kind == 'mine',
            start: sh.start_date,
            end: sh.end_date,
            tz: sh.timezone,
            bus: sh.room_floor,
            route: sh.name || sh.workgroup_name,
            route_id: sh.workgroup
        }, sh]);
        // more options available, but reducing to just those important here
    }
    return interm;
}

/**
 * @param {Array} cachedShifts The cached shifts for a certain bus number
 * @param {Array} shift 
 * @returns 
 */
function cache_insertIntoCache(cachedShifts, shift) {
    // some variables for readability
    let [clean, raw] = shift;
    var {start, end, route, bus} = clean;
    start = new Date(start);
    end = new Date(end);

    // insert into the collection but:
    // 1. we wrap the shift data in a object (in case future versions update data, and we need to keep track of it)
    //      { modified: if we are making assumptions (changed date based on new data we see, and the changes are not from shiftboard)
    //        clean_ver: version our data in case we change in the future and need to recalculate,
    //        raw_ver: version shiftboard's data in case they change something,
    //        clean: (our version), raw: (shiftboard version) }
    // but check for overlaps (indicating the shift or a portion of the shift was traded)
    let cachedObject = {
        modified: false,
        clean_ver: scheduleCache.DASH_DATA_VERSION,
        raw_ver: scheduleCache.SHIFTBOARD_DATA_VERSION,
        clean: clean,
        raw: raw,
    };
    for (let idx in cachedShifts) {
        let siq = cachedShifts[idx]; // shift in question
        var siq_start = new Date(siq.clean.start);
        var siq_end = new Date(siq.clean.end);

        if (siq.clean.shiftboard_id == clean.shiftboard_id) {
            // check start and end dates for change
            console.log(`This shift is already cached!: ${clean.shiftboard_id}! We'll update the data.`);
            if (siq_start != start || siq_end != end || siq.clean.route != route || siq.clean.bus != bus) {
                // no important updates
                return false;
            }
            siq.clean = clean;
            siq.raw = raw;
            siq.clean_ver = scheduleCache.DASH_DATA_VERSION;
            siq.raw_ver = scheduleCache.SHIFTBOARD_DATA_VERSION;
            return true;
        }
        if (start == siq_start && end == siq_end) {
            console.log(`A shift was traded away: ${JSON.stringify(siq)}`);
            delete cachedShifts[idx];
        } else if (start == siq_start && end < siq_end) {
            console.log(`A shift was split (and the first part was detected): ${JSON.stringify(siq)}`);
            siq.clean.start == end; // adjust the starting timing
            siq.modified = true;
        } else if (start > siq_start && end == siq_end) {
            console.log(`A shift was split (and the last part was detected): ${JSON.stringify(siq)}`);
            siq.clean.end = start;
            siq.modified = true;
        } else if (start > siq_start && end < siq_end) {
            console.log(`A shift was split (and the middle part was detected): ${JSON.stringify(siq)}`);
            // duplicate the shift
            var copy = JSON.parse(JSON.stringify(siq)); // this will become the first 1/3 of the "three-way" split
            copy.clean.end = start;
            clean.modified = true;
            // the 2/3 is the shift we are trying to push
            // the 3/3 is the end of the "three-way: split
            siq.clean.start = end;
            siq.modified = true;
            // push 1/3 and 2/3
            cachedShifts.push(copy);
        } else {
            // is not between (but coud border the shift, which is unimportant)
            continue;
        }
    }
    cachedShifts.push(cachedObject);
    return true;
}

async function simplifyAndCacheShifts(raw) {
    let pairs = simplifyShifts(raw);
    // perform some additional worker-side optimizations to reduce KV hits
    let sorted = {}; 
    let simplified = [];
    for (let [clean, raw] of pairs) {
        simplified.push(clean); // push to shifts array to return to user

        // optimize cache hits
        var {start, end, route, bus} = clean;
        start = new Date(clean.start);
        end = new Date(clean.end);

        let key = scheduleCache.dateToCacheKey(start);
        sorted[key] = sorted[key] ?? {}; // populate year-month if missing
        let subKey = String(start.getDate()); // the day number
        sorted[key][subKey] = sorted[key][subKey] ?? {}; // populate day if missing
        sorted[key][subKey][route] = sorted[key][subKey][route] ?? {};
        sorted[key][subKey][route][bus] = sorted[key][subKey][route][bus] ?? [];

        sorted[key][subKey][route][bus].push([clean, raw]);
    }

    for (let key in sorted) {
        let existing = await scheduleCache.getShifts(key);
        var changed = false;

        for (var day in sorted[key]) {
            day = String(day);
            existing[day] = existing[day] ?? {}; // ensure day exists in cache
            for (let route in sorted[key][day]) {
                existing[day][route] = existing[day][route] ?? {}; // ensure route exists in that day's cache
                for (let bus in sorted[key][day][route]) {
                    existing[day][route][bus] = existing[day][route][bus] ?? []; // ensure bus exists in the route on that day

                    // magic
                    for (let shift of sorted[key][day][route][bus]) {
                        var changed = cache_insertIntoCache(existing[day][route][bus], shift) || changed; // modify the copy of the cache object locally
                    }
                }
            }
        }

        if (changed) {
            // perform a write if new shifts are detected
            await scheduleCache.setShifts(key, existing);
        }
    }

    return simplified;
}

async function trades(session, key, count = 1000, page = 1) {
    let url = `https://m.shiftboard.com/api/v1/trades?page_number=${page}&page_size=${count}`;
    let req = await shiftboard_proxy_get_request(session, key, url);
    if (!req.ok) {
        return null;
    }
    return req;
}

function trades_parseTime(timestr, onDay) {
    let [h, m_ap] = timestr.split(':');
    h = parseInt(h);
    let m = m_ap.substr(0, 2);
    m = parseInt(m);
    let ap = m_ap.substr(2, 2);
    var c = new Date(onDay.getTime());
    c.setHours(
        h + (ap == 'pm' ? (h == 12 ? 0 : 12) : (h == 12 ? -12 : 0)),
        m,
        0, 0
    );
    return c;
}

function simplifyTrades(raw) {
    var interm = [];
    for (let sh of raw) {
        var p_day = new Date(sh.shiftRef.display_date);
        var [t_start, t_end] = sh.shiftRef.display_time.split(' - ', 2);
        var p_start = trades_parseTime(t_start, p_day);
        var p_end = trades_parseTime(t_end, p_day);
        interm.push({
            shiftboard_id: sh.shift,
            shiftboard_tradeid: sh.id,
            notes: sh.notes,
            from: sh.traded_by,
            to: sh.traded_to,
            from_username: sh.external_traded_by,
            from_name: sh.person,
            to_username: sh.traded_to,
            to_name: sh.traded_to_person,
            start: p_start,
            end: p_end,
            bus: null, // unknown for now
            route: sh.shiftRef.name ?? sh.workgroup_name,
            route_id: sh.shiftRef.workgroup
        });
        // more options available, but reducing to just those important here
    }
    return interm;
}


/**
 * @param {Date} date 
 * @returns 
 */
async function cachedScheduleOn(date) {
    var monthSchedule = await scheduleCache.getShifts(scheduleCache.dateToCacheKey(date));
    return monthSchedule[String(date.getDate())];
}

module.exports = {
    shifts,
    simplifyShifts,
    trades,
    simplifyTrades,
    simplifyAndCacheShifts,
    cachedScheduleOn,
}