var path = require('path');
var validator = require('validator');

module.exports = function (reqData, fields, callback) {
    var data = {};
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.required && !reqData[field.name]) {
            return callback('The field ' + field.name + ' is required', null);
        }
        if (reqData[field.name] && field.type) {
            if (!validType(reqData[field.name], field.type)) {
                return callback('The field ' + field.name + ' is invalid with type: ' + field.type, null);
            }
        }
        if (reqData[field.name] && field.type === 'string' && field.bound && Object.prototype.toString.call(field.bound) === '[object Array]' && field.bound.length === 2 && field.bound[0] <= field.bound[1]) {
            if (reqData[field.name].length < field.bound[0] || reqData[field.name].length > field.bound[1]) {
                return callback('The field ' + field.name + ' is not in range: ' + field.bound[0] + ' to ' + field.bound[1], null);
            }
        }
        if (reqData[field.name] && field.in && Object.prototype.toString.call(field.in) === '[object Array]' && field.in.length > 0) {
            if (field.type === 'numbers_array') {
                var testValues = JSON.parse(reqData[field.name]);
                var isSuperSet = testValues.every(function (val) {
                    return field.in.indexOf(val) > -1;
                });
                if (!isSuperSet) {
                    return callback('The field ' + field.name + ' must be either: ' + field.in.join(', '), null);
                }
            } else {
                var testValue = reqData[field.name];
                if (field.type === 'number') testValue = parseInt(reqData[field.name]);
                if (field.in.indexOf(testValue) === -1) {
                    return callback('The field ' + field.name + ' must be either: ' + field.in.join(', '), null);
                }
            }
        }
        if (reqData[field.name] && field.type === 'number' && typeof field.min === 'number') {
            var testValue = testValue = parseInt(reqData[field.name]);
            if (testValue < field.min) {
                return callback('The field ' + field.name + ' must be greater than or equal: ' + field.min, null);
            }
        }
        if (reqData[field.name] && field.type === 'number' && typeof field.max === 'number') {
            var testValue = testValue = parseInt(reqData[field.name]);
            if (testValue > field.max) {
                return callback('The field ' + field.name + ' must be smaller than or equal: ' + field.max, null);
            }
        }
        if (reqData[field.name] !== undefined) data[field.name] = convertData(reqData[field.name], field.type);
    }
    ;
    return callback(null, data);
};

function validType(data, type) {
    if (type === 'email') {
        return validator.isEmail(data);
    } else if (type === 'url') {
        return validator.isURL(data);
    } else if (type === 'date') {
        return validator.isDate(data);
    } else if (type === 'number') {
        return validator.isNumeric(data.toString());
    } else if (type === 'boolean') {
        return validator.isBoolean(data.toString());
    } else if (type === 'hex_string') {
        return validator.isMongoId(data);
    } else if (type === 'multi_language_object') {
        var parsedObject = {};
        try {
            parsedObject = JSON.parse(data);
        } catch (e) {
            if (e) {
                return false;
            }
        }
        if (typeof parsedObject !== 'object') {
            return false;
        }
        if (Object.keys(parsedObject).length === 0) {
            return false;
        }
        for (var field in parsedObject) {
            if (typeof parsedObject[field] !== 'string') {
                return false;
            }
        }
        return true;
    } else if (type === 'multi_language_object_array') {
        var parsedObject = [];
        try {
            parsedObject = JSON.parse(data);
        } catch (e) {
            if (e) {
                return false;
            }
        }
        if (Object.prototype.toString.call(parsedObject) !== '[object Array]') {
            return false;
        }
        if (parsedObject.length === 0) {
            return false;
        }
        for (var i = 0; i < parsedObject.length; i++) {
            if (typeof parsedObject[i] !== 'object') {
                return false;
            }
            if (Object.keys(parsedObject[i]).length === 0) {
                return false;
            }
            for (var field in parsedObject[i]) {
                if (typeof parsedObject[i][field] !== 'string') {
                    return false;
                }
            }
        }
        return true;
    } else if (type == 'image_description_object_array') {
        var parsedObject = [];
        try {
            parsedObject = JSON.parse(data);
        } catch (e) {
            if (e) {
                return false;
            }
        }
        if (Object.prototype.toString.call(parsedObject) !== '[object Array]') {
            return false;
        }
        if (parsedObject.length === 0) {
            return false;
        }
        for (var i = 0; i < parsedObject.length; i++) {
            // console.log( parsedObject[i].description);
            if (typeof parsedObject[i] !== 'object') {
                return false;
            }
            if (Object.keys(parsedObject[i]).length === 0) {
                return false;
            }
            for (var field in parsedObject[i]) {
                if (typeof parsedObject[i][field] !== 'string') {
                    return false;
                }
            }
        }
        return true;
    } else if (type === 'strings_array') {
        if (typeof data !== 'string') {
            return false;
        }
        var strings = [];
        try {
            strings = JSON.parse(data)
        } catch (e) {
            return false;
        }
        if (Object.prototype.toString.call(strings) !== '[object Array]') {
            return false;
        }
        if (strings.length === 0) {
            return false;
        }
        for (var i = 0; i < strings.length; i++) {
            var string = strings[i];
            if (typeof string !== 'string') {
                return false;
            }
        }
        return true;
    } else if (type === 'hex_strings_array') {
        if (typeof data !== 'string') {
            return false;
        }
        var hex_strings = [];
        try {
            hex_strings = JSON.parse(data)
        } catch (e) {
            return false;
        }
        if (Object.prototype.toString.call(hex_strings) !== '[object Array]') {
            return false;
        }
        for (var i = 0; i < hex_strings.length; i++) {
            var hex_string = hex_strings[i];
            if (typeof hex_string !== 'string') {
                return false;
            }
            if (!validator.isMongoId(hex_string.trim())) {
                return false;
            }
        }
        return true;
    } else if (type === 'numbers_array') {
        if (typeof data !== 'string') {
            return false;
        }
        var numbers = [];
        try {
            numbers = JSON.parse(data);
        } catch (e) {
            return false
        }
        if (Object.prototype.toString.call(numbers) !== '[object Array]') {
            return false;
        }
        if (numbers.length === 0) {
            return false;
        }
        for (var i = 0; i < numbers.length; i++) {
            if (typeof numbers[i] !== 'number') {
                return false;
            }
        }
        return true;
    } else {
        return typeof data === type;
    }
}

function convertData(data, type) {
    if (type === 'number') {
        return parseInt(data);
    } else if (type === 'boolean') {
        if (data === 'false' || data === false) {
            return false;
        } else if (data === 'true' || data === true) {
            return true;
        }
    } else if (type === 'multi_language_object' || type === 'multi_language_object_array' || type === 'numbers_array' || type === 'strings_array' || type === 'hex_strings_array') {
        return JSON.parse(data);
    } else if (type === 'date') {
        return new Date(data);
    } else {
        return data;
    }
}
