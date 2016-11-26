var validator = require('validator');

exports.shuffle = function (array) {

    if (Object.prototype.toString.call(array) !== '[object Array]') {
        return [];
    }

    var currentIndex = array.length,
        temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
};

exports.convertStringToArray = function (string) {
    var temp = string.split(",");
    var array = [];
    for (var i = 0; i < temp.length; i++) {
        var number = convertStringToNumber(temp[i]);
        array.push(number);
    }

    return array;
};

function convertStringToNumber(string) {
    var number = Number(string);
    return number;
};

exports.isEmail = function (data) {
    return validator.isEmail(data);
};

exports.isNumber = function (data) {
    return validator.isNumeric(data.toString());
};