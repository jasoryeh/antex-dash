// schedule caching

const scheduleCache = require('./util')(ANTEXDASH, 'cache_schedules');

/**
 * @param {Date} dateObj 
 * @returns 
 */
function dateToCacheKey(dateObj) {
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth()).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
}

// a manually updated version in case any of our data change
const SHIFTBOARD_DATA_VERSION = 1;
const DASH_DATA_VERSION = 1;

var cache_format = {
    // shifts are cached by day the shift starts on
    "yyyy-mm-dd": {
        "route": {
            "bus #": [
                "...shift1",
                "...shift2",
            ]
        }
    }
};

/**
 * @param {Date} date 
 * @returns 
 */
async function getShifts(date) {
    let dayKey = dateToCacheKey(date);
    let shifts = await scheduleCache.get(dayKey);
    if (!shifts) {
        await scheduleCache.set(dayKey, {});
    }
    return await scheduleCache.get(dayKey);
}

/**
 * Cache the shift to build a master schedule.
 * @param {*} clean The shift but simplified on our end
 * @param {*} raw The raw data response from shiftboard
 */
async function saveShift(clean, raw) {
    var {start, end, route, bus} = clean;
    start = new Date(start);
    end = new Date(end);
    let currentShifts = await getShifts(start);
    if (!currentShifts[route]) {
        currentShifts[route] = {};
    }
    let routeShifts = currentShifts[route];
    if (!routeShifts[bus]) {
        routeShifts[bus] = [];
    }
    let busShifts = routeShifts[bus];
    // insert into the collection but:
    // 1. we wrap the shift data in a object (in case future versions update data, and we need to keep track of it)
    //      { clean_ver: version our data in case we change in the future and need to recalculate,
    //        raw_ver: version shiftboard's data in case they change something,
    //        clean: (our version), raw: (shiftboard version) }
    // but check for overlaps (indicating the shift or a portion of the shift was traded)
    let cachedObject = {
        start: start,
        end: end,
        clean_ver: DASH_DATA_VERSION,
        raw_ver: SHIFTBOARD_DATA_VERSION,
        clean: clean,
        raw: raw,
    };
    for (let idx in busShifts) {
        let siq = busShifts[idx];
        if (siq.clean.shiftboard_id == clean.shiftboard_id) {
            console.log(`This shift is already cached!: ${clean.shiftboard_id}!`);
            return;
        }
        if (start == siq.clean.start && end == siq.clean.end) {
            console.log(`A shift was traded away: ${JSON.stringify(siq)}`);
            delete busShifts[idx];
        } else if (start == siq.clean.start && end < siq.clean.end) {
            console.log(`A shift was split (and the first part was detected): ${JSON.stringify(siq)}`);
            siq.clean.start == end; // adjust the starting timing
        } else if (start > siq.clean.start && end == siq.clean.end) {
            console.log(`A shift was split (and the last part was detected): ${JSON.stringify(siq)}`);
            siq.clean.end = start;
        } else if (start > siq.clean.start && end < siq.clean.end) {
            console.log(`A shift was split (and the middle part was detected): ${JSON.stringify(siq)}`);
            // duplicate the shift
            var copy = JSON.parse(JSON.stringify(siq)); // this will become the first 1/3 of the "three-way" split
            copy.clean.end = start;
            // the 2/3 is the shift we are trying to push
            // the 3/3 is the end of the "three-way: split
            siq.clean.start = end;
            // push 1/3 and 2/3
            busShifts.push(copy);
        } else {
            // is not between (but coud border the shift, which is unimportant)
            continue;
        }
    }
    busShifts.push(cachedObject);

    // update into kv
    await scheduleCache.set(dateToCacheKey(start), currentShifts);
}
module.exports = {
    getShifts,
    saveShift,
}