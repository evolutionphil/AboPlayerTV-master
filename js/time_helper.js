"use strict";
function getTodayDate(format) {
    var date=new Date();
    var moment_date=moment(date);
    return moment_date.format(format);
}

function getLocalChannelTime(channel_time) {
    var date=moment(channel_time);
    return date.add(time_difference_with_server, 'minute');
}
