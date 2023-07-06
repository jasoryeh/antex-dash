/**
 * Number is between (inclusive) of two values
 *   or is num in [low, max]
 * @param {Number} num 
 * @param {Number} low 
 * @param {Number} max 
 * @returns {Boolean}
 */
function betweenInclusive(num, low, max) {
    return num >= low && num <= max;
}

/**
 * 
 * @param {*} req 
 * @param {*} ok300 
 * @param {*} ok400 
 * @param {*} ok500 
 * @returns 
 */
function goodStatus(req, ok300 = false, ok400 = false, ok500 = false) {
    if (betweenInclusive(req.status, 200, 299)) {
        return true;
    }
    if (ok300 & betweenInclusive(req.status, 300, 399)) {
        return true;
    }
    if (ok400 & betweenInclusive(req.status, 400, 499)) {
        return true;
    }
    if (ok500 & betweenInclusive(req.status, 500, 599)) {
        return true;
    }
    return false;
}

function getCookies(req) {
    var sessionCookies = req.headers.get('set-cookie').split(',')
                            .map(each => {
                                var cookieNoData = each.trim().split(';', 1)[0];
                                var [k, ...vs] = cookieNoData.split('=');
                                return [k, vs.join('=')];
                            });
    var cookies = {};
    for (let [k, v] of sessionCookies) {
        cookies[k] = v;
    }
    return cookies;
}

function toCookie(cookies) {
    var cookieStrings = [];
    for (let k in cookies) {
        cookieStrings.push(`${k}=${cookies[k]}`);
    }
    return cookieStrings.join(';');
}

module.exports = {
    betweenInclusive,
    goodStatus,
    getCookies,
    toCookie
}