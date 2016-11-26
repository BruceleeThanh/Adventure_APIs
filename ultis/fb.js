var path = require('path');
var config = require(path.join(__dirname, '../', 'config.json'));

var FB = require('fb');
var fb = new FB.Facebook(config.fb);

exports.checkToken = function(token, callback) {
    fb.api('me', { fields: ['id', 'name', 'email', 'picture.width(300).height(300)', 'first_name', 'last_name'], access_token: token }, function(response) {
        if(response.error){
        	if (typeof callback === 'function') return callback(JSON.stringify(response.error), null);
        }else{
        	var fbUser = {
        		fb_id: response.id,
        		email: response.email,
        		first_name: response.first_name,
        		last_name: response.last_name,
        		display_name: response.name,
        		avatar: response.picture.data.url
        	};
        	if (typeof callback === 'function') return callback(null, fbUser);
        }
    });
};

exports.checkFriend = function(token, after, callback) {
    fb.api('me/friends', { pretty: 0, limit: 25, after: after, access_token: token }, function(response) {
        if(response.error){
                if (typeof callback === 'function') return callback(JSON.stringify(response.error), null);
        }else{
                var result = {
                    data: response.data,
                    after: response.paging && response.paging.cursors && response.paging.cursors.after ? response.paging.cursors.after : null
                };
                if (typeof callback === 'function') return callback(null, result);
        }
    });
};