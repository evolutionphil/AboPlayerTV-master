"use strict";
var parent_confirm_page={
    keys:{
        focused_part:"menu_selection", // or, "search part", "slider part", "sub menu part", "search_value"
        menu_selection:0 // the index of selected menu,
    },
    menu_doms:$('.parent-confirm-option'),
    prev_route:'',
    movie:null,
    init:function(prev_route){
        this.prev_route=prev_route;
        current_route='parent-confirm-page';
        $(this.menu_doms[0]).find('input').val('');
        this.hoverMenuItem(0);
        $('#parent-confirm-password-error').hide();
        $('#parent-confirm-modal').modal('show');
    },
    goBack:function(){
        $('#parent-confirm-modal').modal('hide');
        current_route=this.prev_route;
    },
    hoverMenuItem:function(index){
        var keys=this.keys;
        keys.focused_part="menu_selection";
        keys.menu_selection=index;
        $(this.menu_doms).removeClass('active');
        $(this.menu_doms[index]).addClass('active');
    },
    handleMenuClick:function(){
        var keys=this.keys;
        if(keys.focused_part==="menu_selection"){  // if sub menu is not opened yet
            var keys=this.keys;
            switch (keys.menu_selection) {
                case 0:
                    $(this.menu_doms[0]).find('input').val('');
                    $(this.menu_doms[0]).find('input').focus();
                    break;
                case 1:
                    var password=$(this.menu_doms[0]).find('input').val();
                    $('#parent-confirm-password-error').hide();
                    if(password!=parent_account_password){
                        $('#parent-confirm-password-error').text("Password does not match").slideDown();
                        return;
                    }
                    $('#parent-confirm-modal').modal('hide');
                    current_route=this.prev_route;
                    if(this.prev_route==='channel-page'){
                        channel_page.showCategoryChannels();
                    }else if(this.prev_route==='home-page'){
                        home_page.showCategoryContent();
                    }
                    break;
                case 2:
                    this.goBack();
                    break;
            }
        }
    },
    handleMenusUpDown:function(increment) {
        var keys=this.keys;
        if(keys.menu_selection>=1 && increment>0)
            return;
        if(keys.menu_selection>=1 && increment<0)
            keys.menu_selection=0;
        else if(keys.menu_selection==0 && increment>0)
            keys.menu_selection=1;
        this.hoverMenuItem(keys.menu_selection);
    },
    handleMenuLeftRight:function(increment) {
        var keys=this.keys;
        if(keys.focused_part==="menu_selection"){  // if submenu not opened yet
            if(keys.menu_selection>=1){
                keys.menu_selection+=increment;
                if(keys.menu_selection<1)
                    keys.menu_selection=0;
                if(keys.menu_selection>2)
                    keys.menu_selection=2;
                this.hoverMenuItem(keys.menu_selection);
            }
        }
    },
    HandleKey:function(e){
        switch (e.keyCode) {
            case tvKey.RIGHT:
                this.handleMenuLeftRight(1);
                break;
            case tvKey.LEFT:
                this.handleMenuLeftRight(-1);
                break;
            case tvKey.DOWN:
                this.handleMenusUpDown(1)
                break;
            case tvKey.UP:
                this.handleMenusUpDown(-1)
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
