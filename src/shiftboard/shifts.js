const {
    shiftboard_proxy_get_request
} = require('./common');
const scheduleCache = require('../cache/schedule');


async function get_user_shifts_request(session, key, count = 1000, page = 1, start = '2000-01-01', end = '3000-01-01') {
    let url = `https://m.shiftboard.com/api/v1/shifts?end_date=${end}&page_number=${page}&page_size=${count}&start_date=${start}`;
    return await shiftboard_proxy_get_request(session, key, url);
}

// afaik, there's no pagination yet???, so todo: pagination?
async function shifts(session, key) {
    let req = await get_user_shifts_request(session, key, 1000, 1);
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
        }, raw]);
        // more options available, but reducing to just those important here
    }
    return interm;
}

async function simplifyAndCacheShifts(raw) {
    let pairs = simplifyShifts(raw);
    // perform some additional worker-side optimizations to reduce KV hits
    // section off cached schedule by year-month
    let simplified = [];
    for (let [clean, raw] of pairs) {
        simplified.push(clean);
        await scheduleCache.saveShift(clean, raw);
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
        console.log(p_day, p_start, p_end);
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
    return await scheduleCache.getShifts(date);
}

module.exports = {
    shifts,
    simplifyShifts,
    trades,
    simplifyTrades,
    simplifyAndCacheShifts,
    cachedScheduleOn,
}