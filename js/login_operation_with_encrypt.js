"use strict";
var login_page={
    is_loading:false,
    keys:{
        focused_part:"main_area",
        main_area:0,
        network_issue_btn:0,
        expired_issue_btn:0,
        no_playlist_btn:0
    },
    login_succeed:false,
    tried_panel_indexes:[],
    network_issue_btns:$('.network-issue-btn'),
    expired_issue_btns:$('.expired-issue-btn'),
    no_playlist_btns:$('.no-playlist-btn'),
    goBack:function(){
        turn_off_page.init('login-page');
    },
    showLoadImage:function(){
        $('#loading-issue-container').hide();
        $('#loading-page').removeClass('hide');
    },
    showLoginError:function(){
        $('.loading-issue-item').addClass('hide');
        $('#loading-issue-container').show();
    },
    showNetworkErrorModal:function(){
        this.showLoginError()
        $('#network-issue-container').removeClass('hide');
        this.hoverNetworkIssueBtn(0);
    },
    reloadApp:function(){
        var that=this;
        $('#loading-issue-container').hide();
        $('.loading-issue-item').addClass('hide');
        setTimeout(function () {
            that.fetchPlaylistInformation();
        },200)
    },
    continueDemoPlaylist:function(){
        var that=this;
        $('#loading-issue-container').hide();
        $('.loading-issue-item').addClass('hide');
        setTimeout(function () {
            that.login();
        },200)
    },
    exit:function(){
        exitApp();
    },
    enterActivationPage:function(){
        activation_page.init('login-page');
    },
    fetchPlaylistInformation:function(){
        if(this.is_loading)
            return;
        this.showLoadImage();
        var that=this;
        this.is_loading=true;
        $('#mac-address').text(mac_address);
        $('.mac-address').text(mac_address);
        var temps=pickPanelUrl(this.tried_panel_indexes);
        var url=temps[1],url_index=temps[0];
        var version=platform==='samsung' ? samsung_version : lg_version;
        var data={
            mac_address:mac_address,
            app_type:platform,
            version:version
        }
        var encrypted_data=encryptRequest(data);
        console.log(encrypted_data);
        $.ajax({
            url: url+"/device_info",
            type: "POST",
            data:{
                data:reverseString(encrypted_data)
            },
            success: function (data1) {
                var data=decryptResponse(data1);
                localStorage.setItem(storage_id+'api_data',JSON.stringify(data));
                that.loadApp(data);
            },
            error: function (error) {
                var api_data=localStorage.getItem(storage_id+'api_data');
                if(api_data){
                    api_data=JSON.parse(api_data);
                    that.loadApp(api_data);
                }else{
                    that.is_loading=false;
                    if(that.tried_panel_indexes.length<panel_urls.length){
                        that.tried_panel_indexes.push(url_index);
                        that.fetchPlaylistInformation();
                    }
                    else{
                        that.showNetworkErrorModal();
                    }
                }
            }
        });
    },
    loadApp:function(data){
        var today=moment().format('Y-MM-DD');
        saveData('playlist_urls',data.urls);
        saveData('notification',data.notification);
        $('.device-key').text(data.device_key);
        $('.loading-page-device-info-container').slideDown();
        saveData('languages',data.languages)
        saveData('device_key', data.device_key);
        saveData('expire_date',data.expire_date);
        saveData('is_trial',data.is_trial);
        saveData('reseller_id',data.reseller_id);
        saveData('real_time_notification',data.real_time_notification);
        saveData('notification_interval',data.notification_interval);
        if(is_trial==2) // if already activated
            $(playlist_page.activation_btn).hide();
        if(data.logo)
            $('.app-logo').attr('src',data.logo);
        this.is_loading=false;
        $('.expire-date').text(expire_date);
        // if(!data.mac_registered){
        //
        // }
        // else{
            if(data.expire_date<today){
                saveData('mac_valid',false);
                this.showLoginError()
                $('#expired-issue-container').removeClass('hide');
                this.hoverExpiredIssueBtn(0);
            }
            else{
                if(data.has_own_playlist){
                    if(data.reseller_notification)
                        $('#reseller-notification').text(data.reseller_notification).show();
                    this.login();
                }else{
                    this.showLoginError()
                    $('#no-playlist-issue-container').removeClass('hide');
                    this.hoverNoPlaylistBtn(0);
                }
            }
        // }
    },
    getPlayListDetail:function(){
        var that=this;
        // mac_address='fc:03:9f:93:03:d0';
        mac_address='52:54:00:12:34:58';
        if(platform==='samsung'){
            try{
                tizen.systeminfo.getPropertyValue('ETHERNET_NETWORK',function(data){
                    if(data!==undefined){
                        if(typeof data.macAddress!='undefined'){
                            mac_address=data.macAddress;
                            that.fetchPlaylistInformation();
                        }
                        else{
                            that.fetchPlaylistInformation();
                        }
                    }
                    else{
                        that.fetchPlaylistInformation();
                    }
                })
            }catch (e) {
                this.fetchPlaylistInformation();
            }
        }
        else if(platform==='lg'){
            webOS.service.request("luna://com.webos.service.sm", {
                method: "deviceid/getIDs",
                parameters: {
                    "idType": ["LGUDID"]
                },
                onSuccess: function (inResponse) {
                    mac_address = "";
                    var temp = inResponse.idList[0].idValue.replace(/['-]+/g, '');
                    for (var i = 0; i <= 5; i++) {
                        mac_address += temp.substr(i * 2, 2);
                        if (i < 5)
                            mac_address += ":";
                    }
                    that.fetchPlaylistInformation();
                },
                onFailure: function (inError) {
                    that.fetchPlaylistInformation();
                }
            });
        }
    },
    login:function(){
        this.showLoadImage();;
        var playlist_id=settings.playlist_id;
        var playlist_index=0;
        for(var i=0;i<playlist_urls.length;i++){
            if(playlist_urls[i].id==playlist_id){
                playlist_index=i;
                break;
            }
        }
        settings.saveSettings('playlist',playlist_urls[playlist_index],'array')
        settings.saveSettings('playlist_id',playlist_urls[playlist_index].id,'');
        parseM3uUrl();
        this.proceed_login();
    },
    goToPlaylistPageWithError:function(){
        this.is_loading=false;
        LiveModel.insertMoviesToCategories([])
        VodModel.insertMoviesToCategories([]);
        SeriesModel.insertMoviesToCategories([]);
        $('#loading-page').addClass('hide');
        $('#playlist-error').show();
        home_page.init();
        home_page.hoverMainMenu(3);
        home_page.handleMenuClick();
        $('#home-expire-date').text('Unknown');
    },
    proceed_login:function(){
        if(this.is_loading)
            return;
        $('#playlist-error').hide();
        LiveModel.init();
        VodModel.init();
        SeriesModel.init();
        var that=this;
        var playlist_type=settings.playlist_type;
        this.is_loading=true;
        if(playlist_type==='xtreme'){
            var  prefix_url=api_host_url+'/player_api.php?username='+user_name+'&password='+password+'&action=';
            var login_url=prefix_url.replace("&action=","");
            $.ajax({
                method:'get',
                url:login_url,
                success:function (data) {
                    if(typeof  data.server_info!="undefined")
                        calculateTimeDifference(data.server_info.time_now,data.server_info.timestamp_now)
                    if(typeof  data.user_info!="undefined"){
                        if(data.user_info.auth==0 || (typeof data.user_info.status!='undefined' && (data.user_info.status==='Expired' || data.user_info.status==='Banned'))){
                            that.is_loading=false;
                            that.goToPlaylistPageWithError();
                        }
                        else{
                            if(data.user_info.exp_date==null)
                                $('.expire-date').text('Unlimited');
                            else{
                                var exp_date_obj=moment(data.user_info.exp_date*1000);
                                $('.expire-date').text(exp_date_obj.format('Y-MM-DD'));
                            }
                            $.when(
                                $.ajax({
                                    method:'get',
                                    url:prefix_url+'get_live_streams',
                                    success:function (data) {
                                        LiveModel.setMovies(data);
                                    }
                                }),
                                // setTimeout(function () {
                                    $.ajax({
                                        method:'get',
                                        url:prefix_url+'get_live_categories',
                                        success:function (data) {
                                            LiveModel.setCategories(data);
                                        }
                                    }),
                                // },300),
                                // setTimeout(function () {
                                    $.ajax({
                                        method:'get',
                                        url:prefix_url+'get_vod_categories',
                                        success:function (data) {
                                            VodModel.setCategories(data);
                                        }
                                    }),
                                // },600),
                                // setTimeout(function () {
                                    $.ajax({
                                        method:'get',
                                        url:prefix_url+'get_series_categories',
                                        success:function (data) {
                                            SeriesModel.setCategories(data);
                                        }
                                    }),
                                // },900),
                                // setTimeout(function () {
                                    $.ajax({
                                        method:'get',
                                        url:prefix_url+'get_vod_streams',
                                        success:function (data) {
                                            VodModel.setMovies(data);
                                        }
                                    }),
                                // },1200),
                                // setTimeout(function () {
                                    $.ajax({
                                        method:'get',
                                        url:prefix_url+'get_series',
                                        success:function (data) {
                                            SeriesModel.setMovies(data);
                                        }
                                    })
                                // },1500)
                            ).
                            then(function(){
                                try{
                                    LiveModel.insertMoviesToCategories();
                                    VodModel.insertMoviesToCategories();
                                    SeriesModel.insertMoviesToCategories();
                                    that.is_loading=false;
                                    home_page.init();
                                }catch (e) {
                                    that.goToPlaylistPageWithError();
                                }
                            }).fail(function () {
                                that.goToPlaylistPageWithError();
                            })
                        }
                    }
                },
                error:function(error){
                    that.goToPlaylistPageWithError();
                },
                timeout: 15000
            })
        }
        else{
            api_host_url=settings.playlist.url;
            $.ajax({
                method:'get',
                url:api_host_url,
                timeout:240000,
                success:function (data) {
                    parseM3uResponse('type1',data);
                   $('#loading-page').addClass('hide');
                    home_page.init();
                    that.is_loading=false;
                },
                error:function(error){
                    that.goToPlaylistPageWithError();
                }
            })
        }
    },
    hoverNetworkIssueBtn:function(index){
        var keys=this.keys;
        keys.focused_part='network_issue_btn';
        keys.network_issue_btn=index;
        $(this.network_issue_btns).removeClass('active');
        $(this.network_issue_btns[index]).addClass('active');
    },
    hoverExpiredIssueBtn:function(index){
        var keys=this.keys;
        keys.focused_part='expired_issue_btn';
        keys.expired_issue_btn=index;
        $(this.expired_issue_btns).removeClass('active');
        $(this.expired_issue_btns[index]).addClass('active');
    },
    hoverNoPlaylistBtn:function(index){
        var keys=this.keys;
        keys.focused_part='no_playlist_btn';
        keys.no_playlist_btn=index;
        $(this.no_playlist_btns).removeClass('active');
        $(this.no_playlist_btns[index]).addClass('active');
    },
    handleMenuClick:function(){
        var keys=this.keys;
        switch (keys.focused_part) {
            case "network_issue_btn":
                $(this.network_issue_btns[keys.network_issue_btn]).trigger('click');
                break;
            case "no_playlist_btn":
                $(this.no_playlist_btns[keys.no_playlist_btn]).trigger('click');
                break;
            case "expired_issue_btn":
                $(this.expired_issue_btns[keys.expired_issue_btn]).trigger('click');
                break;
        }
    },
    handleMenuUpDown:function(increment){
        var keys=this.keys;
        if(keys.focused_part==="main_area"){
            keys.main_area+=increment;
            var elements=[$('#login-button')];
            elements.map(function(element){
                $(element).removeClass('active');
            })
            if(keys.main_area<0)
                keys.main_area=elements.length-1;
            if(keys.main_area>=elements.length)
                keys.main_area=0;
            $(elements[keys.main_area]).addClass('active');
        }
    },
    handleMenuLeftRight:function(increment){
        var keys=this.keys;
        switch (keys.focused_part) {
            case "network_issue_btn":
                keys.network_issue_btn+=increment;
                if(keys.network_issue_btn<0)
                    keys.network_issue_btn=0;
                if(keys.network_issue_btn>=this.network_issue_btns.length)
                    keys.network_issue_btn=this.network_issue_btns.length-1;
                this.hoverNetworkIssueBtn(keys.network_issue_btn);
                break;
            case "expired_issue_btn":
                keys.expired_issue_btn+=increment;
                if(keys.expired_issue_btn<0)
                    keys.expired_issue_btn=0;
                if(keys.expired_issue_btn>2)
                    keys.expired_issue_btn=2;
                this.hoverExpiredIssueBtn(keys.expired_issue_btn);
                break;
            case "no_playlist_btn":
                keys.no_playlist_btn+=increment;
                if(keys.no_playlist_btn<0)
                    keys.no_playlist_btn=0;
                if(keys.no_playlist_btn>1)
                    keys.no_playlist_btn=1;
                this.hoverNoPlaylistBtn(keys.no_playlist_btn);
                break;
        }
    },
    HandleKey:function(e) {
        if(e.keyCode===tvKey.RETURN){
            this.goBack();
            return;
        }
        if(this.is_loading)
            return;
        switch(e.keyCode){
            case tvKey.DOWN:
                this.handleMenuUpDown(1);
                break;
            case tvKey.UP:
                this.handleMenuUpDown(-1);
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
                this.goBack();
                break;
        }
    }
}