"use strict";
var mac_address,
    user_name,
    password,
    server_info,
    user_info,
    api_host_url,
    panel_url = "https://asatv.app/CNdvBMKcnS",
    time_difference_with_server = 0; // time difference between user time and server time, measured by mins

// Check if content is blocked based on backend blocklist
function isContentBlocked(name, type) {
    try {
        var blockedList = [];
        
        if(type === 'channel' || type === 'live') {
            var stored = localStorage.getItem('blocked_channels');
            if(stored) blockedList = JSON.parse(stored);
        } else if(type === 'movie' || type === 'vod') {
            var stored = localStorage.getItem('blocked_movies');
            if(stored) blockedList = JSON.parse(stored);
        } else if(type === 'series') {
            var stored = localStorage.getItem('blocked_series');
            if(stored) blockedList = JSON.parse(stored);
        }
        
        if(!blockedList || blockedList.length === 0) {
            return false;
        }
        
        var lowerName = name.toLowerCase();
        
        for(var i = 0; i < blockedList.length; i++) {
            var keyword = blockedList[i].toLowerCase();
            if(lowerName.includes(keyword)) {
                console.log('🚫 BLOCKED CONTENT:', name, '(matched keyword:', keyword + ')');
                return true;
            }
        }
        
        return false;
    } catch(e) {
        console.error('Error checking blocked content:', e);
        return false;
    }
}

var adverts = [],
    expire_date;
var current_route = "login";
var default_movie_icon = "images/default_icon.jpeg";
var current_movie_categories = [];

var current_movie_type,
    current_category = {},
    current_movie,
    current_season,
    current_episode,
    current_series;

var parent_account_password = "0000";

var mac_valid = true;

var playlist_urls = [],
    themes = [],
    expire_date,
    is_trial;
var languages = [],
    current_words = [];
var platform = "samsung",
    app_loading = false;
var storage_id = "kiSsTUE1Jx_";
var lock = 0;
var video_file_exts = ["webm", "mpg", "mp2", "mpeg", "mpe", "mpv", "ogg", "mp4", "m4p", "m4v", "avi", "wmv", "mov", "qt", "flv", "swf", "avchd", "mkv"];
var image_file_exts = ["apng", "avif", "gif", "jpg", "jpeg", "jfif", "pjpeg", "pjp", "png", "svg", "webp", "bmp", "ico", "cur", "tif", "tiff"];
var storage_environment = 'production'; // 'develop' or 'production' - use 'production' for real TV devices
var samsung_version = "1.0.0",
    lg_version = "1.0.2";
var focus_colors = [],
    background_colors = [],
    epg_text_colors = [],
    playlist_succeed = true;
var environment = "develop";
environment = "production";
var keyboard_displayed = false;

function showLoader(flag) {
    if (typeof flag == "undefined") flag = true;
    if (flag) $("#loader").css({ display: "flex" });
    else $("#loader").hide();
}

function saveData(key, data) {
    window[key] = data;
}

function calculateTimeDifference(server_time, time_stamp) {
    var date_obj = new Date(server_time);
    time_difference_with_server = parseInt(
        (time_stamp * 1000 - date_obj.getTime()) / (60 * 1000),
    );
}

function getItemFromId(id, key, items) {
    var movie = null;
    for (var i = 0; i < items.length; i++) {
        if (items[i][key] == id) {
            movie = items[i];
            break;
        }
    }
    return movie;
}

function getDomElementFromData(dom_elements, data_key, value) {
    // get dom element from data_key and value
    var result_element;
    for (var i = 0; i < dom_elements.length; i++) {
        if ($(dom_elements[i]).data(data_key) == value) {
            result_element = dom_elements[i];
            break;
        }
    }
    return result_element;
}

function getMovieUrl(stream_id, stream_type, extension) {
    return (
        api_host_url +
        "/" +
        stream_type +
        "/" +
        user_name +
        "/" +
        password +
        "/" +
        stream_id +
        "." +
        extension
    );
}

function getCurrentMovieFromId(value, movies, key) {
    var current_movie = null;
    for (var i = 0; i < movies.length; i++) {
        if (movies[i][key] == value) {
            current_movie = movies[i];
            break;
        }
    }
    return current_movie;
}
function getCurrentMovieFromId(value, movies, key) {
    var current_movie = null;
    for (var i = 0; i < movies.length; i++) {
        if (movies[i][key] == value) {
            current_movie = movies[i];
            break;
        }
    }
    return current_movie;
}

function moveScrollPosition(parent_element, element, direction, to_top) {
    // move the scroll bar according to element position
    // Guard: Check if elements exist
    if (!element || !$(element).length || !parent_element || !$(parent_element).length) {
        console.warn('moveScrollPosition: invalid element or parent_element');
        return 0;
    }
    
    if (direction === "vertical") {
        var padding_top_str = $(parent_element).css("padding-top");
        var padding_bottom_str = $(parent_element).css("padding-bottom");
        var parent_height_str = $(parent_element).css("height");
        var element_height_str = $(element).css("height");
        
        // Guard: Check if CSS values exist before calling replace
        if (!padding_top_str || !padding_bottom_str || !parent_height_str || !element_height_str) {
            console.warn('moveScrollPosition: missing CSS values');
            return 0;
        }
        
        var padding_top = parseInt(padding_top_str.replace("px", ""));
        var padding_bottom = parseInt(padding_bottom_str.replace("px", ""));
        var parent_height = parseInt(parent_height_str.replace("px", ""));
        var child_position = $(element).position();
        var element_height = parseInt(element_height_str.replace("px", ""));
        if (!to_top) {
            if (
                child_position.top + element_height >=
                parent_height - padding_bottom
            ) {
                $(parent_element).animate(
                    {
                        scrollTop:
                            "+=" +
                            (child_position.top +
                                element_height -
                                parent_height +
                                padding_bottom),
                    },
                    10,
                );
            }
            if (child_position.top - padding_top < 0) {
                $(parent_element).animate(
                    { scrollTop: "+=" + (child_position.top - padding_top) },
                    2,
                );
            }
        } else {
            // if element should on top position
            $(parent_element).animate({ scrollTop: child_position.top }, 2);
        }
        return 0;
    } else {
        var padding_left = parseInt(
            $(parent_element).css("padding-top").replace("px", ""),
        );
        var child_position = $(element).position();
        var parent_width = parseInt(
            $(parent_element).css("width").replace("px", ""),
        );
        var element_width = parseInt($(element).css("width").replace("px", ""));
        var scroll_amount = 0;
        if (child_position.left + element_width >= parent_width)
            scroll_amount = child_position.left + element_width - parent_width;
        if (child_position.left - padding_left < 0)
            scroll_amount = child_position.left - padding_left;
        $(parent_element).animate({ scrollLeft: "+=" + scroll_amount }, 2);
        return scroll_amount;
    }
}

function showToast(title, text) {
    $("#toast-body").html("<h3>" + title + "<br>" + text + "</h3>");
    $(".toast").css({ "z-index": 9999 });
    $(".toast").toast({ animation: true, delay: 2000 });
    $("#toast").toast("show");
    setTimeout(function () {
        $(".toast").css({ "z-index": -100 });
    }, 4000);
}

function getMinute(time_string) {
    // get the minute of time string
    var date = new Date(time_string);
    return parseInt(date.getTime() / 60 / 1000);
}

function convertVwToPixel(amount) {
    var window_width = $(window).width();
    return (amount * window_width) / 100;
}

function goHomePageWithMovieType(movie_type) {
    // when clicking red button in special pages, it will show movie or series or live section by movie type
    try {
        var menu_item = $("#menu-wrapper").find(
            "*[data-type=" + movie_type + "]",
        )[0];
        $(menu_item).trigger("click");
        if (movie_type === "live-tv") {
            // show home page preview video;
            $("#home-page-movie-logo").hide();
            $("#home-page-movie-logo")
                .closest(".player-container")
                .css({ background: "#111" });
            $("#search-button-wrapper").hide(); // hide back button
            $("#home-page-video-preview").show();
            home_page.reEnter();
        } else {
            home_page.submenuClick(0);
            home_page.hoverToSubMenu(0);
            // try{
            //     media_player.init("home-page-video-preview",'home-page');
            //     media_player.setDisplayArea();
            // }catch (e) {
            // }
            // if(home_page.preview_url){
            //     try{
            //         media_player.playAsync(home_page.preview_url);
            //     }catch (e) {
            //     }
            // }
        }
        current_route = "home-page";
        // $("#home-page-right-part-content-2").hide('');
        // $('#home-page-slider-container').css({opacity:0});
        // $('#home-page-slider-container').slick('unslick');
        // setTimeout(function(){
        //     $('#home-page-slider-container').css({opacity:1});
        //     $('#home-page-slider-container').slick({
        //         autoplay: true,
        //         arrows:false,
        //         dots:true,
        //         variableWidth:false,
        //         autoplaySpeed:5000
        //     });
        // },1500)
        // $("#home-page-right-part-content-1").css({height:'100vh'});
        // $('#home-page').css({height:'100vh'});
    } catch (e) {
        showToast("Sorry", "Some Error occured");
    }
}

function changeBackgroundImage() {
    var fallback_bg = 'images/background1.png';
    var bg_img_index = settings.bg_img_index;
    
    // Function to apply fallback if image fails to load
    function applyFallbackIfNeeded(imageUrl) {
        var testImage = new Image();
        testImage.onerror = function() {
            // Image failed to load, use fallback
            console.log('Background image failed to load, using fallback: ' + fallback_bg);
            $('#login-container').css({'background-image':'url(' + fallback_bg + ')'});
            $('#app').css({'background-image':'url(' + fallback_bg + ')'});
        };
        testImage.src = imageUrl;
    }
    
    if (typeof themes[bg_img_index] != "undefined") {
        var bg_img = themes[bg_img_index].url;
        $("#login-container").css({
            "background-image": "url(" + bg_img + ")",
        });
        $("#app").css({ "background-image": "url(" + bg_img + ")" });
        applyFallbackIfNeeded(bg_img);
    } else {
        // if background image not setted, or not exist
        if (typeof themes[0] != "undefined") {
            var bg_img = themes[0].url;
            $("#login-container").css({
                "background-image": "url(" + bg_img + ")",
            });
            $("#app").css({ "background-image": "url(" + bg_img + ")" });
            applyFallbackIfNeeded(bg_img);
        } else {
            // Fallback to local background1.png when themes are not available
            console.log('No themes available, using fallback: ' + fallback_bg);
            $("#login-container").css({
                "background-image": "url(" + fallback_bg + ")",
            });
            $("#app").css({ "background-image": "url(" + fallback_bg + ")" });
        }
    }
}

function parseM3uUrl() {
    // here, we will check if it is xtreme url or general m3u url
    var playlist_url = settings.playlist_url;
    if (
        playlist_url.includes("username=") &&
        playlist_url.includes("password=")
    )
        settings.playlist_type = "xtreme";
    else settings.playlist_type = "type1";
    if (settings.playlist_type === "xtreme") {
        var temp_array1 = settings.playlist_url.split("?");
        var temp_array2 = temp_array1[1].split("&");
        temp_array2.map(function (item) {
            var temps = item.split("=");
            var key = temps[0],
                value = temps[1];
            if (key.toLowerCase() === "username") user_name = value;
            if (key.toLowerCase() === "password") password = value;
        });
        api_host_url = temp_array1[0].replace("/get.php", "");
    } else api_host_url = settings.playlist_url;
}

function parseM3uResponse(type, text_response) {
    var num = 0;
    if (type === "type1") {
        var start_time = new Date().getTime() / 1000;
        var live_categories = [];
        var lives = [];
        var vods = [];
        var vod_categories = [];
        var series_categories = [];
        var series = [];
        text_response = text_response.replace(/['"]+/g, "");
        var temp_arr2 = text_response.split(
            /#EXTINF:-{0,1}[0-9]{1,} {0,},{0,}/gm,
        );
        temp_arr2.splice(0, 1); // remove the first row
        var temp_arr1 = [];
        if (text_response.includes("tvg-")) {
            // if general m3u type 1
            var live_category_map = {},
                vod_category_map = {},
                series_category_map = {};
            for (var i = 0; i < temp_arr2.length; i++) {
                try {
                    temp_arr1 = temp_arr2[i].split("\n");
                    num++;
                    var url = temp_arr1[1].length > 1 ? temp_arr1[1] : "";
                    if (!url.includes("http:") && !url.includes("https:")) {
                        continue;
                    }
                    var type = "live";
                    if (
                        url.includes("/movie/") ||
                        url.includes("vod") ||
                        url.includes("=movie") ||
                        url.includes("==movie==")
                    )
                        type = "vod";
                    if (url.includes("/series/")) type = "series";

                    var temp_arr3 = temp_arr1[0].trim().split(",");
                    var name = temp_arr3.length > 1 ? temp_arr3[1] : ""; // get the name of channel

                    var temp_arr4 = splitStrings(temp_arr3[0], [
                        "tvg-",
                        "channel-",
                        "group-",
                    ]);
                    var result_item = {
                        stream_id: "",
                        name: name,
                        stream_icon: "",
                        title: "",
                    };
                    var category_name = "Uncategorized";
                    temp_arr4.map(function (sub_item) {
                        var sub_item_arr = sub_item.split("=");
                        var key = sub_item_arr[0];
                        var value = sub_item_arr[1];
                        switch (key) {
                            case "id":
                                result_item.stream_id = value;
                                break;
                            case "name":
                                result_item.name =
                                    value.trim() != "" ? value : name;
                                break;
                            case "logo":
                                result_item.stream_icon = value;
                                break;
                            case "title":
                                category_name = value.split(",")[0];
                                if (category_name == "")
                                    category_name = "Uncategorized";
                                break;
                        }
                    });
                    if (result_item.stream_id.trim() === "")
                        result_item.stream_id = result_item.name;
                    result_item.url = url;
                    result_item.num = num;

                    if (type === "live") {
                        if (
                            typeof live_category_map[category_name] ==
                            "undefined"
                        ) {
                            live_category_map[category_name] = category_name;
                            var category_item = {
                                category_id: category_name,
                                category_name: category_name,
                            };
                            live_categories.push(category_item);
                        }

                        result_item.category_id = category_name;
                        lives.push(result_item);
                    }

                    if (type === "vod") {
                        if (
                            typeof vod_category_map[category_name] ==
                            "undefined"
                        ) {
                            vod_category_map[category_name] = category_name;
                            var category_item = {
                                category_id: category_name,
                                category_name: category_name,
                            };
                            vod_categories.push(category_item);
                        }
                        result_item.category_id = category_name;
                        vods.push(result_item);
                    }

                    if (type === "series") {
                        if (
                            typeof series_category_map[category_name] ==
                            "undefined"
                        ) {
                            series_category_map[category_name] = category_name;
                            var category_item = {
                                category_id: category_name,
                                category_name: category_name,
                            };
                            series_categories.push(category_item);
                        }
                        result_item.category_id = category_name;
                        series.push(result_item);
                    }
                } catch (e) {
                    // console.log("parsing m3u error "+i, e);
                }
            }
        } else {
            live_categories = [
                {
                    category_id: "all",
                    category_name: "All",
                },
            ];
            vod_categories = [
                {
                    category_id: "all",
                    category_name: "All",
                },
            ];
            series_categories = [
                {
                    category_id: "all",
                    category_name: "All",
                },
            ];
            for (var i = 0; i < temp_arr2.length; i++) {
                try {
                    temp_arr1 = temp_arr2[i].split("\n");
                    var name = temp_arr1[0];
                    var url = temp_arr1[1];

                    var type = "live";
                    if (url.includes("/movie/")) type = "movie";
                    if (url.includes("/series/")) type = "series";
                    var result_item = {};
                    name = name.trim();
                    result_item.stream_id = name;
                    result_item.name = name;
                    result_item.stream_icon = "";
                    result_item.num = i + 1;
                    result_item.category_id = "all";
                    result_item.url = url;
                    if (type === "live") lives.push(result_item);
                    if (type === "series") series.push(result_item);
                    if (type === "movie") vods.push(result_item);
                } catch (e) {
                    // console.log(temp_arr1[0]);
                    // console.log(e);
                }
            }
        }
        LiveModel.setCategories(live_categories);
        LiveModel.setMovies(lives);
        LiveModel.insertMoviesToCategories();

        VodModel.setCategories(vod_categories);
        VodModel.setMovies(vods);
        VodModel.insertMoviesToCategories();

        SeriesModel.setCategories(series_categories);
        var parsed_series = parseSeries(series);
        SeriesModel.setMovies(parsed_series);
        SeriesModel.insertMoviesToCategories();
    }
}

function parseSeries(data) {
    var series = [];
    var series_map = {};
    var season_map = {},
        episodes = {};
    data.map(function (item) {
        try {
            var temp_arr1 = item.name.split(/ S[0-9]{2}/);
            var season_name = item.name.match(/S[0-9]{2}/)[0];
            season_name = season_name.trim().replace("S", "");
            season_name = "Season " + season_name;
            var series_name = temp_arr1[0].trim();
            var episode_name = temp_arr1[1].trim().replace("E", "");
            if (typeof series_map[series_name] == "undefined") {
                (season_map = {}), (episodes = {}); // Initialize for every other series
                episodes[season_name] = [
                    {
                        name: episode_name,
                        url: item.url,
                        id: episode_name,
                        info: {},
                        title: "Episode " + episode_name,
                    },
                ];
                season_map[season_name] = {
                    name: season_name,
                    cover: "images/series.png",
                };
                series_map[series_name] = {
                    series_id: series_name,
                    name: series_name,
                    cover: item.stream_icon,
                    youtube_trailer: "",
                    category_id: item.category_id,
                    rating: "",
                    rating_5based: "",
                    genre: "",
                    director: "",
                    cast: "",
                    plot: "",
                    season_map: season_map,
                    episodes: episodes,
                };
            } else {
                if (typeof season_map[season_name] == "undefined") {
                    episodes[season_name] = [
                        {
                            name: episode_name,
                            url: item.url,
                            id: episode_name,
                            info: {},
                            title: "Episode " + episode_name,
                        },
                    ];
                    season_map[season_name] = {
                        name: season_name,
                        cover: "images/series.png",
                    };
                    series_map[series_name].season_map = season_map;
                } else {
                    episodes[season_name].push({
                        name: season_name,
                        url: item.url,
                        id: season_name,
                        info: {},
                        title: "Episode " + episode_name,
                    });
                }
                series_map[series_name].episodes = episodes;
            }
        } catch (e) {
            // console.log(item);
            // console.log(e);
        }
    });
    var series_num = 0;
    Object.keys(series_map).map(function (key) {
        series_num++;
        var item = series_map[key];
        var seasons = [];
        try {
            Object.keys(item.season_map).map(function (key1) {
                seasons.push(item.season_map[key1]);
            });
        } catch (e) {
            // console.log(e);
        }
        delete item["season_map"];
        item.num = series_num;
        item.seasons = seasons;
        series.push(item);
    });
    return series;
}

settings.initFromLocal();

function splitStrings(string, keys) {
    var result_array = [];
    for (var i = 0; i < keys.length; i++) {
        var temp_arr = string.split(keys[i]);
        if (i == keys.length - 1) {
            for (var j = 0; j < temp_arr.length; j++) {
                if (temp_arr[j].trim() != "") result_array.push(temp_arr[j]);
            }
            return result_array;
        } else {
            for (var j = 0; j < temp_arr.length; j++) {
                if (temp_arr[j].trim() != "") {
                    var temp_arr2 = splitStrings(
                        temp_arr[j],
                        keys.slice(i + 1),
                    );
                    temp_arr2.map(function (item) {
                        if (item.trim() !== "") result_array.push(item);
                    });
                }
            }
            return result_array;
        }
    }
}

function getAtob(text) {
    var result = text;
    try {
        return decodeURIComponent(
            atob(text)
                .split("")
                .map(function (c) {
                    return (
                        "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                    );
                })
                .join(""),
        );
    } catch (e) {}
    return result;
}

function getSortedMovies(movies1, key) {
    var movies = JSON.parse(JSON.stringify(movies1));
    var new_movies = [];
    var new_key = key;
    if (key === "a-z" || key === "z-a") new_key = "name";
    if (key === "number") new_key = "num";
    if (movies.length == 0) return [];
    if (typeof movies[0][new_key] == "undefined") {
        return movies;
    }
    var direction = 1;
    switch (key) {
        case "rating":
        case "number":
        case "added":
            direction = 1;
            if (key === "number") direction = -1;
            new_movies = movies.sort(function (a, b) {
                var a_new_key = parseFloat(a[new_key]);
                if (isNaN(a_new_key)) a_new_key = 0;
                var b_new_key = parseFloat(b[new_key]);
                if (isNaN(b_new_key)) b_new_key = 0;
                return (
                    direction *
                    (a_new_key < b_new_key ? 1 : a_new_key > b_new_key ? -1 : 0)
                );
            });
            break;
        case "a-z":
        case "z-a":
            direction = key === "a-z" ? 1 : -1;
            new_movies = movies.sort(function (a, b) {
                return direction * a[new_key].localeCompare(b[new_key]);
            });
            break;
        case "default":
            return movies;
    }
    return new_movies;
}

function focusOnInputElement(targetElement) {
    var origin_value = $(targetElement).val();
    $(targetElement).focus();
    setTimeout(function () {
        $(targetElement)[0].setSelectionRange(
            origin_value.length,
            origin_value.length,
        );
    }, 300);
}

function closeApp() {
    if (platform === "samsung")
        tizen.application.getCurrentApplication().exit();
    else if (platform === "lg") window.close();
}

function checkForAdult(item, item_type, categories) {
    var is_adult = false;
    var category;
    if (item_type === "movie") {
        //
        for (var i = 0; i < categories.length; i++) {
            if (item.category_id == categories[i].category_id) {
                category = categories[i];
                break;
            }
        }
    } else category = item;
    try {
        var category_name = category.category_name.toLowerCase();
        var adult_keywords = ["xxx", "sex", "porn", "adult", "18+", "+18"];
        for (var i = 0; i < adult_keywords.length; i++) {
            if (category_name.includes(adult_keywords[i])) {
                is_adult = true;
                break;
            }
        }
        if (category.parent_id && category.parent_id != 0) is_adult = true;
    } catch (e) {
        console.log(category);
    }
    return is_adult;
}

function setSelectionRange(targetElement) {
    setTimeout(function () {
        var tmp = $(targetElement).val();
        $(targetElement)[0].setSelectionRange(tmp.length, tmp.length);
    }, 200);
}

function hideImg(targetElement) {
    $(targetElement).hide();
    $(".vod-series-background-img-overlay").hide();
}

function getEncryptKey(length) {
    var symbols =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    for (
        var s = "";
        s.length < length;
        s += symbols.charAt((Math.random() * 62) | 0)
    );
    return s;
}
function getEncryptKeyPosition(character) {
    var symbols =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    for (var i = 0; i < symbols.length; i++) {
        if (symbols[i] == character) {
            return i;
        }
    }
}
function getEncryptPositionChar(position) {
    var symbols =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    return symbols.charAt(position);
}
function encryptRequest(data) {
    var encrypt_position = 0,
        encrypt_length_position = 1;
    var string_data = JSON.stringify(data);
    string_data = btoa(string_data);
    var encrypt_key_length = parseInt(Math.random() * 30);
    if (encrypt_key_length < 20) encrypt_key_length = 20;
    var position = Math.floor(Math.random() * string_data.length);
    if (position >= 42) position = 42;
    var encrypt_key = getEncryptKey(encrypt_key_length);
    var encrypted_data = string_data
        .slice(0, position)
        .concat(encrypt_key)
        .concat(string_data.slice(position));
    var encrypt_position_char = getEncryptPositionChar(position);
    var encrypt_length_position_char =
        getEncryptPositionChar(encrypt_key_length);
    encrypted_data =
        encrypted_data.slice(0, encrypt_position) +
        encrypt_position_char +
        encrypted_data.slice(encrypt_position);
    encrypted_data =
        encrypted_data.slice(0, encrypt_length_position) +
        encrypt_length_position_char +
        encrypted_data.slice(encrypt_length_position);
    console.log(
        "encrypt_position_char=" + encrypt_position_char,
        "encrypt_length_position_char=" + encrypt_length_position_char,
    );
    return encrypted_data;
}
function decryptResponse(data1) {
    var app_type = "samsung";
    var encrypt_position = 0,
        encrypt_length_position = 1;
    var raw_response = data1.data;
    var enc_pos, enc_len, enc_pos_char, enc_len_char;
    if (app_type !== "android") {
        raw_response = reverseString(raw_response);
        enc_pos_char = raw_response[encrypt_position];
        enc_len_char = raw_response[encrypt_length_position];
        console.log(
            "enc_pos_char=" + enc_pos_char,
            "enc_len_char=" + enc_len_char,
        );
        enc_pos = getEncryptKeyPosition(enc_pos_char);
        enc_len = getEncryptKeyPosition(enc_len_char);
        raw_response =
            raw_response.slice(0, encrypt_length_position) +
            raw_response.slice(encrypt_length_position + 1);
        raw_response =
            raw_response.slice(0, encrypt_position) +
            raw_response.slice(encrypt_position + 1);
    }
    if (app_type === "android") {
        enc_pos = getEncryptKeyPosition(raw_response[raw_response.length - 1]);
        enc_len = getEncryptKeyPosition(raw_response[raw_response.length - 2]);
        raw_response = raw_response.slice(0, raw_response.length - 2);
    }
    var encode_str = raw_response
        .slice(0, enc_pos)
        .concat(raw_response.slice(enc_pos + enc_len));
    encode_str = getAtob(encode_str);
    var data = JSON.parse(encode_str);
    return data;
}
function reverseString(str) {
    var splitString = str.split("");
    var reverseArray = splitString.reverse();
    var joinArray = reverseArray.join("");
    return joinArray;
}

function assignColorCode(color, kind) {
    var cssText;
    if (kind === "focus") {
        cssText =
            "\
                #home-page .menu-item.active {background: " +
            color +
            " !important;}\
                #home-page .movie-slider-wrapper .movie-item-wrapper.active{\
                    background:" +
            color +
            " !important;\
                }\
                #home-page-movies-grid-container .movie-item-wrapper.active .movie-grid-item-title-wrapper{\
                    background: " +
            color +
            " !important;\
                }\
                .channel-page-category-item.active, .channel-menu-item.active{\
                    background:" +
            color +
            " !important;\
                }\
                .filtered-movie-wrapper.active{\
                    background:" +
            color +
            " !important;\
                }\
                .season-grid-item-wrapper.active, .episode-grid-item-wrapper.active{\
                    background:" +
            color +
            " !important;\
                }\
                .player-season-item.active{\
                    border-color:" +
            color +
            " !important;\
                }\
                .player-season-item.active .player-episode-title{\
                    background:" +
            color +
            " !important;\
                }\
            ";
    } else if (kind === "background") {
        cssText =
            "\
                #home-page .movie-slider-wrapper .movie-item-wrapper{\
                    background:" +
            color +
            ";\
                }\
                #home-page-movies-grid-container .movie-grid-item-title-wrapper{\
                    background:" +
            color +
            ";\
                }\
                .filtered-movie-wrapper{\
                    background:" +
            color +
            ";\
                }\
                .season-grid-item-wrapper, .episode-grid-item-wrapper{\
                    background:" +
            color +
            "\
                }\
            ";
    } else if (kind === "epg") {
        cssText =
            "\
                .next-program-item{\
                    color:" +
            color +
            ";\
                }\
            ";
    }

    $("<style/>", { text: cssText }).appendTo("head");
}

// Storage helper functions for file browser
function checkCorruptedRemovableDrives(storages1) {
    var storages = [];
    for (var i = 0; i < storages1.length; i++) {
        if (storages1[i].state != 'UNMOUNTABLE' && !storages1[i].label.includes('wgt-')) {
            storages.push(storages1[i]);
        }
    }
    storage_page.storages = storages;
    storage_page.initPage();
}

function onResolveSuccess(dir) {
    dir.listFiles(onsuccess);
}

function onsuccess(files) {
    var video_files = [], video_index = 0, image_index = 0, image_files = [];
    var diff_index = storage_page.current_level == 0 ? 0 : 1;
    var final_files = [], skip_file_count = 0;
    
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (file.isFile) {
            var ext = getExt(file.name);
            if (video_file_exts.includes(ext.toLowerCase())) {
                video_files.push({
                    index: i - skip_file_count + diff_index,
                    file: file,
                    video_index: video_index
                });
                video_index++;
                final_files.push(file);
            } else if (image_file_exts.includes(ext.toLowerCase())) {
                image_files.push({
                    index: i - skip_file_count + diff_index,
                    file: file,
                    image_index: image_index
                });
                image_index++;
                final_files.push(file);
            } else {
                skip_file_count++;
            }
        } else {
            final_files.push(file);
        }
    }
    
    storage_page.video_files = video_files;
    storage_page.image_files = image_files;
    storage_page.storages = final_files;
    storage_page.renderDirectories();
}
