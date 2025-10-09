"use strict";
var vod_series_player = {
    player: null,
    back_url: "home-page",
    show_control: false,
    timeOut: null,
    current_key_index: 0,
    keys: {
        focused_part: "control_bar", //operation_modal
        control_bar: 0,
        operation_modal: 0,
        subtitle_audio_selection_modal: 0,
        audio_selection_modal: 0,
        episode_selection: 0,
        prev_focus: "",
        resume_bar: 0,
        info_bar: 0,
    },
    current_episode_index: -1,
    hover_episode_index: -1,
    current_subtitle_index: -1,
    current_audio_track_index: -1,
    subtitle_audio_menus: [],
    forwardTimer: null,
    current_time: 0,
    show_audio_track: false,
    video_control_doms: $(
        "#vod-series-video-controls-container .video-control-icon i",
    ),
    video_info_doms: $("#vod-series-video-controls-container .video-info-icon"),
    vod_info_timer: null,
    current_movie: {},
    resume_time: 0,
    resume_timer: null,
    episode_doms: [],
    resume_bar_doms: $("#video-resume-modal .resume-action-btn"),
    seek_timer: null,
    seek_interval_timer: null,
    has_episodes: false,
    range_slider: $("#vod-series-progress-container .rangeslider"),
    subtitle_doms: [],
    last_key_time: 0,
    subtitle_loading: false,
    subtitle_loaded: false,
    fw_timer: null,
    current_movie_type: "",
    init: function (movie, movie_type, back_url) {
        this.current_movie_type = movie_type;
        this.fw_timer = null;
        this.subtitle_loaded = false;
        this.last_key_time = 0;
        this.video_duration = 0;
        var that = this;
        this.resume_bar_doms = $("#video-resume-modal .resume-action-btn");
        var keys = this.keys;
        this.current_movie = movie;
        this.current_time = 0;
        $("#vod-series-player-page").show();
        this.show_control = true;
        this.showControlBar(true);
        $("#vod-series-progress-container .rangeslider").removeClass("active");
        $(this.video_control_doms).removeClass("active");
        $(this.video_info_doms).removeClass("active");
        $(this.video_control_doms[2]).addClass("active");

        var element = $(this.video_control_doms[2]);
        $(element).removeClass("fa-play");
        $(element).addClass("fa-pause");
        $(element).data("action_type", "pause");

        keys.control_bar = 2;
        keys.focused_part = "control_bar";
        keys.prev_focus = "control_bar";

        var slider_element = $("#vod-series-player-page").find(
            ".video-progress-bar-slider",
        )[0];
        $("#vod-series-player-page").find(".video-current-time").text("00:00");
        $("#vod-series-player-page").find(".video-total-time").text("00:00");
        $(slider_element).attr({
            min: 0,
            max: 100,
        });
        $(slider_element).rangeslider({
            polyfill: false,
            rangeClass: "rangeslider",
            onSlideEnd: function (position, value) {
                that.sliderPositionChanged(value);
            },
        });
        $(slider_element).val(0).change();
        $(slider_element).attr("disabled", true);
        $(slider_element).rangeslider("update");
        var url;
        if (movie_type === "movies") {
            if (settings.playlist_type === "xtreme")
                url = getMovieUrl(
                    movie.stream_id,
                    "movie",
                    movie.container_extension,
                );
            else if (settings.playlist_type === "type1") url = movie.url;
            $("#vod-series-video-title").html(movie.name);
        } else {
            if (settings.playlist_type === "xtreme")
                url = getMovieUrl(
                    movie.id,
                    "series",
                    movie.container_extension,
                );
            else if (settings.playlist_type === "type1") url = movie.url;
            $("#vod-series-video-title").html(movie.title);
        }
        this.back_url = back_url;

        var current_model, movie_key;
        if (movie_type === "movies") {
            current_model = VodModel;
            movie_key = "stream_id";
        } else {
            current_model = SeriesModel;
            movie_key = "id";
        }
        try {
            movie_key = movie[movie_key].toString();
            if (current_model.saved_video_times[movie_key])
                this.resume_time = current_model.saved_video_times[movie_key];
            else this.resume_time = 0;
        } catch (e) {
            console.log(e);
        }
        try {
            media_player.close();
        } catch (e) {}
        try {
            media_player.init(
                "vod-series-player-video",
                "vod-series-player-page",
            );
            media_player.setDisplayArea();
        } catch (e) {
            console.log(e);
        }
        try {
            media_player.playAsync(url);
        } catch (e) {
            console.log(e);
        }
        this.timeOut = setTimeout(function () {
            that.hideControlBar();
        }, 10000);
        current_route = "vod-series-player-video";
        this.current_subtitle_index = -1;
        this.current_audio_track_index = -1;
    },
    makeEpisodeDoms: function (back_url) {
        this.keys.episode_selection = 0;
        if (back_url === "episode-page") {
            var episodes = current_season.episodes;
            this.episodes = episodes;
            this.has_episodes = true;
            var html = "";
            episodes.map(function (item, index) {
                var image = "images/series.png";
                if (typeof item.info != "undefined") {
                    image = item.info.movie_image;
                }
                html +=
                    '<div class="player-season-item" ' +
                    '   onclick="vod_series_player.showSelectedEpisode()"' +
                    '   onmouseenter="vod_series_player.hoverEpisodeItem(' +
                    index +
                    ')"' +
                    ">" +
                    '   <img class="player-episode-img" src="' +
                    image +
                    '" onerror="this.src=\'images/series.png\'">' +
                    '   <div class="player-episode-title">' +
                    item.title +
                    "</div>\n" +
                    "</div>";
            });
            $("#player-seasons-container").html(html);
            this.keys.episode_selection = 0;
            this.episode_doms = $(".player-season-item");
            $("#player-seasons-container").removeClass("expanded");
            $("#player-seasons-container").show();
        } else {
            this.has_episodes = false;
            $("#player-seasons-container").html("");
            this.episode_doms = $(".player-season-item");
            this.episode_doms = [];
            $("#player-seasons-container").hide();
        }
    },
    showResumeBar: function () {
        var keys = this.keys;
        if (this.resume_time > 0) {
            var milliseconds = platform === "samsung" ? 1000 : 1;
            var resume_time_format = media_player.formatTime(
                this.resume_time / milliseconds,
            );
            $("#vod-resume-time").text(resume_time_format);
            $("#video-resume-modal").show();
            this.hideControlBar();
            clearTimeout(this.resume_timer);
            if (keys.focused_part != "subtitle_audio_selection_modal")
                // if already showing subtitle modal, should not change focused part
                keys.focused_part = "resume_bar";
            else keys.prev_focus = "resume_bar"; //
            keys.resume_bar = 0;
            $(this.resume_bar_doms).removeClass("active");
            $(this.resume_bar_doms[0]).addClass("active");
            this.resume_timer = setTimeout(function () {
                $("#video-resume-modal").hide();
                if (keys.focused_part == "resume_bar") {
                    // only when focus on resume bar, change into prev focus when hiding resume modal
                    if (keys.prev_focus != "resume_bar")
                        keys.focused_part = keys.prev_focus;
                    else keys.focused_part = "info_bar";
                } else if (
                    keys.focused_part === "subtitle_audio_selection_modal"
                )
                    keys.prev_focus = "info_bar";
            }, 15000);
        }
    },
    Exit: function () {
        this.saveVideoTime();
        current_route = this.back_url;
        try {
            media_player.close();
        } catch (e) {
            console.log(e);
        }
        $("#" + media_player.parent_id)
            .find(".video-error")
            .hide();
        $("#" + media_player.parent_id)
            .find(".subtitle-container")
            .text("");
        $("#vod-series-player-page").hide();
    },
    saveVideoTime: function () {
        try {
            var current_time, duration, dt;
            if (platform === "samsung") {
                current_time = webapis.avplay.getCurrentTime();
                duration = webapis.avplay.getDuration();
                dt = 5000;
            } else if (platform === "lg") {
                current_time = media_player.videoObj.currentTime;
                duration = media_player.videoObj.duration;
                dt = 5;
            }
            var movie = this.current_movie;
            if (environment === "develop") {
                // to test saving video time
                duration = 10000;
                current_time = 4000;
            }
            if (environment === "develop") {
                // to test removing video time
                duration = 100;
                current_time = 100;
            }
            if (duration - current_time >= dt) {
                if (this.current_movie_type === "movies")
                    VodModel.saveVideoTime(movie, current_time);
                if (this.current_movie_type === "series")
                    SeriesModel.saveVideoTime(movie.id, current_time);
            } else {
                if (this.current_movie_type === "movies") {
                    VodModel.removeVideoTime(movie.stream_id);
                    if (
                        this.back_url === "home-page" &&
                        home_page.keys.focused_part === "grid_selection" &&
                        current_category.category_id === "resume"
                    ) {
                        // remove current selected movie from rendered list
                        var keys = home_page.keys;
                        var domElement = $(
                            "#movie-grids-container .movie-item-container",
                        )[keys.grid_selection];
                        $(domElement).remove();
                        home_page.movies.splice(keys.grid_selection, 1);
                        var grid_doms = $(
                            "#movie-grids-container .movie-item-wrapper",
                        );
                        grid_doms.map(function (index, item) {
                            $(item).data("index", index);
                        });
                        home_page.movie_grid_doms = grid_doms;
                        if (grid_doms.length == 0) keys.grid_selection = -1;
                        else {
                            keys.grid_selection--;
                            if (keys.grid_selection < 0)
                                keys.grid_selection = 0;
                        }
                    }
                }
                if (this.current_movie_type === "series")
                    SeriesModel.removeVideoTime(movie.id);
            }
        } catch (e) {
            console.log(e);
        }
    },
    goBack: function () {
        $(".modal").modal("hide");
        var keys = this.keys;
        if (this.show_control) {
            this.hideControlBar();
        } else {
            if (
                keys.focused_part === "control_bar" ||
                keys.focused_part === "info_bar" ||
                keys.focused_part === "slider" ||
                keys.focused_part === "episode_selection"
            ) {
                this.Exit();
                if (this.back_url === "home-page") {
                    home_page.reEnter();
                    if (
                        home_page.keys.focused_part === "grid_selection" &&
                        current_category.category_id === "resume"
                    ) {
                        if (home_page.keys.grid_selection < 0)
                            home_page.hoverToSubMenu(
                                home_page.keys.submenu_selection,
                            );
                        else {
                            console.log("here", home_page.keys.grid_selection);
                            home_page.hoverMovieGridItem(
                                home_page.movie_grid_doms[
                                    home_page.keys.grid_selection
                                ],
                            );
                        }
                    }
                }
                if (this.back_url === "episode-page") {
                    $("#episode-page").show();
                    var season_buttons = $(".episode-grid-item-wrapper");
                    moveScrollPosition(
                        $("#episode-grid-container"),
                        season_buttons[episode_variable.keys.index],
                        "vertical",
                        false,
                    );
                }
                if (this.back_url === "search-page") {
                    $("#search-page").show();
                    search_page.hoverMovie(search_page.keys.hor_keys[1], 1);
                }
            }
        }
        switch (keys.focused_part) {
            case "operation_modal":
                $("#vod-series-player-operation-modal").modal("hide");
                keys.focused_part = "control_bar";
                break;
            case "subtitle_audio_selection_modal":
                this.subtitle_loading = false;
                $("#subtitle-loader-container").hide();
                $("#subtitle-selection-modal").modal("hide");
                keys.focused_part = keys.prev_focus;
                break;
            case "vod_info":
                $("#vod-video-info-container").hide();
                clearTimeout(this.vod_info_timer);
                keys.focused_part = keys.prev_focus;
                break;
            case "resume_bar":
                $("#video-resume-modal").hide();
                if (keys.prev_focus != "resume_bar")
                    keys.focused_part = keys.prev_focus; // this means, in subtitle modal, the prev focus is settled to resume bar, so in this case,
                else
                    // have to go back to info_bar
                    keys.focused_part = "info_bar";
                clearTimeout(this.resume_timer);
                break;
        }
    },
    playPauseVideo: function (action_type) {
        this.showControlBar(false);
        var icons = this.video_control_doms;
        var element = $(icons[2]);
        if (action_type === "") {
            action_type = $(element).data("action_type");
        }
        if (action_type === "pause") {
            try {
                media_player.pause();
                $(element).removeClass("fa-pause");
                $(element).addClass("fa-play");
                $(element).data("action_type", "play");
            } catch (e) {}
        } else if (action_type === "play") {
            try {
                media_player.play();
                $(element).removeClass("fa-play");
                $(element).addClass("fa-pause");
                $(element).data("action_type", "pause");
            } catch (e) {}
        }
    },
    seekTo: function (step) {
        var duration, newTime;
        if (platform === "samsung") {
            var new_key_time = new Date().getTime() / 1000;
            if (new_key_time - this.last_key_time < 0.1) {
                return;
            }
            this.last_key_time = new_key_time;
            if (this.current_time === 0)
                this.current_time = media_player.current_time / 1000;
            if (this.video_duration != 0) duration = this.video_duration;
            else {
                try {
                    duration = webapis.avplay.getDuration() / 1000;
                    this.video_duration = duration;
                } catch (e) {}
            }
            if (duration == 0) return;
            newTime = this.current_time + step;
            if (newTime < 0) {
                return;
            }
            if (newTime >= duration) {
                return;
            }
            this.current_time = newTime;
            clearTimeout(this.seek_timer);
            if (media_player.state === media_player.STATES.PLAYING) {
                try {
                    media_player.pause();
                } catch (e) {}
            }
            $("#" + media_player.parent_id)
                .find(".video-loader")
                .show();
            this.seek_timer = setTimeout(function () {
                console.log(newTime);
                webapis.avplay.seekTo(newTime * 1000);
                setTimeout(function () {
                    try {
                        media_player.play();
                    } catch (e) {}
                }, 200);
            }, 500);
        } else if (platform === "lg") {
            if (this.current_time === 0)
                this.current_time = media_player.videoObj.currentTime;
            duration = media_player.videoObj.duration;
            newTime = this.current_time + step;
            if (duration == 0) return;
            if (newTime < 0) newTime = 0;
            if (newTime >= duration) newTime = duration;
            this.current_time = newTime;
            media_player.videoObj.currentTime = newTime;
        }
        if (duration > 0) {
            if (SrtOperation.srt && SrtOperation.srt.length > 0) {
                // here will hide subtitles first
                $("#" + media_player.parent_id)
                    .find(".subtitle-container")
                    .html("");
                SrtOperation.stopOperation();
                if (this.fw_timer) {
                    clearTimeout(this.fw_timer);
                    this.fw_timer = null;
                }
                this.fw_timer = setTimeout(function () {
                    SrtOperation.stopped = false;
                    SrtOperation.findIndex(
                        media_player.videoObj.currentTime,
                        0,
                        SrtOperation.srt.length - 1,
                    );
                }, 200);
            }
            $("#" + media_player.parent_id)
                .find(".video-progress-bar-slider")
                .val(newTime)
                .change();
            $("#" + media_player.parent_id)
                .find(".video-current-time")
                .html(media_player.formatTime(newTime));
        }
    },
    sliderPositionChanged: function (newTime) {
        var keys = this.keys;
        keys.focused_part = "slider";
        keys.prev_focus = "slider";
        $("#vod-series-progress-container .rangeslider").addClass("active");
        $(this.episode_doms).removeClass("active");
        $(this.video_control_doms).removeClass("active");
        $(this.video_info_doms).removeClass("active");
        media_player.videoObj.currentTime = newTime;
        this.current_time = newTime;
        if (SrtOperation.srt && SrtOperation.srt.length > 0)
            SrtOperation.findIndex(newTime, 0, SrtOperation.srt.length - 1);
        $("#" + media_player.parent_id)
            .find(".video-progress-bar-slider")
            .val(newTime)
            .change();
        $("#" + media_player.parent_id)
            .find(".video-current-time")
            .html(media_player.formatTime(newTime));
    },
    showSelectedEpisode: function () {
        var episode_keys = episode_variable.keys;
        var keys = this.keys;
        var episode_items = $(".episode-grid-item-wrapper");
        $(episode_items).removeClass("active");
        episode_keys.index += keys.episode_selection;
        $(episode_items[episode_keys.index]).addClass("active");
        var episodes = this.episodes;
        var episode = episodes[keys.episode_selection];
        if (
            current_episode.episode_num != episode.episode_num ||
            current_episode.id != episode.id ||
            current_episode.title != episode.title ||
            current_episode.url != episode.url
        ) {
            this.saveVideoTime();
            this.resume_time = 0;
            try {
                media_player.close();
            } catch (e) {}
            current_episode = episode;
            vod_series_player.init(current_episode, "series", "episode-page");
        }
    },
    showNextVideo: function (increment) {
        this.saveVideoTime();
        this.resume_time = 0;
        switch (this.back_url) {
            case "home-page":
                var movie_grids = $(
                    "#movie-grids-container .movie-item-wrapper",
                );
                $("#movie-grids-container .movie-item-wrapper").removeClass(
                    "active",
                );
                $(movie_grids[0]).addClass("active");
                var keys = home_page.keys;
                if (keys.focused_part === "grid_selection") {
                    keys.grid_selection += increment;
                    if (keys.grid_selection < 0) keys.grid_selection = 0;
                    if (keys.grid_selection >= movie_grids.length)
                        keys.grid_selection = movie_grids.length - 1;
                    $(movie_grids).removeClass("active");
                    $(movie_grids[keys.grid_selection]).addClass("active");
                    current_movie = home_page.movies[keys.grid_selection];
                    this.init(current_movie, "movies", "home-page");
                }
                if (keys.focused_part === "slider_selection") {
                    var movie_containers = $(".movie-slider-wrapper");
                    var movie_items = $(
                        movie_containers[keys.slider_selection],
                    ).find(".movie-item-wrapper");
                    $(".movie-item-wrapper").removeClass("active");
                    keys.slider_item_index += increment;
                    if (keys.slider_item_index < 0)
                        // this means, now cursor is the first position and so, it needs to move to left panel
                        keys.slider_item_index = movie_items.length - 1;
                    if (keys.slider_item_index >= movie_items.length)
                        keys.slider_item_index = 0;
                    $(movie_items[keys.slider_item_index]).addClass("active");

                    var current_movie_item = $(
                        movie_items[keys.slider_item_index],
                    );
                    var stream_id = $(current_movie_item).data("stream_id");
                    home_page.current_preview_id = stream_id;
                    home_page.current_preview_type = "movies";
                    current_movie = getCurrentMovieFromId(
                        stream_id,
                        VodModel.getLatestMovies(),
                        "stream_id",
                    );
                    this.init(current_movie, "movies", "home-page");
                }
                break;
            case "episode-page":
                var keys = episode_variable.keys;
                var episode_items = $(".episode-grid-item-wrapper");
                $(episode_items).removeClass("active");
                keys.index += increment;
                if (keys.index < 0) keys.index = 0;
                if (keys.index >= episode_items.length)
                    keys.index = episode_items.length;
                $(episode_items[keys.index]).addClass("active");
                var episodes = current_season.episodes;
                current_episode = episodes[keys.index];
                this.init(current_episode, "series", "episode-page");
                break;
            case "search-page":
                var keys = search_page.keys;
                var key = keys.hor_keys[1];
                key += increment;
                if (key < 0) return;
                if (key >= search_page.movie_doms[1].length) return;
                current_movie = search_page.filtered_movies[1][key];
                search_page.keys.hor_keys[1] = key;
                this.init(current_movie, "movies", "search-page");
                break;
        }
    },
    showControlBar: function (move_focus) {
        $("#vod-series-video-controls-container").slideDown();
        $("#vod-series-video-title").slideDown();
        this.show_control = true;
        var that = this;
        var keys = this.keys;
        if (move_focus) {
            keys.focused_part = "control_bar";
            keys.prev_focus = "control_bar";
            keys.control_bar = 2;
            $(this.video_info_doms).removeClass("active");
            $(this.episode_doms).removeClass("active");
            $(this.video_control_doms).removeClass("active");
            $(this.video_control_doms[2]).addClass("active");
            $("#player-seasons-container").removeClass("expanded");
        }
        clearTimeout(this.timeOut);
        this.timeOut = setTimeout(function () {
            that.hideControlBar();
        }, 5000);
    },
    hideControlBar: function () {
        $("#vod-series-video-controls-container").slideUp();
        $("#vod-series-video-title").slideUp();
        this.show_control = false;
    },
    makeMediaTrackElement: function (items, kind) {
        var htmlContent = "";
        if (platform === "samsung") {
            var language_key = "track_lang";
            if (kind !== "TEXT") language_key = "language";
            items.map(function (item) {
                var extra_info = item.extra_info;
                htmlContent +=
                    '<div class="modal-operation-menu-type-2 subtitle-option">\
                        <input class="magic-radio" type="radio" name="radio" id="disable-subtitle"\
                            value="' +
                    item.index +
                    '">\
                    <label for="disable-subtitle">' +
                    extra_info[language_key] +
                    "</label>\
                </div>";
            });
        } else if (platform === "lg") {
            console.log("here", items, kind);
            var default_track_text = kind === "TEXT" ? "Subtitle " : "Track ";
            items.map(function (item, index) {
                var language = item.language;
                if (kind !== "TEXT") {
                    if (language != "") {
                        language =
                            typeof language_codes[language] != "undefined"
                                ? language_codes[language]
                                : language;
                    } else {
                        language = default_track_text + (index + 1);
                    }
                } else console.log(item, language, item.language);
                htmlContent +=
                    '<div class="modal-operation-menu-type-2 subtitle-option"\
                        onmouseenter="vod_series_player.hoverSubtitleAudioModal(' +
                    index +
                    ')" \
                        onclick="vod_series_player.handleMenuClick()" \
                    >\
                        <input class="magic-radio" type="radio" name="radio"\
                            value="' +
                    index +
                    '">\
                        <label>' +
                    language +
                    "</label>\
                    </div>";
            });
        }
        return htmlContent;
    },
    showSubtitleAudioModal: function (kind) {
        var keys = this.keys;
        console.log(keys.focused_part, "in subtitle audio modal");
        if (keys.focused_part != "subtitle_audio_selection_modal")
            keys.prev_focus = keys.focused_part;
        this.hideControlBar();
        try {
            $("#subtitle-loader-container").hide();
            var subtitles;
            if (platform !== "samsung" && kind === "TEXT") {
                // we will use our own made subtitles
                if (!this.subtitle_loaded) {
                    $("#subtitle-selection-container").html("");
                    if (
                        !(
                            this.current_movie_type === "movies" ||
                            (this.current_movie_type === "series" &&
                                settings.playlist_type === "xtreme")
                        )
                    ) {
                        this.showEmptySubtitleMessage(kind);
                        return;
                    }
                    var that = this;
                    this.subtitle_loading = true;
                    $("#subtitle-selection-modal").modal("show");
                    this.hoverSubtitleAudioModal(-2);
                    $("#subtitle-loader-container").show();
                    
                    var movieData;
                    var movieType;
                    
                    if (this.current_movie_type === "movies") {
                        movieData = {
                            name: this.current_movie.name,
                            tmdb_id: this.current_movie.tmdb_id,
                            year: this.current_movie.year
                        };
                        movieType = "movie";
                    } else {
                        var episode = current_season.episodes[episode_variable.keys.index];
                        movieData = {
                            title: episode.title || episode.episode_name,
                            name: episode.title || episode.episode_name,
                            series_name: current_series.name,
                            season: current_season.season_number ? current_season.season_number : seasons_variable.keys.index + 1,
                            episode_num: episode.episode_num ? episode.episode_num : episode_variable.keys.index + 1,
                            info: this.current_movie.info,
                            series_tmdb_id: current_series.tmdb_id
                        };
                        movieType = "episode";
                    }
                    
                    EnhancedSubtitleWorkflow.initializeSubtitles(movieData, movieType,
                        function(subtitles) {
                            that.subtitle_loading = false;
                            that.subtitle_loaded = true;
                            $("#subtitle-loader-container").hide();
                            if (subtitles && subtitles.length > 0) {
                                that.renderSubtitles(kind, subtitles);
                            } else {
                                media_player.subtitles = [];
                                that.showEmptySubtitleMessage(kind);
                            }
                        },
                        function(error) {
                            that.subtitle_loading = false;
                            that.subtitle_loaded = true;
                            $("#subtitle-loader-container").hide();
                            that.showEmptySubtitleMessage(kind);
                        }
                    );
                } else {
                    if (media_player.subtitles.length > 0) {
                        this.renderSubtitles(kind, media_player.subtitles);
                    } else this.showEmptySubtitleMessage(kind);
                }
            } else {
                subtitles = media_player.getSubtitleOrAudioTrack(kind);
                if (subtitles.length > 0) this.renderSubtitles(kind, subtitles);
                else {
                    if (kind === "TEXT")
                        showToast("Sorry", "No Subtitles exists");
                    else showToast("Sorry", "No Audios exists");
                }
            }
        } catch (e) {
            console.log(e);
            showToast("Sorry", "Video not loaded yet");
        }
    },
    renderSubtitles: function (kind, subtitles) {
        var keys = this.keys;
        if (keys.focused_part === "resume_bar") {
            // if already showing resume bar, subtitles should not be displayed
            $("#subtitle-selection-modal").modal("hide");
            return;
        }
        if (kind == "TEXT") $("#subtitle-modal-title").text("Subtitle");
        else $("#subtitle-modal-title").text("Audio Track");
        this.keys.focused_part = "subtitle_audio_selection_modal";
        $("#subtitle-selection-modal .modal-operation-menu-type-2").removeClass(
            "active",
        );
        var htmlContent = this.makeMediaTrackElement(subtitles, kind);
        $("#subtitle-selection-container").html(htmlContent);
        $("#subtitle-selection-modal").modal("show");
        var subtitle_menus = $("#subtitle-selection-modal .subtitle-option");
        this.subtitle_audio_menus = subtitle_menus;
        $(subtitle_menus[0]).addClass("active");
        $(subtitle_menus[0]).find("input").prop("checked", true);
        this.keys.subtitle_audio_selection_modal = 0;
        var current_selected_index =
            kind === "TEXT"
                ? this.current_subtitle_index
                : this.current_audio_track_index;
        var that = this;
        subtitles.map(function (item, index) {
            if (index == current_selected_index) {
                that.keys.subtitle_audio_selection_modal = index;
                $(subtitle_menus).removeClass("active");
                $(subtitle_menus).find("input").prop("checked", false);
                $(subtitle_menus[index]).addClass("active");
                $(subtitle_menus[index]).find("input").prop("checked", true);
            }
        });
        var subtitle_audio_modal_buttons = $(
            "#subtitle-selection-modal .modal-btn-2",
        );
        $(subtitle_audio_modal_buttons).removeClass("active");
    },
    showEmptySubtitleMessage: function (kind) {
        $("#subtitle-selection-modal").modal("hide");
        if (kind === "TEXT") showToast("Sorry", "No Subtitles exists");
        else showToast("Sorry", "No Audios exists");
        var keys = this.keys;
        if (keys.focused_part != "resume_bar")
            keys.focused_part = keys.prev_focus;
    },
    changeScreenRatio: function () {
        try {
            media_player.toggleScreenRatio();
        } catch (e) {}
    },
    showStreamSummaryFromVideo: function () {
        var stream_summary;
        try {
            stream_summary =
                media_player.videoObj.videoWidth +
                "*" +
                media_player.videoObj.videoHeight;
        } catch (e) {
            console.log(e);
        }
        $("#vod-video-info-subwrapper2").text(stream_summary);
    },
    showVideoInfo: function () {
        var movie = this.current_movie;
        this.hideControlBar();
        var vod_desc = "",
            stream_summary = "No Info",
            stream_icon,
            stream_title;
        if (this.current_movie_type === "movies") {
            stream_title = movie.name;
            stream_icon = movie.stream_icon;
        } else {
            // if series
            stream_title = movie.title;
            stream_icon = "images/series.png";
        }
        var that = this;
        if (settings.playlist_type === "xtreme") {
            if (this.current_movie_type === "movies") {
                $.getJSON(
                    api_host_url +
                        "/player_api.php?username=" +
                        user_name +
                        "&password=" +
                        password +
                        "&action=get_vod_info&vod_id=" +
                        current_movie.stream_id,
                    function (response) {
                        var info = response.info;
                        if (typeof info.description != "undefined")
                            vod_desc = info.description;
                        if (typeof info.video != "undefined") {
                            if (
                                typeof info.video.width != "undefined" &&
                                typeof info.video.height
                            ) {
                                stream_summary =
                                    info.video.width + "*" + info.video.height;
                            }
                            if (
                                typeof info.video.codec_long_name != "undefined"
                            )
                                stream_summary =
                                    stream_summary +
                                    ", " +
                                    info.video.codec_long_name;
                            $("#vod-video-info-subwrapper2").text(
                                stream_summary,
                            );
                            if (stream_summary === "No Info") {
                                that.showStreamSummaryFromVideo();
                            }
                        } else {
                            that.showStreamSummaryFromVideo();
                        }
                        $("#vod-video-info-desc").text(vod_desc);
                    },
                ).fail(function () {
                    that.showStreamSummaryFromVideo();
                });
            } else {
                if (typeof movie.info != "undefined") {
                    var info = movie.info;
                    if (typeof info.plot != "undefined") vod_desc = info.plot;
                    stream_icon = info.movie_image;
                    if (typeof info.video != "undefined") {
                        stream_summary =
                            info.video.width + "*" + info.video.height;
                        if (typeof info.video.codec_long_name != "undefined")
                            stream_summary =
                                stream_summary +
                                ", " +
                                info.video.codec_long_name;
                    } else {
                        that.showStreamSummaryFromVideo();
                    }
                } else {
                    that.showStreamSummaryFromVideo();
                }
                $("#vod-video-info-desc").text(vod_desc);
            }
        } else {
            if (platform === "samsung") {
                try {
                    var stream_info = webapis.avplay.getCurrentStreamInfo();
                    if (typeof stream_info[0] != "undefined") {
                        var extra_info = JSON.parse(stream_info[0].extra_info);
                        stream_summary =
                            extra_info.Width + "*" + extra_info.Height;
                    }
                    $("#vod-video-info-desc").text(vod_desc);
                    $("#vod-video-info-subwrapper2").text(stream_summary);
                } catch (e) {}
            } else if (platform === "lg") {
                $("#vod-video-info-desc").text("");
                $("#vod-video-info-subwrapper2").text("");
                that.showStreamSummaryFromVideo();
            }
        }
        $("#vod-video-info-title").text(stream_title);
        $("#vod-video-info-img-container img").attr("src", stream_icon);
        $("#vod-video-info-container").show();
        clearTimeout(this.vod_info_timer);
        var keys = this.keys;
        keys.focused_part = "vod_info";
        this.vod_info_timer = setTimeout(function () {
            $("#vod-video-info-container").hide();
            keys.focused_part = keys.prev_focus;
        }, 10000);
    },
    cancelSubtitle: function () {
        this.goBack();
    },
    confirmSubtitle: function () {
        var keys = this.keys;
        var modal_title = $("#subtitle-modal-title").text();
        var that = this;
        
        if (modal_title.toLowerCase().includes("subtitle")) {
            this.current_subtitle_index = $("#subtitle-selection-modal")
                .find("input[type=radio]:checked")
                .val();
            
            if (platform !== "samsung" && media_player.subtitles && media_player.subtitles.length > 0) {
                $("#subtitle-loader-container").show();
                
                EnhancedSubtitleWorkflow.selectSubtitle(
                    parseInt(this.current_subtitle_index),
                    function() {
                        $("#subtitle-loader-container").show();
                    },
                    function() {
                        $("#subtitle-selection-modal").modal("hide");
                        $("#subtitle-loader-container").hide();
                        keys.focused_part = keys.prev_focus;
                        $("#" + media_player.parent_id)
                            .find(".subtitle-container")
                            .css({ visibility: "visible" });
                    },
                    function(error) {
                        $("#subtitle-selection-modal").modal("hide");
                        $("#subtitle-loader-container").hide();
                        keys.focused_part = keys.prev_focus;
                        showToast("Error", "Failed to load subtitle: " + error);
                    }
                );
            } else {
                $("#subtitle-selection-modal").modal("hide");
                keys.focused_part = keys.prev_focus;
                try {
                    media_player.setSubtitleOrAudioTrack(
                        "TEXT",
                        parseInt(this.current_subtitle_index),
                    );
                    $("#vod-series-player-page")
                        .find(".subtitle-container")
                        .css({ visibility: "visible" });
                } catch (e) {}
            }
        } else {
            $("#subtitle-selection-modal").modal("hide");
            keys.focused_part = keys.prev_focus;
            this.current_audio_track_index = $("#subtitle-selection-modal")
                .find("input[type=radio]:checked")
                .val();
            try {
                media_player.setSubtitleOrAudioTrack(
                    "AUDIO",
                    parseInt(this.current_audio_track_index),
                );
            } catch (e) {}
        }
    },
    removeAllActiveClass: function (hide_episode) {
        $(this.video_info_doms).removeClass("active");
        $(this.episode_doms).removeClass("active");
        $(this.video_control_doms).removeClass("active");
        $(this.range_slider).removeClass("active");
        if (hide_episode)
            $("#player-seasons-container").removeClass("expanded");
    },
    hoverVideoControl: function (index) {
        var keys = this.keys;
        this.removeAllActiveClass(true);
        keys.control_bar = index;
        keys.focused_part = "control_bar";
        $(this.video_control_doms[index]).addClass("active");
    },
    hoverVideoInfoBtn: function (index) {
        var keys = this.keys;
        keys.info_bar = index;
        keys.focused_part = "info_bar";
        this.removeAllActiveClass(true);
        $(this.video_info_doms[index]).addClass("active");
    },
    hoverEpisodeItem: function (index) {
        this.showControlBar(false);
        var keys = this.keys;
        keys.focused_part = "episode_selection";
        keys.episode_selection = index;
        $(this.video_info_doms).removeClass("active");
        $(this.video_control_doms).removeClass("active");
        $("#vod-series-progress-container .rangeslider").removeClass("active");
        $(this.episode_doms).removeClass("active");
        $(this.episode_doms[keys.episode_selection]).addClass("active");
        moveScrollPosition(
            $("#player-seasons-container"),
            this.episode_doms[keys.episode_selection],
            "horizontal",
            false,
        );
    },
    hoverSubtitleAudioModal: function (index) {
        var keys = this.keys;
        keys.focused_part = "subtitle_audio_selection_modal";
        if (index >= 0) {
            keys.subtitle_audio_selection_modal = index;
            moveScrollPosition(
                $("#subtitle-selection-container"),
                this.subtitle_audio_menus[index],
                "vertical",
                false,
            );
        } else
            keys.subtitle_audio_selection_modal =
                this.subtitle_audio_menus.length + index;
        $(this.subtitle_audio_menus).removeClass("active");
        $(this.subtitle_audio_menus[index]).addClass("active");
    },
    
    // Subtitle Settings Modal Functions
    SUBTITLE_LEVELS: {
        MIN: 0,
        MAX: 4,
        DEFAULT: 2,
        SIZES: [14, 18, 24, 32, 40],
        LABELS: ['Small', 'Normal', 'Large', 'Extra Large', 'Maximum']
    },
    
    showSubtitlePositionModal: function() {
        // Save original settings for cancel functionality
        this.originalSubtitlePosition = parseInt(localStorage.getItem('subtitle_position') || '10');
        this.originalSubtitleLevel = this.getSubtitleLevel();
        this.originalSubtitleSize = this.SUBTITLE_LEVELS.SIZES[this.originalSubtitleLevel];
        this.originalSubtitleBackground = localStorage.getItem('subtitle_background') || 'black';
        
        // Set current values
        this.currentSubtitlePosition = this.originalSubtitlePosition;
        this.currentSubtitleSize = this.originalSubtitleSize;
        this.currentSubtitleBackground = this.originalSubtitleBackground;
        
        // Show overlay
        $('#vod-series-player-operation-modal').modal('hide');
        $('#subtitle-position-overlay').show();
        
        // Update displays
        this.updateAllDisplays();
        
        // Focus first control
        this.keys.focused_part = "subtitle_position_overlay";
        this.positionControlIndex = 0;
        this.hoverPositionControl(0);
    },
    
    getSubtitleLevel: function() {
        var level = parseInt(localStorage.getItem('subtitle_level') || this.SUBTITLE_LEVELS.DEFAULT);
        return Math.max(this.SUBTITLE_LEVELS.MIN, Math.min(this.SUBTITLE_LEVELS.MAX, level));
    },
    
    adjustSubtitlePosition: function(direction) {
        var step = 2; // 2vh per press
        
        if(direction === 'up') {
            this.currentSubtitlePosition = Math.min(50, this.currentSubtitlePosition + step);
        } else if(direction === 'down') {
            this.currentSubtitlePosition = Math.max(0, this.currentSubtitlePosition - step);
        }
        
        // Auto-save immediately
        localStorage.setItem('subtitle_position', this.currentSubtitlePosition);
        
        // Apply live
        this.applyLiveSubtitleStyles();
        this.updateAllDisplays();
    },
    
    setSubtitlePosition: function(position) {
        this.currentSubtitlePosition = parseInt(position);
        localStorage.setItem('subtitle_position', this.currentSubtitlePosition);
        this.applyLiveSubtitleStyles();
        this.updateAllDisplays();
    },
    
    adjustSubtitleSize: function(direction) {
        var currentLevel = this.getSubtitleLevel();
        
        if(direction === 'larger') {
            this.setSubtitleLevel(currentLevel + 1);
        } else if(direction === 'smaller') {
            this.setSubtitleLevel(currentLevel - 1);
        }
    },
    
    setSubtitleSize: function(size) {
        // Convert absolute size to level
        var level = this.SUBTITLE_LEVELS.SIZES.indexOf(parseInt(size));
        if(level !== -1) {
            this.setSubtitleLevel(level);
        }
    },
    
    setSubtitleLevel: function(level) {
        level = Math.max(this.SUBTITLE_LEVELS.MIN, Math.min(this.SUBTITLE_LEVELS.MAX, level));
        this.currentSubtitleSize = this.SUBTITLE_LEVELS.SIZES[level];
        
        // Save both level and size
        localStorage.setItem('subtitle_level', level);
        
        this.applyLiveSubtitleStyles();
        this.updateAllDisplays();
    },
    
    setSubtitleBackground: function(bgType) {
        this.currentSubtitleBackground = bgType;
        
        // Auto-save immediately
        localStorage.setItem('subtitle_background', this.currentSubtitleBackground);
        
        this.applyLiveSubtitleStyles();
        this.updateAllDisplays();
    },
    
    getBackgroundStyle: function(bgType) {
        switch(bgType) {
            case 'transparent':
                return {
                    background: 'transparent',
                    color: '#fff',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                    padding: '0px',
                    borderRadius: '0px'
                };
            case 'black':
                return {
                    background: 'rgba(0,0,0,0.8)',
                    color: '#fff',
                    textShadow: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px'
                };
            case 'gray': // Actually RED
                return {
                    background: 'rgba(255,0,0,0.8)',
                    color: '#fff',
                    textShadow: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px'
                };
            case 'dark': // Actually GREEN
                return {
                    background: 'rgba(0,128,0,0.8)',
                    color: '#fff',
                    textShadow: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px'
                };
            default:
                return {
                    background: 'rgba(0,0,0,0.8)',
                    color: '#fff',
                    textShadow: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px'
                };
        }
    },
    
    applyLiveSubtitleStyles: function() {
        var position = this.currentSubtitlePosition;
        var size = this.currentSubtitleSize;
        var bgType = this.currentSubtitleBackground;
        
        // Get background style
        var backgroundStyle = this.getBackgroundStyle(bgType);
        
        // Apply to ACTUAL subtitles in real-time
        $('#' + media_player.parent_id).find('.subtitle-container').css({
            'bottom': position + 'vh',
            'top': 'auto',
            'font-size': size + 'px',
            'background': backgroundStyle.background,
            'color': backgroundStyle.color,
            'text-shadow': backgroundStyle.textShadow,
            'padding': backgroundStyle.padding,
            'border-radius': backgroundStyle.borderRadius
        });
        
        // Also update subtitle text elements
        $('.subtitle-text').css({
            'font-size': size + 'px',
            'background': backgroundStyle.background,
            'color': backgroundStyle.color,
            'text-shadow': backgroundStyle.textShadow,
            'padding': backgroundStyle.padding,
            'border-radius': backgroundStyle.borderRadius
        });
    },
    
    updateAllDisplays: function() {
        // Update info display at top
        $('#position-value').text(this.currentSubtitlePosition + 'vh');
        $('#size-value').text(this.currentSubtitleSize + 'px');
        
        var bgLabels = {
            'transparent': 'None',
            'black': 'Black',
            'gray': 'Red',
            'dark': 'Green'
        };
        $('#background-value').text(bgLabels[this.currentSubtitleBackground] || 'Black');
    },
    
    hoverPositionControl: function(index) {
        this.positionControlIndex = index;
        $('.subtitle-control').css('border-color', '#666');
        $('.subtitle-control[data-index="' + index + '"]').css('border-color', '#0078d4');
    },
    
    saveSubtitlePosition: function() {
        // Settings already auto-saved during adjustments
        // Just close overlay and confirm
        $('#subtitle-position-overlay').hide();
        this.keys.focused_part = "control_bar";
        
        showToast("Success", "Subtitle settings saved globally!");
    },
    
    cancelSubtitlePosition: function() {
        // Restore original settings
        this.currentSubtitlePosition = this.originalSubtitlePosition;
        this.currentSubtitleSize = this.originalSubtitleSize;
        this.currentSubtitleBackground = this.originalSubtitleBackground;
        
        // Reset level storage
        var level = this.SUBTITLE_LEVELS.SIZES.indexOf(this.originalSubtitleSize);
        if(level !== -1) {
            localStorage.setItem('subtitle_level', level);
        }
        localStorage.setItem('subtitle_position', this.originalSubtitlePosition);
        localStorage.setItem('subtitle_background', this.originalSubtitleBackground);
        
        // Revert visual changes
        this.applyLiveSubtitleStyles();
        
        // Close overlay
        $('#subtitle-position-overlay').hide();
        this.keys.focused_part = "control_bar";
    },
    hoverResumeBar: function (index) {
        var keys = this.keys;
        keys.resume_bar = index;
        $(this.resume_bar_doms).removeClass("active");
        $(this.resume_bar_doms[index]).addClass("active");
    },
    handleMenuClick: function () {
        var keys = this.keys;
        console.log("here clicked", this.show_control, keys.focused_part);
        if (keys.focused_part === "control_bar") {
            if (this.show_control)
                $(this.video_control_doms[keys.control_bar]).trigger("click");
            this.showControlBar(false);
        } else if (keys.focused_part === "info_bar") {
            if (this.show_control) {
                this.showControlBar(false);
                $(this.video_info_doms[keys.info_bar]).trigger("click");
            } else {
                this.showControlBar(false);
            }
        } else if (keys.focused_part === "episode_selection") {
            if (this.show_control) {
                this.showControlBar(false);
                $(this.episode_doms[keys.episode_selection]).trigger("click");
            } else {
                this.showControlBar(true);
            }
        } else if (keys.focused_part === "slider" && !this.show_control) {
            this.showControlBar(true);
        } else if (keys.focused_part === "operation_modal") {
            var buttons = $("#vod-series-player-operation-modal").find(
                ".modal-operation-menu-type-1",
            );
            $(buttons[keys.operation_modal]).trigger("click");
        } else if (keys.focused_part === "subtitle_audio_selection_modal") {
            if (this.subtitle_loading) return;
            if (
                keys.subtitle_audio_selection_modal >=
                this.subtitle_audio_menus.length - 2
            ) {
                // this means ok, or cancel button cliced in subtitle selection modal
                $(
                    this.subtitle_audio_menus[
                        keys.subtitle_audio_selection_modal
                    ],
                ).trigger("click");
            } else {
                $(this.subtitle_audio_menus)
                    .find("input")
                    .prop("checked", false);
                $(
                    this.subtitle_audio_menus[
                        keys.subtitle_audio_selection_modal
                    ],
                )
                    .find("input")
                    .prop("checked", true);
            }
        } else if (keys.focused_part === "resume_bar") {
            this.goBack();
            if (keys.resume_bar == 0) {
                try {
                    if (platform === "samsung") {
                        var current_time = webapis.avplay.getCurrentTime();
                        if (current_time < this.resume_time) {
                            webapis.avplay.seekTo(this.resume_time);
                        }
                    } else if (platform === "lg") {
                        var current_time = media_player.videoObj.currentTime;
                        if (current_time < this.resume_time) {
                            media_player.videoObj.currentTime =
                                this.resume_time;
                            $("#" + media_player.parent_id)
                                .find(".video-progress-bar-slider")
                                .val(this.resume_time)
                                .change();
                            $("#" + media_player.parent_id)
                                .find(".video-current-time")
                                .html(
                                    media_player.formatTime(this.resume_time),
                                );
                        }
                    }
                } catch (e) {}
            }
        }
    },
    handleMenuLeftRight: function (increment) {
        var keys = this.keys;
        if (this.show_control) {
            this.showControlBar(false);
            if (keys.focused_part === "control_bar") {
                keys.control_bar += increment;
                if (keys.control_bar < 0) keys.control_bar = 0;
                if (keys.control_bar >= this.video_control_doms.length)
                    keys.control_bar = this.video_control_doms.length - 1;
                $(this.video_control_doms).removeClass("active");
                $(this.video_control_doms[keys.control_bar]).addClass("active");
            }
            if (keys.focused_part === "info_bar") {
                keys.info_bar += increment;
                if (keys.info_bar < 0) keys.info_bar = 0;
                if (keys.info_bar >= this.video_info_doms.length)
                    keys.info_bar = this.video_info_doms.length - 1;
                $(this.video_info_doms).removeClass("active");
                $(this.video_info_doms[keys.info_bar]).addClass("active");
            }
            if (keys.focused_part === "slider") {
                this.seekTo(30 * increment);
            }
            if (keys.focused_part === "episode_selection") {
                $(this.episode_doms).removeClass("active");
                keys.episode_selection += increment;
                if (keys.episode_selection < 0)
                    keys.episode_selection = this.episode_doms.length - 1;
                if (keys.episode_selection >= this.episode_doms.length)
                    keys.episode_selection = 0;
                $(this.episode_doms[keys.episode_selection]).addClass("active");
                moveScrollPosition(
                    $("#player-seasons-container"),
                    this.episode_doms[keys.episode_selection],
                    "horizontal",
                    false,
                );
            }
        } else {
            if (
                keys.focused_part === "control_bar" ||
                keys.focused_part === "info_bar" ||
                keys.focused_part === "slider"
            ) {
                this.showControlBar(false);
                $(this.video_control_doms).removeClass("active");
                $(this.video_info_doms).removeClass("active");
                keys.focused_part = "slider";
                keys.prev_focus = "slider";
                $("#vod-series-progress-container .rangeslider").addClass(
                    "active",
                );
                this.seekTo(increment * 30);
            }
        }
        if (keys.focused_part === "subtitle_audio_selection_modal") {
            if (this.subtitle_loading) return;
            if (increment > 0)
                keys.subtitle_audio_selection_modal =
                    this.subtitle_audio_menus.length - 1;
            else
                keys.subtitle_audio_selection_modal =
                    this.subtitle_audio_menus.length - 2;
            this.hoverSubtitleAudioModal(keys.subtitle_audio_selection_modal);
        }
    },
    handleMenuUpDown: function (increment) {
        var buttons = $("#vod-series-player-operation-modal").find(
            ".modal-operation-menu-type-1",
        );
        var keys = this.keys;
        if (
            (keys.focused_part === "control_bar" ||
                keys.focused_part === "info_bar" ||
                keys.focused_part === "slider" ||
                keys.focused_part === "episode_selection") &&
            !this.show_control
        ) {
            // clearTimeout(this.timeOut)
            this.showControlBar(true);
            // this.showNextVideo(increment);
        }
        if (this.show_control) {
            this.showControlBar(false);
            switch (keys.focused_part) {
                case "slider":
                    if (increment > 0) {
                        this.removeAllActiveClass(true);
                        keys.focused_part = "control_bar";
                        keys.prev_focus = "control_bar";
                        keys.control_bar = 2;
                        $(this.video_control_doms).removeClass("active");
                        $(this.video_info_doms).removeClass("active");
                        $(this.video_control_doms[2]).addClass("active");
                        $(
                            "#vod-series-progress-container .rangeslider",
                        ).removeClass("active");
                    }
                    break;
                case "control_bar":
                    this.removeAllActiveClass(true);
                    if (increment > 0) {
                        keys.focused_part = "info_bar";
                        keys.prev_focus = "info_bar";
                        keys.info_bar = 0;
                        $(this.video_info_doms[keys.info_bar]).addClass(
                            "active",
                        );
                    } else {
                        keys.focused_part = "slider";
                        keys.prev_focus = "slider";
                        $(
                            "#vod-series-progress-container .rangeslider",
                        ).addClass("active");
                        $(this.video_control_doms).removeClass("active");
                        $(this.video_info_doms).removeClass("active");
                    }
                    break;
                case "info_bar":
                    if (increment < 0) {
                        this.removeAllActiveClass(true);
                        $(this.video_control_doms).removeClass("active");
                        $(this.video_info_doms).removeClass("active");
                        keys.focused_part = "control_bar";
                        keys.prev_focus = "control_bar";
                        keys.control_bar = 2;
                        $(this.video_control_doms[2]).addClass("active");
                    } else if (this.has_episodes) {
                        this.removeAllActiveClass(true);
                        $(this.video_control_doms).removeClass("active");
                        $(this.video_info_doms).removeClass("active");
                        $("#player-seasons-container").addClass("expanded");
                        keys.focused_part = "episode_selection";
                        keys.prev_focus = "episode_selection";
                        $(this.episode_doms[keys.episode_selection]).addClass(
                            "active",
                        );
                        moveScrollPosition(
                            $("#player-seasons-container"),
                            this.episode_doms[keys.episode_selection],
                            "horizontal",
                            false,
                        );
                    }
                    break;
                case "episode_selection":
                    if (increment < 0) {
                        this.removeAllActiveClass(true);
                        $("#player-seasons-container").removeClass("expanded");
                        keys.focused_part = "info_bar";
                        $(this.episode_doms).removeClass("active");
                        $(this.video_info_doms[keys.info_bar]).addClass(
                            "active",
                        );
                    }
                    break;
            }
        }
        if (keys.focused_part === "operation_modal") {
            keys.operation_modal += increment;
            if (keys.operation_modal < 0)
                keys.operation_modal = buttons.length - 1;
            if (keys.operation_modal >= buttons.length)
                keys.operation_modal = 0;
            $(buttons).removeClass("active");
            $(buttons[keys.operation_modal]).addClass("active");
        }
        if (keys.focused_part === "subtitle_audio_selection_modal") {
            if (this.subtitle_loading) return;
            console.log(keys.subtitle_audio_selection_modal, increment);
            if (
                keys.subtitle_audio_selection_modal <
                this.subtitle_audio_menus.length - 2
            )
                keys.subtitle_audio_selection_modal += increment;
            if (
                keys.subtitle_audio_selection_modal >=
                    this.subtitle_audio_menus.length - 2 &&
                increment < 0
            )
                keys.subtitle_audio_selection_modal =
                    this.subtitle_audio_menus.length - 3;
            if (keys.subtitle_audio_selection_modal < 0) {
                keys.subtitle_audio_selection_modal = 0;
                return;
            }
            if (
                keys.subtitle_audio_selection_modal >=
                this.subtitle_audio_menus.length
            )
                keys.subtitle_audio_selection_modal =
                    this.subtitle_audio_menus.length - 1;
            this.hoverSubtitleAudioModal(keys.subtitle_audio_selection_modal);
        }
        if (keys.focused_part === "resume_bar") {
            var resume_bar_doms = this.resume_bar_doms;
            keys.resume_bar += increment;
            if (keys.resume_bar < 0)
                keys.resume_bar = resume_bar_doms.length - 1;
            if (keys.resume_bar >= resume_bar_doms.length) keys.resume_bar = 0;
            $(resume_bar_doms).removeClass("active");
            $(resume_bar_doms[keys.resume_bar]).addClass("active");
            clearTimeout(this.resume_timer);
            this.resume_timer = setTimeout(function () {
                $("#video-resume-modal").hide();
                keys.focused_part = keys.prev_focus;
            }, 15000);
        }
    },
    HandleKey: function (e) {
        switch (e.keyCode) {
            case tvKey.MediaFastForward:
                this.seekTo(30);
                break;
            case tvKey.RIGHT:
                this.handleMenuLeftRight(1);
                break;
            case tvKey.MediaRewind:
                this.seekTo(-30);
                break;
            case tvKey.LEFT:
                this.handleMenuLeftRight(-1);
                break;
            case tvKey.DOWN:
                this.handleMenuUpDown(1);
                break;
            case tvKey.UP:
                this.handleMenuUpDown(-1);
                break;
            case tvKey.MediaPause:
                this.playPauseVideo("pause");
                break;
            case tvKey.MediaPlay:
                this.playPauseVideo("play");
                break;
            case tvKey.MediaPlayPause:
                this.playPauseVideo("pause");
                break;

            case tvKey.ENTER:
                this.handleMenuClick();
                break;
            case tvKey.RETURN:
                this.goBack();
                break;
            case tvKey.YELLOW:
                if (this.current_movie_type === "movies") {
                    if (!current_movie.is_favourite) {
                        VodModel.addRecentOrFavouriteMovie(
                            current_movie,
                            "favourite",
                        );
                        current_movie.is_favourite = true;
                    } else {
                        VodModel.removeRecentOrFavouriteMovie(
                            current_movie.stream_id,
                            "favourite",
                        );
                        current_movie.is_favourite = false;
                    }
                } else {
                    if (!current_series.is_favourite) {
                        SeriesModel.addRecentOrFavouriteMovie(
                            current_series,
                            "favourite",
                        );
                        current_series.is_favourite = true;
                    } else {
                        SeriesModel.removeRecentOrFavouriteMovie(
                            current_series.series_id,
                            "favourite",
                        );
                        current_series.is_favourite = false;
                    }
                }
                break;
            case tvKey.BLUE:
                this.Exit();
                if (this.current_movie_type === "series")
                    goHomePageWithMovieType("live-tv");
                else goHomePageWithMovieType("series");
                break;
        }
    },
};
