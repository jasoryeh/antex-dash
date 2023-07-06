module.exports = {
    assertField: function(fieldName, inObject) {
        if (!inObject[fieldName]) {
            throw new Error(`Failed to assert field ${fieldName} exists!`);
        }
        return inObject;
    }
}