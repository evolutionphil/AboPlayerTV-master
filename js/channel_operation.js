"use strict";
var channel_page={
    current_channel_id:0,
    full_screen_video:false,
    full_screen_timer:null,
    progressbar_timer:null,
    player:null,
    channel_number_timer:null,
    channel_num:0,
    movies:[],
    initiated:false,
    categories:[],
    current_category_index:0,
    category_hover_timer:null,
    category_hover_timeout:300,
    channel_hover_timer:null,
    channel_hover_timeout:300,
    keys:{
        focused_part:"category_selection",//search_selection
        category_selection:0,
        channel_selection:0,
        search_back_selection:0,
        search_selection:-1,
        prev_focus:'',
        video_control:0,
        action_btn_selection:0
    },

    category_doms:[],
    channel_doms:[],
    video_control_doms:$('#channel-page .video-control-icon-wrapper'),
    play_icon_index:1,
    search_items:[],
    filtered_movies:[],
    next_programme_timer:null,
    programmes:[],
    short_epg_limit_count:30,
    prev_focus_dom:null,
    next_channel_timer:null,
    prev_keyword:'',
    search_timer:null,
    action_btn_doms:$('.channel-action-btn'),
    current_movie:null,
    ui_lock_until: 0,
    display_area_timeout: null,
    
    lockUI: function(ms) {
        ms = ms || 800;
        this.ui_lock_until = Date.now() + ms;
        console.log('🔒 UI LOCKED for ' + ms + 'ms until:', this.ui_lock_until);
    },
    
    uiLocked: function() {
        var locked = Date.now() < this.ui_lock_until;
        if (locked) {
            console.log('🔒 UI is LOCKED, remaining:', this.ui_lock_until - Date.now(), 'ms');
        }
        return locked;
    },
    
    scheduleSetDisplayArea: function(callback, delay) {
        delay = delay || 250;
        console.log('📅 scheduleSetDisplayArea: delay=' + delay + 'ms, clearing previous timeout');
        if (this.display_area_timeout) {
            clearTimeout(this.display_area_timeout);
            console.log('  ⚠️ CANCELLED previous setDisplayArea timeout');
        }
        var that = this;
        this.display_area_timeout = setTimeout(function() {
            console.log('⏰ scheduleSetDisplayArea: timeout fired, executing callback');
            that.display_area_timeout = null;
            try {
                if (callback) callback();
            } catch (e) {
                console.log('❌ setDisplayArea error:', e);
            }
        }, delay);
    },

    init:function (channel_id, is_favourite) {
        var categories=LiveModel.getCategories(false, true);
        this.categories=categories;
        if(this.categories.length==0)
        {
            home_page.reEnter();
            showToast('Sorry','All categories are hidden, please show some categories to see')
            return;
        }
        this.prev_focus_dom=null;
        $("#channel-page").show();
        current_route="channel-page";

        $('#channel-categories-count').text(categories.length);
        var html='';
        categories.map(function (item,index) {
            html+=
                '<div class="channel-page-category-item"\
                    onmouseenter="channel_page.hoverCategory(this)"\
                    onclick="channel_page.handleMenuClick()"\
                    data-index="'+index+'"\
                >\
                    <span class="channel-category-name-wrapper">\
                        <span class="channel-category-number">'+(index+1)+'</span> \
                        <span class="channel-category-name">'+item.category_name+'</span>\
                    </span> \
                    <span class="channel-category-movie-counts-wrapper">\
                        <span class="channel-category-movie-counts">'+item.movies.length+'</span>\
                        <img src="images/arrow-right.png">\
                    </span>\
                </div>';
        })
        $('#channel-page-categories-container').html(html);
        this.category_doms=$('.channel-page-category-item');

        this.current_category_index=-1;
        var current_category_index=0, current_channel_index=0;
        var selected_channel_id=channel_id;
        if(channel_id){
            if(is_favourite){  // if it is for favourite channel showing from home page
                current_category_index=0;
                var movies=this.categories[0].movies;
                for(var i=0;i>movies.length;i++){
                    if(movies[i].stream_id===channel_id){
                        current_channel_index=i;
                        break;
                    }
                }
            }else{
                var movie=channel_id;
                for(var i=0;i<categories.length;i++){
                    if(movie.category_id===categories[i].category_id){
                        current_category_index=i;
                        break;
                    }
                }
                selected_channel_id=movie.stream_id;
            }
            var movies=categories[current_category_index].movies;
            for(var i=0;i<movies.length;i++){
                if(selected_channel_id===movies[i].stream_id){
                    current_channel_index=i;
                    break;
                }
            }
        }else{
            for(var i=0;i<categories.length;i++){
                if(categories[i].movies.length>0){
                    current_category_index=i;
                    break;
                }
            }
        }
        
        // Guard: Check if we have any content before showing channels
        if(categories.length === 0 || !categories[current_category_index] || categories[current_category_index].movies.length === 0){
            console.log('No channels available - exiting to home');
            showToast("No Content", "Please load a playlist first");
            this.Exit();
            return;
        }
        
        this.hoverCategory(current_category_index);
        this.showCategoryChannels();
        if(!channel_id){
            if(categories[current_category_index].movies.length>0){
                this.hoverChannel(0);
                this.showMovie(this.movies[0]);
                this.full_screen_video=false;
            }
        }else{
            this.hoverChannel(current_channel_index);
            this.showMovie(this.movies[current_channel_index]);
            this.full_screen_video=true;
            this.zoomInOut();
        }
    },
    toggleFavoriteAndRecentBottomOptionVisbility: function () {
        var category = current_category;

        if (this.full_screen_video === false || media_player.full_screen_state === false) {
            if (category.category_id === 'recent' || category.category_id === 'favourite') {
                $('.bottom-label-item.' + category.category_id).show();
            }
        } else {
            if (category.category_id === 'recent' || category.category_id === 'favourite') {
                $('.bottom-label-item.' + category.category_id).hide();
            }
        }
    },
    goBack:function(){
        var keys=this.keys;
        switch (keys.focused_part) {
            case "video_control":
                $('#full-screen-information').slideUp();
                keys.focused_part="full_screen";
                break;
            case "full_screen":
                var show_f_s_info=$('#full-screen-information').css('display');
                if(show_f_s_info==='block'){
                    clearTimeout(this.full_screen_timer);
                    this.hideFullScreenInfo();
                }else{
                    this.full_screen_video=false;
                    this.zoomInOut();
                }
                break;
            case "search_selection":
                this.removeSearchResult();
                break;
            case "action_btn_selection":
            case "category_selection":
            case "channel_selection":
                this.Exit();
                break;

        }
    },
    reEnter:function(){
        $("#channel-page").show();
        this.keys.focused_part="channel_selection";
        current_route="channel-page";
        var that=this;
        this.hoverActionBtn(1);
        setTimeout(function(){
                that.showMovie(that.current_movie)
            },500
        )
    },
    Exit:function () {
        try{
            media_player.close();
        }
        catch(e){
            console.log(e);
        }
        var keys=this.keys;
        keys.focused_part="channel_selection"; // focus will go to menu part
        this.full_screen_video=false;
        this.zoomInOut();
        $("#channel-page").hide();
        $('#channel-title').html('');
        $('#next-program-container').html('');
        clearInterval(this.progressbar_timer);
        clearTimeout(this.full_screen_timer);
        clearTimeout(this.next_channel_timer);
        home_page.reEnter();
    },
    showCategoryChannels:function(){
        var keys=this.keys;
        if(keys.category_selection===this.current_category_index)
            return;
        var categories=this.categories;
        var category=categories[keys.category_selection];
        this.movies=category.movies;
        
        // Filter blocked channels if hide_blocked_content is enabled
        var hideBlocked = localStorage.getItem('hide_blocked_content') === 'true';
        if(hideBlocked) {
            this.movies = this.movies.filter(function(movie) {
                return !isContentBlocked(movie.name, 'channel');
            });
            console.log('🔒 Filtered blocked channels, remaining:', this.movies.length);
        }
        
        // Check if all channels are blocked - show empty state
        if(this.movies.length === 0) {
            console.log('⚠️ No channels available after filtering');
            $('#channel-menus-count').text(0);
            $('#channel-menu-wrapper').html('<div class="empty-movie-text">No channels available in this category</div>');
            this.current_category_index=keys.category_selection;
            return;
        }
        
        $('#channel-menus-count').text(this.movies.length);
        var  htmlContents='';
        this.movies.map(function(movie, index){
            var epg_icon='';
            htmlContents+=
                '<div class="channel-menu-item" data-channel_id="'+movie.stream_id+'"\
                   data-index="'+index+'"\
                   onmouseenter="channel_page.hoverChannel(this)"\
                   onclick="channel_page.handleMenuClick()"\
                >\
                    <span class="channel-number">'+movie.num+'</span>\
                    <img class="channel-icon" src="'+movie.stream_icon+'" onerror="this.src=\''+default_movie_icon+'\'">'+epg_icon+'</span>'+
                    '<span class="channel-name">'+movie.name+'</span>'+
                    (LiveModel.favourite_ids.includes(movie.stream_id) ? '<i class="fa fa-star favourite-icon"></i>' : '')+
                '</div>'
        })
        $('#channel-page-menu-container').html(htmlContents);
        keys.channel_selection=0;
        this.channel_doms=$('#channel-page-menu-container .channel-menu-item');
        moveScrollPosition($('#channel-page-menu-container'),this.channel_doms[0],'vertical',true);
        this.current_category_index=keys.category_selection;
        this.prev_keyword='';
        $('#search-value').val('');
    },
    goChannelNum:function(new_value){
        if(!this.full_screen_video)
            return;
        var channel_num=this.channel_num;
        if(channel_num!=0 ||(channel_num==0 && new_value!=0)){
            channel_num=channel_num*10+new_value;
            this.channel_num=channel_num;
            clearTimeout(this.channel_number_timer);
            var that=this;
            $('#typed-channel-number').text(channel_num);
            this.channel_number_timer=setTimeout(function(){  // go to channel number
                var movies=that.movies;
                var movie_exist=false;
                for(var i=0;i<movies.length;i++){
                    if(movies[i].num===that.channel_num){
                        movie_exist=true;
                        current_movie=movies[i];
                        that.showMovie(current_movie)
                        that.current_channel_id=current_movie.stream_id;
                        that.hoverChannel(that.channel_doms[i]);
                        that.keys.focused_part='full_screen';
                        that.showFullScreenInfo();
                        break;
                    }
                }
                if(!movie_exist){
                    showToast("Sorry","Channel does not exist");
                }
                that.channel_num=0;
                $('#typed-channel-number').text("");
            },2000);
        }
    },
    addOrRemoveFav:function(){
        var keys=this.keys;
        var current_movie=this.movies[keys.channel_selection];
        var action='add';
        if(LiveModel.favourite_ids.includes(current_movie.stream_id))
            action='remove';
        if(action==='add'){
            LiveModel.addRecentOrFavouriteMovie(current_movie,'favourite');  // add to favourite movie
            $(this.channel_doms[keys.channel_selection]).append(
                '<i class="fa fa-star favourite-icon"></i>'
            )
        }
        else{
            var current_category=this.categories[this.current_category_index];
            LiveModel.removeRecentOrFavouriteMovie(current_movie.stream_id,'favourite');
            $(this.channel_doms[keys.channel_selection]).find('.favourite-icon').remove();
            if(current_category.category_id==='favourite'){
                $(this.channel_doms[keys.channel_selection]).remove();
                var channel_doms=$('#channel-page-menu-container .channel-menu-item');;
                this.channel_doms=channel_doms;
                if(channel_doms.length==0){
                    this.hoverCategory(keys.category_selection);
                }else{
                    if(keys.channel_selection>=channel_doms.length)
                        keys.channel_selection=channel_doms.length-1;
                    this.hoverChannel(keys.channel_selection);
                }
            }
        }
        this.changeFavouriteButton();
        try{
            var favourite_movies_count=LiveModel.getRecentOrFavouriteCategory('favourite').movies.length;
            $(this.category_doms[0]).find('.channel-category-movie-counts').text(favourite_movies_count)
        }catch (e) {
        }
    },
    changeFavouriteButton:function(){
        var channel=this.movies[this.keys.channel_selection];
        if(channel){
            var movie_id=channel.stream_id;
            var action_buttons=[$('.channel-action-btn')[0]];
            if(!LiveModel.favourite_ids.includes(movie_id))
                $(action_buttons).find('.favourite-btn-title').text("Favourite");
            else
                $(action_buttons).find('.favourite-btn-title').text("Remove Fav");
        }
    },
    showNextProgrammes:function (){
        var id='next-program-container';
        var movie=this.movies[this.keys.channel_selection];
        $('#channel-title').text(movie.name);
        var temp=LiveModel.getNextProgrammes(this.programmes);
        var current_program_exist=temp['current_program_exist'];
        var programmes=temp.programmes;
        var k=0;
        var htmlContent='';
        for(var i=0;i<programmes.length;i++){
            htmlContent+=
                '<div class="next-program-item '+(k==0 && current_program_exist ? 'current' : '')+'">'+
                '<span class="program-time">'+
                programmes[i].start.substring(11)+' ~ '+programmes[i].stop.substring(11)+
                '</span>'+programmes[i].title+
                '</div>'
            k++;
            if(k>=4)
                break;
        }
        if(k>0)
            $('#'+id).html(htmlContent).show();
        else
            $('#'+id).hide().html('');

        var current_program,next_program, current_program_title="No Info",
            current_program_time='', next_program_title="No Info", next_program_time='', program_desc='No Information';
        if(current_program_exist){
            current_program=programmes[0];
            if(programmes.length>1)
                next_program=programmes[1];
        }
        else{
            if(programmes.length>0)
                next_program=programmes[0];
        }
        if(current_program){
            current_program_title=current_program.title;
            program_desc=getAtob(current_program.description);
            var time_length=(new Date(current_program.stop)).getTime()-(new Date(current_program.start)).getTime();
            var current_time=(new Date()).getTime();
            var percentage=(current_time-(new Date(current_program.start).getTime()))*100/time_length;
            $('#full-screen-information-progress span').css({width:percentage+'%'});
        }
        else
            $('#full-screen-information-progress span').css({width:0});
        if(next_program)
            next_program_title=next_program.title;
        $('#full-screen-current-program').text(current_program_title);
        $('#full-screen-program-name').text(current_program_title);
        $('#full-screen-next-program').text(next_program_title);
        $('#full-screen-program-description').text(program_desc);
    },
    updateNextProgrammes:function(){
        this.showNextProgrammes();
        clearInterval(this.next_programme_timer);
        var that=this;
        this.next_programme_timer=setInterval(function () {
            that.showNextProgrammes();
        },60000)
    },
    getEpgProgrammes:function(){
        var keys=this.keys;
        var that=this;
        var programmes=[];
        this.programmes=[];
        that.showNextProgrammes();
        var movie=this.movies[this.keys.channel_selection];
        if(settings.playlist_type==='xtreme'){
            var format_text='Y-MM-DD HH:mm';
            var playlist=settings.playlist;
            $.ajax({
                method:'get',
                url:api_host_url+'/player_api.php?username='+user_name+'&password='+password+'&action=get_short_epg&stream_id='+movie.stream_id+'&limit='+this.short_epg_limit_count,
                success:function (data) {
                    data.epg_listings.map(function (item) {
                        programmes.push({
                            start:getLocalChannelTime(item.start).format(format_text),
                            stop:getLocalChannelTime(item.end).format(format_text),
                            title:getAtob(item.title),
                            description:getAtob(item.description)
                        })
                    })
                    that.programmes=programmes;
                    that.updateNextProgrammes();
                }
            });
        }
    },
    showFullScreenInfo:function(){
        if(this.full_screen_video){
            clearTimeout(this.full_screen_timer);
            $('#full-screen-information').slideDown();
            var that=this;
            this.full_screen_timer=setTimeout(function () {
                that.hideFullScreenInfo();
            },5000)
        }
    },
    hideFullScreenInfo:function(){
        $('#full-screen-information').slideUp();
    },
    zoomInOut:function(){
        var keys=this.keys;
        if(!this.full_screen_video){
            $('#channel-page .player-container').removeClass('expanded')
            this.keys.focused_part="channel_selection";
            $('#full-screen-information').slideUp();
        }
        else{
            $('#channel-page .player-container').addClass('expanded');
            this.showFullScreenInfo();
            keys.focused_part="full_screen";
        }
        try{
            media_player.setDisplayArea();
        }catch (e) {
        }
    },
    showMovie:function(current_movie){
        this.current_movie=current_movie;
        var url,movie_id=current_movie.stream_id;
        if(settings.playlist_type==='xtreme')
            url=getMovieUrl(movie_id,'live','ts');
        else if(settings.playlist_type==='type1')
            url=current_movie.url;
        try{
            media_player.close();
        }catch(e){
        }
        media_player.init("channel-page-video","channel-page")
        try{
            media_player.setDisplayArea();
        }catch (e) {
        }
        try{
            media_player.playAsync(url);
        }catch (e){
        }
        this.current_channel_id=movie_id;
        $('#full-screen-channel-name-inline').text(current_movie.name);
        $('#full-screen-channel-logo').attr('src',current_movie.stream_icon);
        if(!checkForAdult(current_movie,'movie',LiveModel.categories))
            LiveModel.addRecentOrFavouriteMovie(current_movie,'recent');   // add to recent live channels
    },
    showNextChannel:function(increment){
        var keys=this.keys;
        var prev_focus=keys.focused_part;
        keys.channel_selection+=increment;
        if(keys.channel_selection<0)
            keys.channel_selection=0;
        if(keys.channel_selection>=this.channel_doms.length)
            keys.channel_selection=this.channel_doms.length-1;
        var that=this;
        setTimeout(function () {
            var movie=that.movies[keys.channel_selection]
            that.current_channel_id=movie.stream_id;
            that.showMovie(that.movies[keys.channel_selection]);
        },400)
        this.hoverChannel(keys.channel_selection);
        if(prev_focus==='full_screen')
            keys.focused_part='full_screen';
        this.showFullScreenInfo();
    },
    playOrPause:function(){
        if(media_player.state==media_player.STATES.PLAYING){
            try{
                media_player.pause();
                (this.video_control_doms[1],false)
            }catch(e){
            }
        }else{
            try{
                media_player.play();
                // changePlayerStateIcon(this.video_control_doms[1],true)
            }catch (e) {
            }
        }
    },
    showSearchModal:function(){
        var keys=this.keys;
        if(!this.full_screen_video && keys.focused_part!=='search_selection'){
            keys.prev_focus=keys.focused_part;
            $('.search-modal-container').show();
            $('#search-value').val("");
            $('.search-content-container').html('');
            keys.focused_part='search_selection';
            keys.search_selection=-1;
            $('#search-value').focus();
            // this.renderSearchResults();
        }
    },
    searchValueChange:function(){
        clearTimeout(this.search_timer);
        var that=this;
        this.search_timer=setTimeout(function () {
            var search_value=$('#search-value').val();
            search_value=search_value.toLowerCase();
            if(search_value===that.prev_keyword)
                return;
            that.renderSearchResults();
        },400)
    },
    renderSearchResults:function(){
        var search_value=$('#search-value').val();
        var categories=LiveModel.getCategories(false,false);
        var total_movies=[];
        if(search_value.length>=2){
            for(var i=2;i<categories.length;i++){
                var temps=categories[i].movies.filter(function (item) {
                    return item.name.toLowerCase().includes(search_value);
                })
                total_movies=total_movies.concat(temps);
            }
        }
        total_movies.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        })
        var htmlContent='';
        total_movies.map(function(movie,index){
            htmlContent+=
                '<div class="search-item-wrapper"\
                    onmouseenter="channel_page.hoverSearchItem('+index+')" \
                    onclick="channel_page.searchItemClick()"\
                >'+
                movie.name+
                '</div>'
        })
        $('.search-content-container').html(htmlContent);
        this.search_items=$('.search-item-wrapper');
        this.filtered_movies=total_movies;
    },
    handleSearchItem:function(increment){
        var keys=this.keys;
        if($('.search-item-wrapper').length==0)
            return;
        keys.search_selection+=increment;
        if(keys.search_selection<0){
            $('#search-value').focus();
            setTimeout(function () {
                var tmp = $('#search-value').val();
                $('#search-value')[0].setSelectionRange(tmp.length, tmp.length);
            },200)
            return;
        }
        $('#search-value').blur();
        if(keys.search_selection>=this.search_items.length)
            keys.search_selection=this.search_items.length-1;
        $('.search-item-wrapper').removeClass('active');
        $(this.search_items[keys.search_selection]).addClass('active');
        moveScrollPosition($('.search-content-container')[0],this.search_items[keys.search_selection],'vertical',false);
    },
    removeSearchResult:function(){
        $('.search-modal-container').hide();
        $('.search-content-container').html('');
        this.keys.focused_part=this.keys.prev_focus;
        this.search_selection=-1;
    },
    searchItemClick:function(){
        var keys=this.keys;
        this.removeSearchResult();
        var filtered_movies=this.filtered_movies;
        var searched_movie=filtered_movies[keys.search_selection];
        var categories=LiveModel.getCategories(false, true);
        var category_index=0;
        for(var i=0; i<categories.length; i++){
            if(categories[i].category_id==searched_movie.category_id){
                category_index=i;
                break;
            }
        }
        showLoader(true);
        this.is_loading=true;
        var movies=this.categories[category_index].movies;
        if(category_index!==this.current_category_index){
            this.hoverCategory(category_index);
            this.showCategoryChannels();
        }
        var that=this;
        setTimeout(function () {
            for(var i=0;i<movies.length;i++){
                if(movies[i].stream_id==searched_movie.stream_id && movies[i].name===searched_movie.name){
                    that.hoverChannel(i);
                    that.showMovie(movies[i]);
                    // this.showFullScreenInfo();
                    break;
                }
            }
            showLoader(false);
            that.is_loading=false;
        },200)
    },
    changeChannelDomContent:function(targetElement, channel, index){
        $(targetElement).find('.channel-number').text(channel.num);
        $(targetElement).find('.channel-icon').attr('src', channel.stream_icon);
        $(targetElement).data('index',index);
        $(targetElement).find('.channel-name').text(channel.name);
        $(targetElement).data('channel_id',channel.stream_id);
    },
    changeCategoryDomContent:function(targetElement, category, index){
        $(targetElement).find('.channel-category-name').text(category.category_name);
        $(targetElement).data('index',index);
        $(targetElement).find('.channel-category-movie-counts').text(category.movies.length);
    },
    catchUpChannel:function(){
        var movie=this.movies[this.keys.channel_selection];
        var that=this;
        var programmes=[];
        if(settings.playlist_type==='xtreme'){
            showLoader(true);
            this.is_loading=true;
            var format_text='Y-MM-DD HH:mm';
            $.ajax({
                method:'get',
                url:api_host_url+'/player_api.php?username='+user_name+'&password='+password+'&action=get_simple_data_table&stream_id='+movie.stream_id,
                success:function (data) {
                    data.epg_listings.map(function (item) {
                        programmes.push({
                            start:getLocalChannelTime(item.start).format(format_text),
                            stop:getLocalChannelTime(item.end).format(format_text),
                            title:item.title,
                            description:item.description
                        })
                    })
                    if(programmes.length>0){
                        if(!that.is_loading){
                            that.is_loading=false;
                            showLoader(false);
                            return;
                        }
                        that.is_loading=false;
                        showLoader(false);
                        try{
                            media_player.close();
                        }
                        catch(e){
                            console.log(e);
                        }
                        that.full_screen_video=false;
                        // that.zoomInOut();
                        $("#channel-page").hide();
                        catchup_page.init(movie, programmes);
                    }else{
                        showToast("Sorry","No EPG available");
                    }
                },
                error:function (data) {
                    showToast("Sorry","No EPG available");
                }
            });
        }else{
            showToast("Sorry","No EPG available");
        }
    },
    hoverActionBtn:function (index){
        var keys=this.keys;
        keys.focused_part='action_btn_selection';
        keys.action_btn_selection=index;
        $(this.prev_focus_dom).removeClass('active');
        $(this.action_btn_doms[index]).addClass('active');
        this.prev_focus_dom=this.action_btn_doms[index];
    },
    hoverCategory:function(index){
        var keys=this.keys;
        keys.focused_part="category_selection";
        if(typeof index=='number')
            keys.category_selection=index;
        else
            keys.category_selection=$(index).data('index');
        $(this.prev_focus_dom).removeClass('active');
        $(this.category_doms[keys.category_selection]).addClass('active');
        this.prev_focus_dom=this.category_doms[keys.category_selection];
        moveScrollPosition($('#channel-page-categories-container'),this.category_doms[keys.category_selection],'vertical',false);
    },
    hoverChannel:function(index){
        var keys=this.keys;
        keys.focused_part="channel_selection";
        if(typeof index=='number')
            keys.channel_selection=index;
        else
            keys.channel_selection=$(index).data('index');
        $(this.prev_focus_dom).removeClass('active');
        $(this.channel_doms[keys.channel_selection]).addClass('active');
        this.prev_focus_dom=this.channel_doms[keys.channel_selection];
        clearTimeout(this.channel_hover_timer);
        var that=this;
        moveScrollPosition($('#channel-page-menu-container'),this.channel_doms[keys.channel_selection],'vertical',false);
        this.changeFavouriteButton();
        this.channel_hover_timer=setTimeout(function () {
            that.getEpgProgrammes();
        },this.channel_hover_timeout);
    },
    hoverSearchItem:function(index){
        var keys=this.keys;
        keys.search_selection=index;
        $(this.search_items).removeClass('active');
        $(this.search_items[index]).addClass('active');
        moveScrollPosition($('.search-content-container')[0],this.search_items[index],'vertical',false);
    },
    handleMenuClick:function(){
        var keys=this.keys;
        switch (keys.focused_part) {
            case "category_selection":
                var category=this.categories[keys.category_selection];
                var is_adult=checkForAdult(category,'category',[]);
                if(is_adult){
                    parent_confirm_page.init('channel-page');
                    return;
                }
                this.showCategoryChannels();
                break;
            case "video_control":
                $(this.video_control_doms[keys.video_control]).trigger('click');
                break;
            case "full_screen":
                this.full_screen_video=false;
                this.zoomInOut();
                break;
            case "channel_selection":
                var stream_id=this.movies[keys.channel_selection].stream_id;
                if(this.current_channel_id==stream_id){
                    this.full_screen_video=true;
                    this.zoomInOut();
                }
                else
                    this.showMovie(this.movies[keys.channel_selection]);
                break;
            case "search_selection":
                var current_search_element=$('.search-item-wrapper')[keys.search_selection];
                $(current_search_element).trigger('click');
                break;
            case "action_btn_selection":
                if(keys.action_btn_selection==0)
                    this.addOrRemoveFav();
                if(keys.action_btn_selection==1)
                    this.catchUpChannel();
                break;

        }
    },
    handleMenusUpDown:function(increment) {
        var keys=this.keys;
        var menus=this.channel_doms;
        switch (keys.focused_part) {
            case "category_selection":
                keys.category_selection+=increment;
                if(keys.category_selection<0)
                    keys.category_selection=0;
                if(keys.category_selection>=this.category_doms.length)
                    keys.category_selection=this.category_doms.length-1;
                this.hoverCategory(keys.category_selection);
                break;
            case "channel_selection":
                keys.channel_selection+=increment;
                if(keys.channel_selection>=menus.length)
                    keys.channel_selection=menus.length-1;
                if(keys.channel_selection<0)
                    keys.channel_selection=0;
                this.hoverChannel(keys.channel_selection);
                break;
            case "full_screen":
                this.showNextChannel(-1*increment);
                break;
            case "search_selection":
                this.handleSearchItem(increment);
                break;
        }
    },
    handleMenuLeftRight:function(increment) {
        var keys=this.keys;
        switch (keys.focused_part) {
            case "category_selection":
                if(increment>0 && this.movies.length>0)
                    this.hoverChannel(keys.channel_selection);
                break;
            case "channel_selection":
                if(increment<0)
                    this.hoverCategory(keys.category_selection);
                if(increment>0)
                    this.hoverActionBtn(0);
                break;
            case "action_btn_selection":
                keys.action_btn_selection+=increment;
                if(keys.action_btn_selection<0){
                    if(this.movies.length>0)
                        this.hoverChannel(keys.channel_selection);
                    else
                        this.hoverCategory(keys.category_selection);
                    return;
                }
                if(keys.action_btn_selection>=this.action_btn_doms.length)
                    keys.action_btn_selection=this.action_btn_doms.length-1;
                this.hoverActionBtn(keys.action_btn_selection);
                break;
        }
    },
    HandleKey:function(e) {
        if(this.is_loading){
            if(e.keyCode===tvKey.RETURN){
                this.is_loading=false;
                showLoader(false);
            }
            return;
        }

        var keys=this.keys;
        switch (e.keyCode) {
            case tvKey.RIGHT:
                this.handleMenuLeftRight(1)
                break;
            case tvKey.LEFT:
                this.handleMenuLeftRight(-1)
                break;
            case tvKey.DOWN:
                this.handleMenusUpDown(1);
                break;
            case tvKey.UP:
                this.handleMenusUpDown(-1);
                break;
            case tvKey.ENTER:
                this.handleMenuClick();
                break;
            case tvKey.CH_UP:
                if(keys.focused_part==='full_screen')
                    this.showNextChannel(1);
                else if(keys.focused_part==='category_selection' || keys.focused_part==='channel_selection')
                    this.handleMenusUpDown(17);
                break;
            case tvKey.CH_DOWN:
                if(keys.focused_part==='full_screen')
                    this.showNextChannel(-1);
                else if(keys.focused_part==='category_selection' || keys.focused_part==='channel_selection')
                    this.handleMenusUpDown(-17);
                break;
            case tvKey.RETURN:
                this.goBack();
                break;
            case tvKey.YELLOW:
                this.addOrRemoveFav();
                break;
            case tvKey.N1:
                this.goChannelNum(1);
                break;
            case tvKey.N2:
                this.goChannelNum(2);
                break;
            case tvKey.N3:
                this.goChannelNum(3);
                break;
            case tvKey.N4:
                this.goChannelNum(4);
                break;
            case tvKey.N5:
                this.goChannelNum(5);
                break;
            case tvKey.N6:
                this.goChannelNum(6);
                break;
            case tvKey.N7:
                this.goChannelNum(7);
                break;
            case tvKey.N8:
                this.goChannelNum(8);
                break;
            case tvKey.N9:
                this.goChannelNum(9);
                break;
            case tvKey.N0:
                this.goChannelNum(0);
                break;
            case tvKey.PAUSE:
                this.playOrPause();
                break;
            case tvKey.PLAY:
                this.playOrPause();
                break;
            case tvKey.PLAYPAUSE:
                this.playOrPause();
                break;
            case tvKey.BLUE:
                this.Exit();
                goHomePageWithMovieType("movies");
                break;
        }
    }
}