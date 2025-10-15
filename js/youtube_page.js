"use strict";

var youtube_page = {
    keys: {
        focused_part: "playlist_selection", // playlist_selection, back_button, player_controls
        playlist_selection: 0,
        player_controls: 0
    },
    player: null,
    playlist: [],
    currentVideoIndex: 0,
    isFullscreen: false,
    isPlayerReady: false,
    prev_route: null,
    playlist_items_doms: [],
    playerState: -1,
    apiReady: false,
    
    init: function(playlist, prev_route) {
        var that = this;
        this.prev_route = prev_route || 'home-page';
        this.playlist = playlist || [];
        this.currentVideoIndex = 0;
        this.isFullscreen = false;
        
        $('#youtube-page').show();
        current_route = 'youtube-page';
        
        // Load YouTube IFrame API if not loaded
        if(!window.YT) {
            var tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            
            // Set up callback for when API is ready
            window.onYouTubeIframeAPIReady = function() {
                that.apiReady = true;
                that.initializePlayer();
            };
        } else {
            this.apiReady = true;
            this.initializePlayer();
        }
        
        // Render playlist
        this.renderPlaylist();
        
        // Set initial focus
        this.keys.focused_part = "playlist_selection";
        this.keys.playlist_selection = 0;
        this.hoverPlaylistItem(0);
    },
    
    initializePlayer: function() {
        var that = this;
        
        // Destroy existing player if any
        if(this.player) {
            this.player.destroy();
        }
        
        // Get first video ID
        var firstVideoId = this.playlist.length > 0 ? this.playlist[0].videoId : '';
        
        this.player = new YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            videoId: firstVideoId,
            playerVars: {
                'autoplay': 1,
                'controls': 1,
                'rel': 0,
                'modestbranding': 1,
                'enablejsapi': 1,
                'origin': window.location.origin
            },
            events: {
                'onReady': function(event) {
                    that.onPlayerReady(event);
                },
                'onStateChange': function(event) {
                    that.onPlayerStateChange(event);
                },
                'onError': function(event) {
                    that.onPlayerError(event);
                },
                'onPlaybackQualityChange': function(event) {
                    that.onQualityChange(event);
                }
            }
        });
    },
    
    onPlayerReady: function(event) {
        this.isPlayerReady = true;
        this.updateVideoInfo();
        showToast("YouTube Player", "Player ready");
    },
    
    onPlayerStateChange: function(event) {
        this.playerState = event.data;
        
        // Update play/pause button text
        if(event.data === YT.PlayerState.PLAYING) {
            $('#yt-play-pause-btn').text('Pause').attr('data-word_code', 'pause');
        } else if(event.data === YT.PlayerState.PAUSED) {
            $('#yt-play-pause-btn').text('Play').attr('data-word_code', 'play');
        }
        
        // Auto-play next video when current ends
        if(event.data === YT.PlayerState.ENDED) {
            this.playNextVideo();
        }
    },
    
    onPlayerError: function(event) {
        var errorMessage = "Unknown error";
        switch(event.data) {
            case 2:
                errorMessage = "Invalid video ID";
                break;
            case 5:
                errorMessage = "HTML5 player error";
                break;
            case 100:
                errorMessage = "Video not found";
                break;
            case 101:
            case 150:
                errorMessage = "Video cannot be embedded";
                break;
        }
        
        showToast("YouTube Error", errorMessage);
        
        // Try to play next video
        setTimeout(function() {
            youtube_page.playNextVideo();
        }, 2000);
    },
    
    onQualityChange: function(event) {
        var quality = event.data;
        showToast("Quality Changed", "Playback quality: " + quality);
    },
    
    renderPlaylist: function() {
        var that = this;
        var html = '';
        
        this.playlist.forEach(function(video, index) {
            html += '<div class="youtube-playlist-item' + (index === 0 ? ' active' : '') + '" ' +
                    'data-index="' + index + '" ' +
                    'onclick="youtube_page.selectVideo(' + index + ')" ' +
                    'onmouseenter="youtube_page.hoverPlaylistItem(' + index + ')">' +
                    '<div class="youtube-playlist-item-thumbnail">' +
                    '<img src="' + (video.thumbnail || 'https://img.youtube.com/vi/' + video.videoId + '/default.jpg') + '">' +
                    '<div class="youtube-playlist-item-duration">' + (video.duration || '') + '</div>' +
                    '</div>' +
                    '<div class="youtube-playlist-item-info">' +
                    '<div class="youtube-playlist-item-title">' + (video.title || 'Video ' + (index + 1)) + '</div>' +
                    '<div class="youtube-playlist-item-index">' + (index + 1) + ' / ' + that.playlist.length + '</div>' +
                    '</div>' +
                    '</div>';
        });
        
        $('#youtube-playlist-container').html(html);
        $('#youtube-playlist-count').text('(' + this.playlist.length + ')');
        $('#yt-total-videos').text(this.playlist.length);
        
        this.playlist_items_doms = $('.youtube-playlist-item');
    },
    
    updateVideoInfo: function() {
        if(!this.player || !this.isPlayerReady) return;
        
        var currentVideo = this.playlist[this.currentVideoIndex];
        if(currentVideo) {
            $('#youtube-video-title').text(currentVideo.title || 'Video ' + (this.currentVideoIndex + 1));
            $('#youtube-video-description').text(currentVideo.description || 'No description available');
            $('#yt-current-index').text(this.currentVideoIndex + 1);
        }
    },
    
    selectVideo: function(index) {
        this.currentVideoIndex = index;
        this.playVideo(index);
    },
    
    playVideo: function(index) {
        if(!this.player || !this.isPlayerReady) return;
        
        this.currentVideoIndex = index;
        var video = this.playlist[index];
        
        if(video) {
            this.player.loadVideoById(video.videoId);
            this.updateVideoInfo();
            
            // Update active playlist item
            $(this.playlist_items_doms).removeClass('active');
            $(this.playlist_items_doms[index]).addClass('active');
            
            // Scroll to active item
            moveScrollPosition($('#youtube-playlist-container'), this.playlist_items_doms[index], 'vertical', false);
        }
    },
    
    playNextVideo: function() {
        var nextIndex = this.currentVideoIndex + 1;
        if(nextIndex >= this.playlist.length) {
            nextIndex = 0; // Loop back to first video
        }
        this.playVideo(nextIndex);
    },
    
    playPreviousVideo: function() {
        var prevIndex = this.currentVideoIndex - 1;
        if(prevIndex < 0) {
            prevIndex = this.playlist.length - 1; // Loop to last video
        }
        this.playVideo(prevIndex);
    },
    
    togglePlayPause: function() {
        if(!this.player || !this.isPlayerReady) return;
        
        if(this.playerState === YT.PlayerState.PLAYING) {
            this.player.pauseVideo();
        } else {
            this.player.playVideo();
        }
    },
    
    toggleFullscreen: function() {
        this.isFullscreen = !this.isFullscreen;
        
        if(this.isFullscreen) {
            $('#youtube-page').addClass('youtube-fullscreen');
            $('#youtube-sidebar').hide();
            $('#youtube-back-btn').hide();
            this.keys.focused_part = "fullscreen";
        } else {
            $('#youtube-page').removeClass('youtube-fullscreen');
            $('#youtube-sidebar').show();
            $('#youtube-back-btn').show();
            this.keys.focused_part = "playlist_selection";
        }
        
        showToast("Fullscreen", this.isFullscreen ? "Fullscreen ON" : "Fullscreen OFF");
    },
    
    hoverPlaylistItem: function(index) {
        if(typeof index === 'object') {
            index = $(index).data('index');
        }
        
        this.keys.playlist_selection = index;
        this.keys.focused_part = "playlist_selection";
        
        $(this.playlist_items_doms).removeClass('active-focus');
        $(this.playlist_items_doms[index]).addClass('active-focus');
        
        moveScrollPosition($('#youtube-playlist-container'), this.playlist_items_doms[index], 'vertical', false);
    },
    
    hoverBackButton: function() {
        this.keys.focused_part = "back_button";
        $('#youtube-back-btn').addClass('active');
    },
    
    handleMenuClick: function() {
        var keys = this.keys;
        
        switch(keys.focused_part) {
            case "playlist_selection":
                this.selectVideo(keys.playlist_selection);
                break;
            case "back_button":
                this.goBack();
                break;
            case "fullscreen":
                this.toggleFullscreen();
                break;
        }
    },
    
    handleMenuUpDown: function(increment) {
        var keys = this.keys;
        
        if(keys.focused_part === "playlist_selection") {
            keys.playlist_selection += increment;
            
            if(keys.playlist_selection < 0) {
                keys.playlist_selection = this.playlist.length - 1;
            }
            if(keys.playlist_selection >= this.playlist.length) {
                keys.playlist_selection = 0;
            }
            
            this.hoverPlaylistItem(keys.playlist_selection);
        }
    },
    
    handleMenuLeftRight: function(increment) {
        var keys = this.keys;
        
        if(keys.focused_part === "fullscreen") {
            // In fullscreen, left/right changes videos
            if(increment > 0) {
                this.playNextVideo();
            } else {
                this.playPreviousVideo();
            }
        }
    },
    
    goBack: function() {
        // Stop and destroy player
        if(this.player) {
            this.player.stopVideo();
            this.player.destroy();
            this.player = null;
        }
        
        this.isPlayerReady = false;
        $('#youtube-page').hide();
        
        // Go back to previous route
        switch(this.prev_route) {
            case 'home-page':
                home_page.reEnter();
                break;
            default:
                home_page.reEnter();
                break;
        }
    },
    
    HandleKey: function(e) {
        if(!this.isPlayerReady) return;
        
        var keys = this.keys;
        
        switch(e.keyCode) {
            case tvKey.UP:
                this.handleMenuUpDown(-1);
                break;
            case tvKey.DOWN:
                this.handleMenuUpDown(1);
                break;
            case tvKey.LEFT:
                this.handleMenuLeftRight(-1);
                break;
            case tvKey.RIGHT:
                this.handleMenuLeftRight(1);
                break;
            case tvKey.ENTER:
                this.handleMenuClick();
                break;
            case tvKey.RETURN:
                if(this.isFullscreen) {
                    this.toggleFullscreen();
                } else {
                    this.goBack();
                }
                break;
            case tvKey.PLAY:
            case tvKey.PAUSE:
            case tvKey.PLAYPAUSE:
                this.togglePlayPause();
                break;
            case tvKey.RED:
                this.toggleFullscreen();
                break;
            case tvKey.YELLOW:
                this.playPreviousVideo();
                break;
            case tvKey.BLUE:
                this.playNextVideo();
                break;
        }
    }
};
