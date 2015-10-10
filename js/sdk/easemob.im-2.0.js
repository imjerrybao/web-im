/**************************************************************************
***                             Easemob WebIm Js SDK                    ***
***                             v2.0                                    ***
**************************************************************************/
/*
    Module1:    工具类，开放给开发者 
    Module2:    Message
    Module3:    Connection
*/
//audio, picture, receipts, location, vedio, file
;(function(window, undefined) {

    if(typeof Strophe == 'undefined'){
        throw 'need Strophe';
    }

    var Easemob = Easemob || {};
    Easemob.im = Easemob.im || {};
    Easemob.im.version="2.0";



    /*
        Module1:    工具类，开放给开发者 
    */
    var Utils = (function() {
        
        var _createStandardXHR = function() {
            try {
                return new window.XMLHttpRequest();
            } catch( e ) {
                return false;
            }
        }
        
        var _createActiveXHR = function() {
            try {
                return new window.ActiveXObject( "Microsoft.XMLHTTP" );
            } catch( e ) {
                return false;
            }
        }

        if (window.XDomainRequest) {
            XDomainRequest.prototype.oldsend = XDomainRequest.prototype.send;
            XDomainRequest.prototype.send = function() {
                XDomainRequest.prototype.oldsend.apply(this, arguments);
                this.readyState = 2;
            };
        }

        Strophe.Request.prototype._newXHR = function(){
            var xhr =  Utils.xmlrequest(true);
            if (xhr.overrideMimeType) {
                xhr.overrideMimeType("text/xml");
            }
            xhr.onreadystatechange = this.func.bind(null, this);
            return xhr;
        }
       
        return {
            hasFormData: typeof FormData != 'undefined'
            , hasBlob: typeof Blob != 'undefined'

            , isCanSetRequestHeader: function() {
                return Utils.xmlrequest().setRequestHeader || false;
            }

            , hasOverrideMimeType: function() {
                return Utils.xmlrequest().overrideMimeType || false;
            }

            , isCanUploadFileAsync: function() {
                return Utils.isCanSetRequestHeader() && Utils.hasFormData;
            }

            , isCanUploadFile: function() {
                return Utils.isCanUploadFileAsync() || Utils.hasFlash();
            }

            , isCanDownLoadFile: function() {
                return Utils.isCanSetRequestHeader() && (Utils.hasBlob || Utils.hasOverrideMimeType());
            }

            , stringify: function(json) {
                if(JSON.stringify) {
                    return JSON.stringify(json);
                } else {
                    var s = '',
                        arr = [];

                    var iterate = function(json) {
                        var isArr = false;

                        if(Object.prototype.toString.call(json) == '[object Array]') {
                            arr.push(']', '[');
                            isArr = true;
                        } else if(Object.prototype.toString.call(json) == '[object Object]') {
                            arr.push('}', '{');
                        }

                        for(var o in json) {
                            if(Object.prototype.toString.call(json[o]) == '[object Null]') {
                                json[o] = 'null';
                            } else if(Object.prototype.toString.call(json[o]) == '[object Undefined]') {
                                json[o] = 'undefined';
                            }

                            if(json[o] && typeof json[o] == 'object') {
                                s += ',' + (isArr ? '' : '"' + o + '":' + (isArr ? '"' : '')) + iterate(json[o]) + '';
                            } else {
                                s += ',"' + (isArr ? '' : o + '":"') + json[o] + '"';
                            }
                        }
                
                        if(s != "") {
                            s = s.slice(1);
                        }

                        return arr.pop() + s + arr.pop();
                    }
                    return iterate(json);
                }
            }

            , registerUserFn: function(options) {
                var orgName = options.orgName || '';
                var appName = options.appName || '';
                var appKey = options.appKey || '';
                if(!orgName && !appName && appKey){
                    var devInfos = appKey.split('#');
                    if(devInfos.length==2){
                        orgName = devInfos[0];
                        appName = devInfos[1];
                    }
                }
                if(!orgName && !appName){
                    options.error({
                        type: EASEMOB_IM_RESISTERUSER_ERROR
                        , msg: '没有指定开发者信息'
                    });
                    return;
                }

                var url = options.https ? 'https://a1.easemob.com' : 'http://a1.easemob.com';
                var apiUrl = options.apiUrl || url;
                var restUrl = apiUrl + '/' + orgName + '/' + appName + '/users';

                var userjson = {
                        username: options.username
                        , password: options.password
                        , nickname: options.nickname || ''
                };

                var userinfo = JSON.stringify(userjson);
                var options = {
                    url: restUrl
                    , dataType: 'json'
                    , data: userinfo
                    , success: options.success || EMPTYFN
                    , error: options.error || EMPTYFN
                };
                return Utils.ajax(options);
            }
            , login2UserGrid: function(options) {
                options = options || {};

                var appKey = options.appKey || '';
                var devInfos = appKey.split('#');
                if(devInfos.length!=2){
                    error({
                        type: EASEMOB_IM_CONNCTION_OPEN_USERGRID_ERROR
                        , msg: '请指定正确的开发者信息(appKey)'
                    });
                    return false;
                }
                var orgName = devInfos[0];
                var appName = devInfos[1];
                if(!orgName){
                    error({
                        type: EASEMOB_IM_CONNCTION_OPEN_USERGRID_ERROR
                        , msg: '请指定正确的开发者信息(appKey)'
                    });
                    return false;
                }
                if(!appName){
                    error({
                        type: EASEMOB_IM_CONNCTION_OPEN_USERGRID_ERROR
                        , msg: '请指定正确的开发者信息(appKey)'
                    });
                    return false;
                }
                var suc = options.success || EMPTYFN;
                var error = options.error || EMPTYFN;
                var user = options.user || '';
                var pwd = options.pwd || '';

                var https = options.https;
                var url = https ? 'https://a1.easemob.com' : 'http://a1.easemob.com';
                var apiUrl = options.apiUrl || url;

                var loginJson = {
                    grant_type: 'password'
                    , username: user
                    , password: pwd
                };
                var loginfo = JSON.stringify(loginJson);

                var options = {
                    url: apiUrl + "/" + orgName + "/" + appName + "/token"
                    , dataType: 'json'
                    , data: loginfo
                    , success: suc || EMPTYFN
                    , error: error || EMPTYFN
                };
                return Utils.ajax(options);
            }
            , getFileUrl: function(fileInputId) {
                var uri = {
                    url: ''
                    , filename: ''
                    , filetype: ''
                };

                if(!Utils.isCanUploadFileAsync()) return uri;
                var wu = window.URL || window.webkitURL || window.mozURL || window.msURL;
                if (wu && wu.createObjectURL) {
                    var fileItems = document.getElementById(fileInputId).files;
                    if (fileItems.length > 0) {
                        var u = fileItems.item(0);
                        uri.url = wu.createObjectURL(u);
                        uri.filename = u.name || '';
                    }
                } else { // IE
                    var u = document.getElementById(fileInputId).value;
                    uri.url = u;
                    var pos1 = u.lastIndexOf('/');
                    var pos2 = u.lastIndexOf('\\');
                    var pos = Math.max(pos1, pos2)
                    if (pos < 0)
                        uri.filename = u;
                    else
                        uri.filename = u.substring(pos + 1);
                }
                var index = uri.filename.lastIndexOf(".");
                if (index != -1) {
                    uri.filetype = uri.filename.substring(index+1).toLowerCase();
                }
                return uri;
            }

            , getFileSizeFn: function(fileInputId) {
                var file = document.getElementById(fileInputId)
                var fileSize = 0;
                if(file){
                    if(file.files){
                        if(file.files.length>0){
                            fileSize = file.files[0].size;
                        }
                    } else if(file.select && 'ActiveXObject' in window) {
                        file.select();
                        var fileobject = new ActiveXObject ("Scripting.FileSystemObject");
                        var file = fileobject.GetFile (file.value);
                        fileSize = file.Size;
                    }
                }
                return fileSize;
            }

            , hasFlash: (function() {
                if ('ActiveXObject' in window) {
                    try {
                        return new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
                    } catch (ex) {
                        return 0;
                    }
                } else {
                    if (navigator.plugins && navigator.plugins.length > 0) {
                        return navigator.plugins["Shockwave Flash"];
                    }
                }
                return 0;
            }())

            , trim: function(str) {

                str = typeof str === 'string' ? str : '';

                return str.trim
                    ? str.trim()
                    : str.replace(/^\s|\s$/g, '');
            }

            , parseJSON: function(data) {

                if (window.JSON && window.JSON.parse) {
                    return window.JSON.parse(data + "");
                }

                var requireNonComma,
                    depth = null,
                    str = Utils.trim(data + "");

                return str && !Utils.trim(
                    str.replace(/(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g
                    , function( token, comma, open, close ) {

                        if ( requireNonComma && comma ) {
                            depth = 0;
                        }

                        if ( depth === 0 ) {
                            return token;
                        }

                        requireNonComma = open || comma;
                        depth += !close - !open;
                        return "";
                    })
                )
                ? (Function("return " + str))()
                : (Function("Invalid JSON: " + data))();
            }
            
            , parseUploadResponse: function(response) {
                return response.indexOf('callback') > -1 ? //lte ie9
                    response.slice(9, -1) : response;
            }
            
            , parseDownloadResponse: function(response) {
                return ((response && response.type && response.type === 'application/json') 
                    || 0 > Object.prototype.toString.call(response).indexOf('Blob')) ? 
                        this.url+'?token=' : window.URL.createObjectURL(response);
            }
            , uploadFile: function(options) {
                options = options || {};
                options.onFileUploadProgress = options.onFileUploadProgress || EMPTYFN;
                options.onFileUploadComplete = options.onFileUploadComplete || EMPTYFN;
                options.onFileUploadError = options.onFileUploadError || EMPTYFN;
                options.onFileUploadCanceled = options.onFileUploadCanceled || EMPTYFN;
                var acc = options.accessToken || this.context.accessToken;
                if (!acc) {
                    options.onFileUploadError({
                        type: EASEMOB_IM_UPLOADFILE_NO_LOGIN
                        , msg: '用户未登录到usergrid服务器,无法使用文件上传功能'
                    });
                    return;
                }

                orgName = options.orgName || this.context.orgName || '';
                appName = options.appName || this.context.appName || '';
                appKey = options.appKey || this.context.appKey || '';
                if(!orgName && !appName && appKey){
                    var devInfos = appKey.split('#');
                    if(devInfos.length==2){
                        orgName = devInfos[0];
                        appName = devInfos[1];
                    }
                }
                if(!orgName && !appName){
                    options.onFileUploadError({
                        type: EASEMOB_IM_UPLOADFILE_ERROR
                        , msg: '没有指定开发者信息'
                    });
                    return;
                }
                var apiUrl = options.apiUrl || 'http://a1.easemob.com';
                var uploadUrl = apiUrl + '/' + orgName + '/' + appName + '/chatfiles';
                if (!Utils.isCanUploadFileAsync()) {
                    this.onError({
                        type: EASEMOB_IM_UPLOADFILE_BROWSER_ERROR
                        , msg: '当前浏览器不支持异步上传！'
                    });
                    return;
                }

                
                var fileSize = Utils.getFileSizeFn(options.fileInputId);
                if(fileSize > EASEMOB_IM_FILESIZE_LIMIT){
                    options.onFileUploadError({
                        type: EASEMOB_IM_UPLOADFILE_ERROR
                        , msg: '上传文件超过服务器大小限制（10M）'
                    });
                    return ;
                }else if(fileSize <= 0){
                    options.onFileUploadError({
                        type: EASEMOB_IM_UPLOADFILE_ERROR
                        , msg: '上传文件大小为0'
                    });
                    return ;
                }

                var xhr = Utils.xmlrequest();
                var onError = function(e) {
                    options.onFileUploadError({
                        type: EASEMOB_IM_UPLOADFILE_ERROR
                        , msg: '上传文件失败'
                        , xhr: xhr
                    });
                }
                if(xhr.upload){
                    xhr.upload.addEventListener("progress",options.onFileUploadProgress, false);
                }
                if(xhr.addEventListener){
                    xhr.addEventListener("abort", options.onFileUploadCanceled, false);
                    xhr.addEventListener("load", function(e) {
                        try{
                            var json = Utils.parseJSON(xhr.responseText);
                            options.onFileUploadComplete(json);
                        } catch(e){
                            options.onFileUploadError({
                                type: EASEMOB_IM_UPLOADFILE_ERROR
                                , msg: '上传文件失败,服务端返回值值不正确'
                                , data: xhr.responseText
                                , xhr: xhr
                            });
                        }
                    }, false);
                    xhr.addEventListener("error", onError, false);
                } else if(xhr.onreadystatechange){
                    xhr.onreadystatechange = function (){
                        if( xhr.readyState === 4){
                            if (ajax.status == 200) {
                                try{
                                    var json = Utils.parseJSON(xhr.responseText);
                                    options.onFileUploadComplete(json);
                                } catch(e){
                                    options.onFileUploadError({
                                        type: EASEMOB_IM_UPLOADFILE_ERROR
                                        , msg: '上传文件失败,服务端返回值不正确'
                                        , data: xhr.responseText
                                        , xhr: xhr
                                    });
                                }
                            } else {
                                    options.onFileUploadError({
                                        type: EASEMOB_IM_UPLOADFILE_ERROR
                                        , msg: '上传文件失败,服务端返回异常'
                                        , data: xhr.responseText
                                        , xhr: xhr
                                    });
                            }
                        } else {
                            xhr.abort();
                            options.onFileUploadCanceled();
                        }
                    }
                }

                xhr.open("POST", uploadUrl);

                xhr.setRequestHeader('restrict-access', 'true');
                xhr.setRequestHeader('Accept', '*/*');//android qq browser has some problem at this attr
                xhr.setRequestHeader('Authorization', 'Bearer ' + acc);

                var localFile = '';
                var fileInput = document.getElementById(options.fileInputId);
                var localFile = null;
                if ("files" in fileInput) {
                    localFile = fileInput.files[0];
                } else {
                    localFile = fileInput.value;
                }
                var formData = new FormData();
                formData.append("file", localFile);
                xhr.send(formData);
            }

            , downloadFn: function(options) {
                options.onFileDownloadComplete = options.onFileDownloadComplete || EMPTYFN;
                options.onFileDownloadError = options.onFileDownloadError || EMPTYFN;
                
                var accessToken = options.accessToken || '';
                if (!accessToken) {
                    options.onFileDownloadError({
                        type: EASEMOB_IM_DOWNLOADFILE_NO_LOGIN
                        , msg: '用户未登录到usergrid服务器,无法使用文件下载功能'
                    });
                    return;
                }

                var onError = function(e) {
                    options.onFileDownloadError({
                        type: EASEMOB_IM_DOWNLOADFILE_ERROR
                        , msg: '下载文件失败'
                        , xhr: xhr
                    });
                }
                if (!Utils.isCanDownLoadFile()) {
                    options.onFileDownloadComplete();
                    return;
                }
                var xhr = Utils.xmlrequest();
                if("addEventListener" in xhr){
                    xhr.addEventListener("load", function(e) {
                        options.onFileDownloadComplete(xhr.response,xhr);
                    }, false);
                    xhr.addEventListener("error", onError, false);
                } else if("onreadystatechange" in xhr){
                    xhr.onreadystatechange = function (){
                        if( xhr.readyState === 4){
                            if (ajax.status == 200) {
                                options.onFileDownloadComplete(xhr.response,xhr);
                            } else {
                                    options.onFileDownloadError({
                                        type: EASEMOB_IM_DOWNLOADFILE_ERROR
                                        , msg: '下载文件失败,服务端返回异常'
                                        , xhr: xhr
                                    });
                            }
                        } else {
                            xhr.abort();
                            options.onFileDownloadError({
                                type: EASEMOB_IM_DOWNLOADFILE_ERROR
                                , msg: '错误的下载状态,退出下载'
                                , xhr: xhr
                            });
                        }
                    }
                }

                var method = options.method || 'GET';
                var resType = options.responseType || 'blob';
                var mimeType = options.mimeType || "text/plain; charset=x-user-defined";
                xhr.open(method, options.url);
                if(typeof Blob != 'undefined'){
                    xhr.responseType = resType;
                } else {
                    xhr.overrideMimeType(mimeType);
                }

                var innerHeaer = {
                    'X-Requested-With': 'XMLHttpRequest'
                    , 'Accept': 'application/octet-stream'
                    , 'share-secret': options.secret
                    , 'Authorization': 'Bearer ' + accessToken
                };
                var headers = options.headers || {};
                for(var key in headers){
                    innerHeaer[key] = headers[key];
                }
                for(var key in innerHeaer){
                    if(innerHeaer[key]){
                        xhr.setRequestHeader(key, innerHeaer[key]);
                    }
                }
                xhr.send(null);
            }

            , parseTextMessageFn: function(message) {
                if(typeof(message) != 'string'){
                    conn.onError({
                        type: EASEMOB_IM_MESSAGE_REC_TEXT_ERROR
                        , msg: '不合法的消息内容格式，请检查发送消息内容！'
                    });
                    return;
                }
                var receiveMsg = message;
                var emessage = [];
                var expr = /\[[^[\]]{2,3}\]/mg;
                var emotions = receiveMsg.match(expr);
                if (!emotions || emotions.length < 1){
                    return {"isemotion": false, "body": [{"type": "txt", "data": message}]};
                }
                var isemotion = false;
                for (var i = 0; i < emotions.length; i++) {
                    var tmsg = receiveMsg.substring(0,receiveMsg.indexOf(emotions[i]));
                    if (tmsg) {
                        emessage.push({
                            type: "txt"
                            , data: tmsg
                        });
                    }
                    var emotion = emotionPicData[emotions[i]];
                    if (emotion) {
                        isemotion = true;
                        emessage.push({
                            type: 'emotion'
                            , data: emotion
                        });
                    } else {
                        emessage.push({
                            type: 'txt'
                            , data: emotions[i]
                        });
                    }
                    var restMsgIndex = receiveMsg.indexOf(emotions[i]) + emotions[i].length;
                    receiveMsg = receiveMsg.substring(restMsgIndex);
                }
                if (receiveMsg) {
                    emessage.push({
                        type: 'txt'
                        , data: receiveMsg
                    });
                }
                if(isemotion){
                    return {"isemotion":isemotion,"body":emessage};
                }
                return {"isemotion": false, "body": [{"type": "txt", "data": message}]};
            }

            , xmlrequest: function (crossDomain) {
                crossDomain = crossDomain || true;
                var temp = _createStandardXHR () || _createActiveXHR();

                if ("withCredentials" in temp) {
                    return temp;
                }
                if(!crossDomain){
                    return temp;
                }
                if(window.XDomainRequest===undefined){
                    return temp;
                }
                var xhr = new XDomainRequest();
                xhr.readyState = 0;
                xhr.status = 100;
                xhr.onreadystatechange = EMPTYFN;
                xhr.onload = function () {
                    xhr.readyState = 4;
                    xhr.status = 200;

                    var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                    xmlDoc.async = "false";
                    xmlDoc.loadXML(xhr.responseText);
                    xhr.responseXML = xmlDoc;
                    xhr.response = xhr.responseText;
                    xhr.onreadystatechange();
                };
                xhr.ontimeout = xhr.onerror = function(){
                    xhr.readyState = 4;
                    xhr.status = 500;
                    xhr.onreadystatechange();
                };
                return xhr;
            }

            , ajax: function(options) {
                var dataType = options.dataType || 'text';
                var suc = options.success || EMPTYFN;
                var error = options.error || EMPTYFN;
                var xhr = Utils.xmlrequest();
                xhr.onreadystatechange = function (){
                    if( xhr.readyState === 4){
                        var status = xhr.status || 0;
                        if (status == 200) {
                            if(dataType=='text'){
                                suc(xhr.responseText,xhr);
                                return;
                            }
                            if(dataType=='json'){
                                try{
                                    var json = Utils.parseJSON(xhr.responseText);
                                    suc(json,xhr);
                                } catch(e){
                                    error(xhr.responseText,xhr,"错误的数据,无法转换为json");
                                }
                                return;
                            }
                            if(dataType=='xml'){
                                if (xhr.responseXML && xhr.responseXML.documentElement) {
                                    suc(xhr.responseXML.documentElement,xhr);
                                } else {
                                    error(xhr.responseText,xhr,"浏览器不支持ajax返回xml对象");
                                }
                                return;
                            }
                            suc(xhr.response || xhr.responseText,xhr);
                            return;
                        } else {
                            if(dataType=='json'){
                                try{
                                    var json = Utils.parseJSON(xhr.responseText);
                                    error(json,xhr,"服务器返回错误信息");
                                } catch(e){
                                    error(xhr.responseText,xhr,"服务器返回错误信息");
                                }
                                return;
                            }
                            if(dataType=='xml'){
                                if (xhr.responseXML && xhr.responseXML.documentElement) {
                                    error(xhr.responseXML.documentElement,xhr,"服务器返回错误信息");
                                } else {
                                    error(xhr.responseText,xhr,"服务器返回错误信息");
                                }
                                return;
                            }
                            error(xhr.responseText,xhr,"服务器返回错误信息");
                            return;
                        }
                    }
                    if( xhr.readyState === 0){
                        error(xhr.responseText,xhr,"服务器异常");
                    }
                };

                if(options.responseType){
                    if(xhr.responseType){
                        xhr.responseType = options.responseType;
                    } else {
                        error('',xhr,"当前浏览器不支持设置响应类型");
                        return null;
                    }
                }
                if(options.mimeType){
                    if(Utils.hasOverrideMimeType()){
                        xhr.overrideMimeType(options.mimeType);
                    } else {
                        error('',xhr,"当前浏览器不支持设置mimeType");
                        return null;
                    }
                }

                var type = options.type || "POST";
                xhr.open(type, options.url);

                var headers = options.headers || {};
                for(var key in headers){
                    if(Utils.isCanSetRequestHeader()){
                        xhr.setRequestHeader(key, headers[key]);
                    } else {
                        error('',xhr,"当前浏览器不支持设置header");
                        return null;
                    }
                }

                var data = options.data || null;
                xhr.send(data);
                return xhr;
            }
        };
    }());



    /*
        Module2:    Message
    */
    var _msgHash = {};
    var Message = function(message, conn) {

        if(!(this instanceof Message)) {
            return new Message(message, conn);
        }
        
        var me = this;
        me.msg = message;

        var _send = function(message) {
            var json = {
                from: conn.context.userId || ''
                , to: message.to
                , bodies: [message.body]
                , ext: message.ext || {}
            };
            
            var jsonstr = JSON.stringify(json);
            var dom = $msg({
                type: message.type || 'chat'
                , to: message.toJid
                , id: message.id
                , xmlns: "jabber:client"
            }).c("body").t(jsonstr);
            conn.sendCommand(dom.tree());
        }



        if(me.msg.filename) {
            var _tmpComplete = me.msg.onFileUploadComplete;
            var _complete = function(data) {

                if(data.entities[0]['file-metadata']){
                    var file_len = data.entities[0]['file-metadata']['content-length'];
                    me.msg.file_length = file_len;
                    me.msg.filetype = data.entities[0]['file-metadata']['content-type']
                    if (file_len > 204800) {
                        me.msg.thumbnail = true;
                    }
                }
                
                me.msg.body = {
                    type: me.msg.ext.messageType || 'file'
                    , url: data.uri + '/' + data.entities[0]['uuid']
                    , secret: data.entities[0]['share-secret']
                    , filename: me.msg.filename
                    , thumb: data.uri + '/' + data.entities[0].uuid
                    , thumb_secret: ''
                    , size: {
                        width: me.msg.width
                        , height: me.msg.height
                    }
                    , file_length: me.msg.file_length
                    , filetype: me.msg.filetype
                }

                _send(me.msg);
                _tmpComplete instanceof Function && _tmpComplete(data);
            };

            me.msg.onFileUploadComplete = _complete;

            Utils.uploadFile.call(conn, me.msg);
        } else {
            me.msg.body = {
                type: "txt"
                , msg: me.msg.msg 
            };
            _send(me.msg);
        }
    }
        
    

    /*
        Module3: Connection
    */
    var Connection = (function() {

        var _parseRoomFn = function(result) {
            var rooms = [];
            var items = result.getElementsByTagName("item");
            if(items){
                for(var i=0;i<items.length;i++){
                    var item = items[i];
                    var roomJid = item.getAttribute('jid');
                    var tmp = roomJid.split("@")[0];
                    var room = {
                        jid: roomJid
                        , name: item.getAttribute('name')
                        , roomId: tmp.split('_')[1]
                    };
                    rooms.push(room);
                }
            }
            return rooms;
        }
            
        var _parseRoomOccupantsFn = function(result) {
            var occupants = [];
            var items = result.getElementsByTagName("item");
            if(items){
                for(var i=0;i<items.length;i++){
                    var item = items[i];
                    var room = {
                        jid: item.getAttribute('jid')
                        , name: item.getAttribute('name')
                    };
                    occupants.push(room);
                }
            }
            return occupants;
        }

        var _parseResponseMessageFn = function(msginfo) {
            var parseMsgData = {errorMsg:true,data:[]};

            var msgBodies = msginfo.getElementsByTagName("body");
            if(msgBodies){
                for (var i=0;i<msgBodies.length;i++){
                    var msgBody = msgBodies[i];
                    var childNodes = msgBody.childNodes;
                    if(childNodes && childNodes.length>0){
                        var childNode = msgBody.childNodes[0];
                        if(childNode.nodeType==Strophe.ElementType.TEXT){
                            var jsondata = childNode.wholeText ||childNode.nodeValue;
                            jsondata = jsondata.replace('\n','<br>');
                            try{
                                var data = eval("("+jsondata+")");
                                parseMsgData.errorMsg = false;
                                parseMsgData.data = [data];
                            }catch(e){
                            }
                        }
                    }
                }
                var delayTags = msginfo.getElementsByTagName("delay");
                if(delayTags && delayTags.length>0){
                    var delayTag = delayTags[0];
                    var delayMsgTime = delayTag.getAttribute("stamp");
                    if(delayMsgTime){
                        parseMsgData.delayTimeStamp = delayMsgTime;
                    }
                }
            } else {
                var childrens = msginfo.childNodes;
                if(childrens&&childrens.length>0){
                    var child = msginfo.childNodes[0];
                    if(child.nodeType==Strophe.ElementType.TEXT){
                        try{
                            var data = eval("("+child.nodeValue+")");
                            parseMsgData.errorMsg = false;
                            parseMsgData.data = [data];
                        } catch(e){
                        }

                    }
                }
            }
            return parseMsgData;
        }
        var _parseNameFromJidFn = function(jid,domain) {
                domain = domain || "";
                var tempstr = jid;
                var findex = tempstr.indexOf("_");
                if(findex!=-1){
                    tempstr = tempstr.substring(findex+1);
                }
                var atindex = tempstr.indexOf("@" + domain);
                if(atindex!=-1){
                    tempstr = tempstr.substring(0,atindex);
                }
                return tempstr;
            }
        var _parseFriendFn = function(queryTag) {
                var rouster = [];
                var items = queryTag.getElementsByTagName("item");
                if(items){
                    for(var i=0;i<items.length;i++){
                        var item = items[i];
                        var jid = item.getAttribute('jid');
                        if(!jid){
                            continue;
                        }
                        var subscription = item.getAttribute('subscription');
                        var friend = {
                            subscription: subscription
                            , jid: jid
                        };
                        var ask = item.getAttribute('ask');
                        if(ask){
                            friend.ask = ask;
                        }
                        var name = item.getAttribute('name');
                        if(name){
                            friend.name = name;
                        } else {
                            var n = _parseNameFromJidFn(jid);
                            friend.name = n;
                        }
                        var groups = [];
                        Strophe.forEachChild(item, 'group',function(group){
                            groups.push(Strophe.getText(group));
                        });
                        friend.groups = groups;
                        rouster.push(friend);
                    }
                }
                return rouster;
            }

        var _dologin2IM = function(options,conn) {
            var accessToken = options.access_token || '';
            if(accessToken == ''){
                var loginfo = JSON.stringify(options);
                conn.onError({
                    type: EASEMOB_IM_CONNCTION_OPEN_USERGRID_ERROR
                    , msg: "登录失败," + loginfo
                    , data: options
                    , xhr: xhr
                });
                return;
            }
            conn.context.accessToken = options.access_token;
            conn.context.accessTokenExpires = options.expires_in;
            var stropheConn = conn.context.stropheConn || new Strophe.Connection(conn.url, {
                inactivity: conn.inactivity
                , maxRetries: conn.maxRetries
                , pollingTime: conn.pollingTime
            });
            var callback = function(status,msg){
                _login2ImCallback(status,msg,conn);
            };
            var jid = conn.context.jid;
            conn.context.stropheConn = stropheConn;
            if(conn.route){
                stropheConn.connect(jid,"$t$" + accessToken,callback,conn.wait,conn.hold,conn.route);
            } else {
                stropheConn.connect(jid,"$t$" + accessToken,callback,conn.wait,conn.hold);
            }

        };

        var _parseMessageType = function(msginfo) {
            var msgtype = 'normal';
            var receiveinfo = msginfo.getElementsByTagName("received");
            if(receiveinfo && receiveinfo.length > 0 && receiveinfo[0].namespaceURI == "urn:xmpp:receipts"){
                msgtype = 'received';
            }else{
                var inviteinfo =  msginfo.getElementsByTagName("invite");
                if(inviteinfo && inviteinfo.length > 0){
                    msgtype = 'invite';
                }
            }
            return msgtype;
        };

        var _login2ImCallback = function(status,msg,conn) {
            if (status == Strophe.Status.CONNFAIL){
                conn.onError({
                    type: EASEMOB_IM_CONNCTION_SERVER_CLOSE_ERROR
                    , msg: msg
                });
            } else if ((status == Strophe.Status.ATTACHED) || (status == Strophe.Status.CONNECTED)){
                var handleMessage = function(msginfo){
                    var type = _parseMessageType(msginfo);
                    if('received' == type){
                        conn.handleReceivedMessage(msginfo);
                        return true;
                    }else if('invite' == type){
                        conn.handleInviteMessage(msginfo);
                        return true;
                    }else{
                        conn.handleMessage(msginfo);
                        return true;
                    }
                };
                var handlePresence = function(msginfo){
                    conn.handlePresence(msginfo);
                    return true;
                };
                var handlePing = function(msginfo){
                    conn.handlePing(msginfo);
                    return true;
                };
                var handleIq = function(msginfo){
                    conn.handleIq(msginfo);
                    return true;
                };

                conn.addHandler(handleMessage, null, 'message', null, null,  null);
                conn.addHandler(handlePresence, null, 'presence', null, null,  null);
                conn.addHandler(handlePing, "urn:xmpp:ping", 'iq', "get", null,  null);
                conn.addHandler(handleIq, "jabber:iq:roster", 'iq', "set", null,  null);

                conn.context.status = STATUS_OPENED;
                var supportRecMessage = [
                   EASEMOB_IM_MESSAGE_REC_TEXT,
                   EASEMOB_IM_MESSAGE_REC_EMOTION ];
                if (Utils.isCanDownLoadFile()) {
                    supportRecMessage.push(EASEMOB_IM_MESSAGE_REC_PHOTO);
                    supportRecMessage.push(EASEMOB_IM_MESSAGE_REC_AUDIO_FILE);
                }
                var supportSedMessage = [ EASEMOB_IM_MESSAGE_SED_TEXT ];
                if (Utils.isCanUploadFile()) {
                    supportSedMessage.push(EASEMOB_IM_MESSAGE_REC_PHOTO);
                    supportSedMessage.push(EASEMOB_IM_MESSAGE_REC_AUDIO_FILE);
                }
                conn.notifyVersion();
                conn.onOpened({
                    canReceive: supportRecMessage
                    , canSend: supportSedMessage
                    , accessToken: conn.context.accessToken
                });
            } else if (status == Strophe.Status.DISCONNECTING) {
                if(conn.isOpened()){// 不是主动关闭
                    conn.context.status = STATUS_CLOSING;
                    conn.onError({
                        type: EASEMOB_IM_CONNCTION_SERVER_CLOSE_ERROR
                        , msg: msg
                    });
                }
            } else if (status == Strophe.Status.DISCONNECTED) {
                conn.context.status = STATUS_CLOSED;
                conn.clear();
                conn.onClosed();
            } else if (status == Strophe.Status.AUTHFAIL){
                conn.onError({
                    type: EASEMOB_IM_CONNCTION_AUTH_ERROR
                    , msg: '登录失败,请输入正确的用户名和密码'
                });
                conn.clear();
            } else if(status == Strophe.Status.ERROR){
                conn.onError({
                    type: EASEMOB_IM_CONNCTION_SERVER_ERROR
                    , msg: msg || '服务器异常'
                });
            }
        };

        var _getJid = function(options,conn) {
            var jid = options.toJid || '';
            if(jid==''){
                var appKey = conn.context.appKey || '';
                var toJid = appKey + "_" + options.to + "@"
                        + conn.domain;
                if(options.resource){
                    toJid = toJid + "/" + options.resource;
                }
                jid = toJid;
            }
            return jid;
        };
        
        var _innerCheck = function(options,conn) {
            if (conn.isOpened() || conn.isOpening()) {
                conn.onError({
                    type: EASEMOB_IM_CONNCTION_REOPEN_ERROR
                    , msg: '重复打开连接,请先关闭连接再打开'
                });
                return false;
            }
            options = options || {};

            var user = options.user || '';
            if (options.user == '') {
                conn.onError({
                    type: EASEMOB_IM_CONNCTION_USER_NOT_ASSIGN_ERROR
                    , msg: '未指定用户'
                });
                return false;
            }

            var appKey = options.appKey || "";
            var devInfos = appKey.split('#');
            if(devInfos.length!=2){
                conn.onError({
                    type: EASEMOB_IM_CONNCTION_OPEN_ERROR
                    , msg: '请指定正确的开发者信息(appKey)'
                });
                return false;
            }
            var orgName = devInfos[0];
            var appName = devInfos[1];
            if(!orgName){
                conn.onError({
                    type: EASEMOB_IM_CONNCTION_OPEN_ERROR
                    , msg: '请指定正确的开发者信息(appKey)'
                });
                return false;
            }
            if(!appName){
                conn.onError({
                    type: EASEMOB_IM_CONNCTION_OPEN_ERROR
                    , msg: '请指定正确的开发者信息(appKey)'
                });
                return false;
            }
            
            // jid = {appkey}_{username}@domain/resource
            var jid = appKey + "_" + user + "@" + conn.domain;

            //var resource_value = Math.floor(Math.random()*1000);
            var resource_value = "webim";
            
            var resource = options.resource || resource_value;
            if(resource != ""){
                jid = jid + "/" + resource;
            }
            conn.context.jid = jid;
            conn.context.userId = user;
            conn.context.appKey = appKey;
            conn.context.appName = appName;
            conn.context.orgName = orgName;
            
            return true;
        }

        //class
        var connection = function(options) {
            if(!(this instanceof Connection)) {
                return new Connection(options);
            }

            var _prefix;
            if (window.WebSocket) {
                _prefix = options.wss ? 'wss' : 'ws';
                this.url = options.url || _prefix + '://im-api.easemob.com/ws/';
            } else {
                _prefix = options.https ? 'https' : 'http';
                this.url = ((options.url && options.url.indexOf('ws:') > -1) ? '' : options.url) || _prefix + '://im-api.easemob.com/http-bind/';
            }

            this.https = options.https || false;
            this.wait = options.wait || 30;
            this.hold = options.hold || 1;
            options.route && (this.route = options.route);

            this.domain = options.domain || "easemob.com";
            this.inactivity = options.inactivity || 30;
            this.maxRetries = options.maxRetries || 5;
            this.pollingTime = options.pollingTime || 800;
            this.stropheConn = false;
            this.context = {status: STATUS_INIT};
        };

        connection.prototype.listen = function(options) {
            this.onOpened = options.onOpened || EMPTYFN;
            this.onClosed = options.onClosed || EMPTYFN;
            this.onTextMessage = options.onTextMessage || EMPTYFN;
            this.onEmotionMessage = options.onEmotionMessage || EMPTYFN;
            this.onPictureMessage = options.onPictureMessage || EMPTYFN;
            this.onAudioMessage = options.onAudioMessage || EMPTYFN;
            this.onVideoMessage = options.onVideoMessage || EMPTYFN;
            this.onFileMessage = options.onFileMessage || EMPTYFN;
            this.onLocationMessage = options.onLocationMessage || EMPTYFN;
            this.onCmdMessage = options.onCmdMessage || EMPTYFN;
            this.onPresence = options.onPresence || EMPTYFN;
            this.onRoster = options.onRoster || EMPTYFN;
            this.onError = options.onError || EMPTYFN;
            this.onReceivedMessage = options.onReceivedMessage || EMPTYFN;
            this.onInviteMessage = options.onInviteMessage || EMPTYFN;
        }

        connection.prototype.sendReceiptsMessage = function(options){
            var dom = $msg({
                from: this.context.jid || ''
                , to: "easemob.com"
                , id: options.id || ''
            }).c("received",{
                xmlns: "urn:xmpp:receipts"
                , id: options.id || ''
            });
            this.sendCommand(dom.tree());
        };

        connection.prototype.open = function(options) {
            var pass = _innerCheck(options,this);
            if(pass == false){
                return;
            }
            
            var conn = this;
            if(options.accessToken){
                options.access_token = options.accessToken;
                _dologin2IM(options,conn);
            }else{
                var loginUrl = this.https ? "https://a1.easemob.com" : "http://a1.easemob.com";
                var apiUrl = options.apiUrl || loginUrl;
                var userId = this.context.userId;
                var pwd = options.pwd || '';
                var appName = this.context.appName;
                var orgName = this.context.orgName;

                var suc = function(data,xhr){
                    conn.context.status = STATUS_DOLOGIN_IM;
                    _dologin2IM(data,conn);
                };
                var error = function(res,xhr,msg){
                    if(res.error && res.error_description){
                        conn.onError({
                            type: EASEMOB_IM_CONNCTION_OPEN_USERGRID_ERROR
                            , msg: "登录失败,"+res.error_description
                            , data: res
                            , xhr: xhr
                        });
                    } else {
                        conn.onError({
                            type: EASEMOB_IM_CONNCTION_OPEN_USERGRID_ERROR
                            , msg: "登录失败"
                            , data: res
                            , xhr: xhr
                        });
                    }
                    conn.clear();
                };
                this.context.status = STATUS_DOLOGIN_USERGRID;

                var loginJson = {
                    grant_type: 'password'
                    , username: userId
                    , password: pwd
                };
                var loginfo = JSON.stringify(loginJson);

                var options = {
                    url: apiUrl + "/" + orgName + "/" + appName + "/token"
                    , dataType: 'json'
                    , data: loginfo
                    , success: suc || EMPTYFN
                    , error: error || EMPTYFN
                };
                Utils.ajax(options);
            }

        };

        connection.prototype.attach = function(options) {
            var pass = _innerCheck(options,this);
            if(pass == false)
                return;{
            }
            options = options || {};

            var accessToken = options.accessToken || '';
            if(accessToken == ''){
                this.onError({
                    type: EASEMOB_IM_CONNCTION_ATTACH_USERGRID_ERROR
                    , msg: '未指定用户的accessToken'
                });
                return;
            }

            var sid = options.sid || '';
            if(sid == ''){
                this.onError({
                    type: EASEMOB_IM_CONNCTION_ATTACH_ERROR
                    , msg: '未指定用户的会话信息'
                });
                return;
            }

            var rid = options.rid || '';
            if(rid == ''){
                this.onError({
                    type: EASEMOB_IM_CONNCTION_ATTACH_ERROR
                    , msg: '未指定用户的消息id'
                });
                return;
            }

            var stropheConn = new Strophe.Connection(this.url, {
                    inactivity: this.inactivity,
                    maxRetries: this.maxRetries,
                    pollingTime: this.pollingTime
            });

            this.context.accessToken = accessToken;
            this.context.stropheConn = stropheConn;
            this.context.status = STATUS_DOLOGIN_IM;

            var conn = this;
            var callback = function(status,msg){
                _login2ImCallback(status,msg,conn);
            };
            var jid = this.context.jid;
            var wait = this.wait;
            var hold = this.hold;
            var wind = this.wind || 5;
            stropheConn.attach(jid, sid, rid, callback, wait, hold, wind);
        };

        connection.prototype.close = function() {
            var status = this.context.status;
            if (status==STATUS_INIT) {
                return;
            }
            if(this.isClosed() || this.isClosing()){
                return;
            }
            this.context.status = STATUS_CLOSING;
            this.context.stropheConn.disconnect();
        };

        // see stropheConn.addHandler
        connection.prototype.addHandler = function (handler, ns, name, type, id, from, options){
            this.context.stropheConn.addHandler(handler, ns, name, type, id, from, options);
        };

        connection.prototype.notifyVersion = function (suc,fail){
            var jid = _getJid({},this);
            var dom = $iq({
                    from: this.context.jid || ''
                    , to: this.domain
                    , type: "result"
            }).c("query", {xmlns: "jabber:iq:version"}).c("name").t("easemob").up().c("version").t(Easemob.im.version).up().c("os").t("webim");
            suc = suc || EMPTYFN;
            error = fail || this.onError;
            var failFn = function(ele){
                error({
                    type: EASEMOB_IM_CONNCTION_NOTIFYVERSION_ERROR
                    , msg: '发送版本信息给服务器时失败'
                    , data: ele
                });
            };
            this.context.stropheConn.sendIQ(dom.tree(),suc,failFn);
            return;
        };

        connection.prototype.handlePresence = function(msginfo){
            if(this.isClosed()){
                return;
            }
            var from = msginfo.getAttribute('from') || '';
            var to = msginfo.getAttribute('to') || '';
            var type = msginfo.getAttribute('type') || '';
            var fromUser = _parseNameFromJidFn(from);
            var toUser = _parseNameFromJidFn(to);
            var info = {
                from: fromUser
                , to: toUser
                , fromJid: from
                , toJid: to
                , type: type
            };

            var showTags = msginfo.getElementsByTagName("show");
            if(showTags && showTags.length>0){
                var showTag = showTags[0];
                info.show = Strophe.getText(showTag);
            }
            var statusTags = msginfo.getElementsByTagName("status");
            if(statusTags && statusTags.length>0){
                var statusTag = statusTags[0];
                info.status = Strophe.getText(statusTag);
            }

            var priorityTags = msginfo.getElementsByTagName("priority");
            if(priorityTags && priorityTags.length>0){
                var priorityTag = priorityTags[0];
                info.priority  = Strophe.getText(priorityTag);
            }
            this.onPresence(info,msginfo);
        };

        connection.prototype.handlePing = function(e) {
            if(this.isClosed()){
                return;
            }
            var id = e.getAttribute('id');
            var from = e.getAttribute('from');
            var to = e.getAttribute('to');
            var dom = $iq({
                from: to
                , to: from
                , id: id
                , type: 'result'
            });
            this.sendCommand(dom.tree());
        };

        connection.prototype.handleIq = function(e) {
            var id = e.getAttribute('id');
            var from = e.getAttribute('from') || '';
            var name = _parseNameFromJidFn(from);
            var curJid = this.context.jid;
            var curUser = this.context.userId;
            if (from !== "" && from != curJid && curUser != name)
                return true;

            var iqresult = $iq({type: 'result', id: id, from: curJid});
            this.sendCommand(iqresult.tree());

            var msgBodies = e.getElementsByTagName("query");
            if(msgBodies&&msgBodies.length>0){
                var queryTag = msgBodies[0];
                var rouster = _parseFriendFn(queryTag);
                this.onRoster(rouster);
            }
            return true;
        };

        connection.prototype.handleMessage = function(msginfo) {
            if(this.isClosed()){
                return;
            }
            var id = msginfo.getAttribute('id') || '';
            this.sendReceiptsMessage({
                id: id
            });
            var parseMsgData = _parseResponseMessageFn(msginfo);
            if(parseMsgData.errorMsg) {
                return;
            }
            var msgDatas = parseMsgData.data;
            for(var i in msgDatas) {
                var msg = msgDatas[i];
                var from = msg.from;
                var too = msg.to;
                var extmsg = msg.ext || {};
                var chattype = msginfo.getAttribute('type') || 'chat';
                var msgBodies = msg.bodies;
                if(!msgBodies || msgBodies.length==0) {
                    continue;
                }
                var msgBody = msg.bodies[0];
                var type = msgBody.type;
                if("txt" == type) {
                    var receiveMsg = msgBody.msg;
                    var emotionsbody = Utils.parseTextMessageFn(receiveMsg);
                    if(emotionsbody.isemotion) {
                        this.onEmotionMessage({
                            id: id
                            , type: chattype
                            , from: from
                            , to: too
                            , data: emotionsbody.body
                            , ext: extmsg
                        });
                    } else {
                        this.onTextMessage({
                            id: id
                            , type: chattype
                            , from: from
                            , to: too
                            , data: receiveMsg
                            , ext: extmsg
                        });
                    }
                } else if("img" == type) {
                    var rwidth = 0;
                    var rheight = 0;
                    if(msgBody.size){
                        rwidth = msgBody.size.width;
                        rheight = msgBody.size.height;
                    }
                    var msg = {
                        id: id
                        , type: chattype
                        , from: from
                        , to: too
                        , url: msgBody.url
                        , secret: msgBody.secret
                        , filename: msgBody.filename
                        , thumb: msgBody.thumb
                        , thumb_secret: msgBody.thumb_secret
                        , file_length: msgBody.file_length || ''
                        , width: rwidth
                        , height: rheight
                        , filetype: msgBody.filetype || ''
                        , accessToken: this.context.accessToken || ''
                        , ext: extmsg
                    };
                    this.onPictureMessage(msg);
                } else if("audio" == type) {
                    this.onAudioMessage({
                        id: id
                        , type: chattype
                        , from: from
                        , to: too
                        , url: msgBody.url
                        , secret: msgBody.secret
                        , filename: msgBody.filename
                        , length: msgBody.length || ''
                        , file_length: msgBody.file_length || ''
                        , filetype: msgBody.filetype || ''
                        , accessToken: this.context.accessToken || ''
                        , ext: extmsg
                    });
                } else if("file" == type) {
                    this.onFileMessage({
                        id: id
                        , type: chattype
                        , from: from
                        , to: too
                        , url: msgBody.url
                        , secret: msgBody.secret
                        , filename: msgBody.filename
                        , file_length: msgBody.file_length
                        , accessToken: this.context.accessToken || ''
                        , ext: extmsg
                    });
                } else if("loc" == type) {
                    this.onLocationMessage({
                        id: id
                        , type: chattype
                        , from: from
                        , to: too
                        , addr: msgBody.addr
                        , lat: msgBody.lat
                        , lng: msgBody.lng
                        , ext: extmsg
                    });
                } else if("video" == type){
                    this.onVideoMessage({
                        id: id
                        , type: chattype
                        , from: from
                        , to: too
                        , url: msgBody.url
                        , secret: msgBody.secret
                        , filename: msgBody.filename
                        , file_length: msgBody.file_length
                        , accessToken: this.context.accessToken || ''
                        , ext: extmsg
                    });
                } else if("cmd" == type){
                    this.onCmdMessage({
                        id: id
                        , from: from
                        , to: too
                        , action: msgBody.action
                        , ext: extmsg
                    });
                }
            }
        };

        connection.prototype.handleReceivedMessage = function(message){
            this.onReceivedMessage(message);

            var rcv = message.getElementsByTagName('received');
            var id = rcv.length > 0 ? rcv[0].innerHTML || rcv[0].innerText : 0;

            _msgHash[id] && _msgHash[id].msg.success instanceof Function && _msgHash[id].msg.success(id);
        };

        connection.prototype.handleInviteMessage = function(message){
            var form = null;
            var invitemsg = message.getElementsByTagName('invite');
            if(invitemsg && invitemsg.length>0){
                var fromJid = invitemsg[0].getAttribute('from');
                form = _parseNameFromJidFn(fromJid);
            }
            var xmsg = message.getElementsByTagName('x');
            var roomid = null;
            if(xmsg && xmsg.length > 0){
                for(var i = 0; i < xmsg.length; i++){
                    if('jabber:x:conference' == xmsg[i].namespaceURI){
                        var roomjid = xmsg[i].getAttribute('jid');
                        roomid = _parseNameFromJidFn(roomjid);
                    }
                }
            }
            this.onInviteMessage({
                type: 'invite'
                , from: form
                , roomid: roomid
            });
        };

        connection.prototype.sendCommand = function(dom) {
            if(this.isOpened()){
                this.context.stropheConn.send(dom);
            } else {
                this.onError({
                    type: EASEMOB_IM_CONNCTION_OPEN_ERROR
                    , msg: '连接还未建立,请先登录或等待登录处理完毕'
                });
            }
        };

        connection.prototype.getUniqueId = function(prefix) {
            var cdate = new Date();
            var offdate = new Date(2010,1,1);
                var offset = cdate.getTime()-offdate.getTime();
                var hexd = parseInt(offset).toString(16);
            if (typeof(prefix) == "string" || typeof(prefix) == "number") {
                return prefix+"_"+hexd;
            } else {
                return 'WEBIM_'+hexd;
            }
        };
        
        connection.prototype.send = function(message) {
            var appKey = this.context.appKey || '';
            var toJid = appKey + "_" + message.to + "@" + this.domain;
            if(message.type && message.type == 'groupchat'){
                toJid = appKey + "_" + message.to + '@conference.' + this.domain;
            }
            if(message.resource){
                toJid = toJid + "/" + message.resource;
            }

            message.toJid = toJid;
            message.id = this.getUniqueId();
            _msgHash[message.id] = new Message(message, this);
        }

        connection.prototype.heartBeat = function(conn) {
            var options = {
                to: conn.domain
                , type: "normal"
            };
            conn.heartBeatID = setInterval(function() {
                conn.sendHeartBeatMessage(options);
            }, 60000);
        };

        connection.prototype.sendHeartBeatMessage = function(options) {
            var json = {};
            var jsonstr = JSON.stringify(json);
            var dom = $msg({
                to: options.to
                , type: options.type
                , id: this.getUniqueId()
                , xmlns: "jabber:client"
            }).c("body").t(jsonstr);
            this.sendCommand(dom.tree());
        };

        connection.prototype.stopHeartBeat = function(conn) {
            clearInterval(conn.heartBeatID);
        };

        connection.prototype.addRoster = function(options) {
            var jid = _getJid(options,this);
            var name = options.name || '';
            var groups = options.groups || '';

            var iq = $iq({type: 'set'});
            iq.c("query", {xmlns:'jabber:iq:roster'});
            iq.c("item", {jid: jid, name: name});

            if(groups){
                for (var i = 0; i < groups.length; i++){
                    iq.c('group').t(groups[i]).up();
                }
            }
            var suc = options.success || EMPTYFN;
            var error = options.error || EMPTYFN;
            this.context.stropheConn.sendIQ(iq.tree(),suc,error);
        };

        connection.prototype.removeRoster = function(options) {
            var jid = _getJid(options,this);
            var iq = $iq({type: 'set'}).c('query', {xmlns: "jabber:iq:roster"}).c('item', {jid: jid,subscription: "remove"});

            var suc = options.success || EMPTYFN;
            var error = options.error || EMPTYFN;
            this.context.stropheConn.sendIQ(iq,suc,error);
        };

        connection.prototype.getRoster = function(options) {
            var conn = this;
            var dom  = $iq({
                type: 'get'
            }).c('query', {xmlns: 'jabber:iq:roster'});

            options = options || {};
            suc = options.success || this.onRoster;
            var completeFn = function(ele) {
                var rouster = [];
                var msgBodies = ele.getElementsByTagName("query");
                if(msgBodies&&msgBodies.length>0){
                    var queryTag = msgBodies[0];
                    rouster = _parseFriendFn(queryTag);
                }
                suc(rouster,ele);
            };
            error = options.error || this.onError;
            var failFn = function(ele){
                error({
                    type: EASEMOB_IM_CONNCTION_GETROSTER_ERROR
                    , msg: '获取联系人信息失败'
                    , data: ele
                });
            };
            if(this.isOpened()){
                this.context.stropheConn.sendIQ(dom.tree(),completeFn,failFn);
            } else {
                error({
                    type: EASEMOB_IM_CONNCTION_OPEN_ERROR
                    , msg: '连接还未建立,请先登录或等待登录处理完毕'
                });
            }
        };

        connection.prototype.subscribe = function(options) {
            var jid = _getJid(options,this);
            var pres = $pres({to: jid, type: "subscribe"});
            if (options.message) {
                pres.c("status").t(options.message).up();
            }
            if (options.nick) {
                pres.c('nick', {'xmlns': "http://jabber.org/protocol/nick"}).t(options.nick);
            }
            this.sendCommand(pres.tree());
        };

        connection.prototype.subscribed = function(options) {
            var jid = _getJid(options,this);
            var pres = $pres({to: jid, type: "subscribed"});
            if (options.message) {
                pres.c("status").t(options.message).up();
            }
            this.sendCommand(pres.tree());
        };

        connection.prototype.unsubscribe = function(options) {
            var jid = _getJid(options,this);
            var pres = $pres({to: jid, type: "unsubscribe"});
            if (options.message) {
                pres.c("status").t(options.message);
            }
            this.sendCommand(pres.tree());
        };

        connection.prototype.unsubscribed = function(options) {
            var jid = _getJid(options,this);
            var pres = $pres({to: jid, type: "unsubscribed"});
            if (options.message) {
                pres.c("status").t(options.message).up();
            }
            this.sendCommand(pres.tree());
         };

        connection.prototype.createRoom = function(options) {
            var suc =options.success || EMPTYFN;
            var err =  options.error || EMPTYFN;
            var roomiq;
            roomiq = $iq({
                to: options.rooomName,
                type: "set"
            }).c("query", {
                xmlns: Strophe.NS.MUC_OWNER
            }).c("x", {
                 xmlns: "jabber:x:data",
                 type: "submit"
            });
            return this.context.stropheConn.sendIQ(roomiq.tree(), suc, err);
        };

        connection.prototype.join = function(options){
            var roomJid = this.context.appKey+"_"+options.roomId+'@conference.' + this.domain;
            var room_nick = roomJid+"/"+this.context.userId;
            var suc =options.success || EMPTYFN;
            var err =  options.error || EMPTYFN;
            var errorFn = function (ele){
                err({
                    type: EASEMOB_IM_CONNCTION_JOINROOM_ERROR
                    , msg: '加入房间失败'
                    , data: ele
                });
            }
            var iq = $pres({
                from: this.context.jid,
                to: room_nick
            }).c("x", {
                xmlns: Strophe.NS.MUC
            });
            this.context.stropheConn.sendIQ(iq.tree(), suc, errorFn);
        };

        connection.prototype.listRooms = function(options) {
            var iq;
            iq = $iq({
              to: options.server||'conference.' + this.domain,
              from: this.context.jid,
              type: "get"
            }).c("query", {
              xmlns: Strophe.NS.DISCO_ITEMS
            });
            var suc =options.success || EMPTYFN;
            var completeFn = function(result){
                var rooms = [];
                rooms = _parseRoomFn(result);
                suc(rooms);
            }
            var err =  options.error || EMPTYFN;
            var errorFn = function (ele){
                err({
                    type: EASEMOB_IM_CONNCTION_GETROOM_ERROR
                    , msg: '获取群组列表失败'
                    , data: ele
                });
            }
            this.context.stropheConn.sendIQ(iq.tree(), completeFn, errorFn);
        };

        connection.prototype.queryRoomMember = function(options){
            var domain = this.domain;
            var members = [];
             var iq= $iq({
                  to: this.context.appKey + "_" + options.roomId + '@conference.' + this.domain
                  , type: 'get'
                }).c('query', {
                    xmlns: Strophe.NS.MUC+'#admin'
                }).c('item', {
                    affiliation: 'member'
                });
            var suc =options.success || EMPTYFN;
            var completeFn = function(result){
                var items = result.getElementsByTagName('item');
                if(items){
                    for(var i=0;i<items.length;i++){
                        var item = items[i];
                        var mem = {
                                jid: item.getAttribute('jid')
                                , affiliation: 'member'
                            };
                        members.push(mem);
                    }
                }
                suc(members);
            }
            var err =  options.error || EMPTYFN;
            var errorFn = function (ele){
                err({
                    type: EASEMOB_IM_CONNCTION_GETROOMMEMBER_ERROR
                    , msg: '获取群组成员列表失败'
                    , data: ele
                });
            }
            this.context.stropheConn.sendIQ(iq.tree(), completeFn, errorFn);
        };

        connection.prototype.queryRoomInfo = function(options){
            var domain = this.domain;
            var iq= $iq({
                  to:  this.context.appKey+"_"+options.roomId+'@conference.' + domain,
                  type: "get"
                }).c("query", {
                  xmlns: Strophe.NS.DISCO_INFO
                });
            var suc =options.success || EMPTYFN;
            var members = [];
            var completeFn = function(result){
                var fields = result.getElementsByTagName('field');
                if(fields){
                    for(var i=0;i<fields.length;i++){
                        var field = fields[i];
                        if(field.getAttribute('label') == 'owner'){
                            var mem = {
                                jid: (field.textContent || field.text) + "@" + domain
                                , affiliation: 'owner'
                            };
                            members.push(mem);
                        }
                    }
                }
                suc(members);
            }
            var err =  options.error || EMPTYFN;
            var errorFn = function (ele){
                err({
                    type: EASEMOB_IM_CONNCTION_GETROOMINFO_ERROR
                    , msg: '获取群组信息失败'
                    , data: ele
                });
            }
            this.context.stropheConn.sendIQ(iq.tree(), completeFn, errorFn);
        };

        connection.prototype.queryRoomOccupants = function(options) {
            var suc =options.success || EMPTYFN;
            var completeFn = function(result){
                var occupants = [];
                occupants = _parseRoomOccupantsFn(result);
                suc(occupants);
            }
            var err =  options.error || EMPTYFN;
            var errorFn = function (ele){
                err({
                    type: EASEMOB_IM_CONNCTION_GETROOMOCCUPANTS_ERROR
                    , msg: '获取群组出席者列表失败'
                    , data: ele
                });
            }
            var attrs = {
              xmlns: Strophe.NS.DISCO_ITEMS
            };
            var info = $iq({
              from: this.context.jid
              , to: this.context.appKey + "_" + options.roomId + '@conference.' + this.domain
              , type: 'get'
            }).c('query', attrs);
            this.context.stropheConn.sendIQ(info.tree(), completeFn, errorFn);
        };

        connection.prototype.setUserSig = function(desc) {
            var dom = $pres({xmlns: 'jabber:client'});
            desc = desc || "";
            dom.c("status").t(desc);
            this.sendCommand(dom.tree());
        };

        connection.prototype.setPresence = function(type,status) {
            var dom = $pres({xmlns: 'jabber:client'});
            if(type){
                if(status){
                    dom.c("show").t(type);
                    dom.up().c("status").t(status);
                } else {
                    dom.c("show").t(type);
                }
            }
            this.sendCommand(dom.tree());
        };

        connection.prototype.getPresence = function() {
            var dom = $pres({xmlns: 'jabber:client'});
            var conn = this;
            this.sendCommand(dom.tree());
        };

        connection.prototype.ping = function(options) {
            options = options || {};
            var jid = _getJid(options,this);

            var dom = $iq({
                from: this.context.jid || ''
                , to: jid
                , type: "get"
            }).c("ping", {xmlns: "urn:xmpp:ping"});

            suc = options.success || EMPTYFN;
            error = options.error || this.onError;
            var failFn = function(ele){
                error({
                    type: EASEMOB_IM_CONNCTION_PING_ERROR
                    , msg: 'ping失败'
                    , data: ele
                });
            };
            if(this.isOpened()){
                this.context.stropheConn.sendIQ(dom.tree(),suc,failFn);
            } else {
                error({
                    type: EASEMOB_IM_CONNCTION_OPEN_ERROR
                    , msg: '连接还未建立,请先登录或等待登录处理完毕'
                });
            }
            return;
        };

        connection.prototype.isOpened = function() {
            var status = this.context.status;
            return status==STATUS_OPENED;
        };

        connection.prototype.isOpening = function() {
            var status = this.context.status;
            return (status==STATUS_DOLOGIN_USERGRID) || (status==STATUS_DOLOGIN_IM);
        };

        connection.prototype.isClosing = function() {
            var status = this.context.status;
            return (status==STATUS_CLOSING);
        };

        connection.prototype.isClosed = function() {
            var status = this.context.status;
            return status == STATUS_CLOSED;
        };

        connection.prototype.clear = function() {
            this.context = {
                status: STATUS_INIT
            };
        };

        return connection;
    }());



    /*
        CONST     
    */
    var EMPTYFN = function() {};

    tempIndex = 0;
    EASEMOB_IM_CONNCTION_USER_NOT_ASSIGN_ERROR = tempIndex++;
    EASEMOB_IM_CONNCTION_OPEN_ERROR = tempIndex++;
    EASEMOB_IM_CONNCTION_AUTH_ERROR = tempIndex++;
    EASEMOB_IM_CONNCTION_OPEN_USERGRID_ERROR = tempIndex++;
    EASEMOB_IM_CONNCTION_ATTACH_ERROR = tempIndex++;
    EASEMOB_IM_CONNCTION_ATTACH_USERGRID_ERROR = tempIndex++;
    EASEMOB_IM_CONNCTION_REOPEN_ERROR = tempIndex++;
    EASEMOB_IM_CONNCTION_SERVER_CLOSE_ERROR = tempIndex++;
    EASEMOB_IM_CONNCTION_SERVER_ERROR = tempIndex++;
    EASEMOB_IM_CONNCTION_IQ_ERROR = tempIndex++;
    EASEMOB_IM_CONNCTION_PING_ERROR = tempIndex++;
    EASEMOB_IM_CONNCTION_NOTIFYVERSION_ERROR = tempIndex++;
    EASEMOB_IM_CONNCTION_GETROSTER_ERROR = tempIndex++;
    EASEMOB_IM_CONNCTION_CROSSDOMAIN_ERROR = tempIndex++;
    EASEMOB_IM_CONNCTION_LISTENING_OUTOF_MAXRETRIES = tempIndex++;
    EASEMOB_IM_CONNCTION_RECEIVEMSG_CONTENTERROR = tempIndex++;
    EASEMOB_IM_CONNCTION_JOINROOM_ERROR = tempIndex++;
    EASEMOB_IM_CONNCTION_GETROOM_ERROR = tempIndex++;
    EASEMOB_IM_CONNCTION_GETROOMINFO_ERROR = tempIndex++;
    EASEMOB_IM_CONNCTION_GETROOMMEMBER_ERROR = tempIndex++;
    EASEMOB_IM_CONNCTION_GETROOMOCCUPANTS_ERROR = tempIndex++;
    
    EASEMOB_IM_UPLOADFILE_BROWSER_ERROR = tempIndex++;
    EASEMOB_IM_UPLOADFILE_ERROR = tempIndex++;
    EASEMOB_IM_UPLOADFILE_NO_LOGIN = tempIndex++;
    EASEMOB_IM_UPLOADFILE_NO_FILE = tempIndex++;
    EASEMOB_IM_DOWNLOADFILE_ERROR = tempIndex++;
    EASEMOB_IM_DOWNLOADFILE_NO_LOGIN = tempIndex++;
    EASEMOB_IM_DOWNLOADFILE_BROWSER_ERROR = tempIndex++;

    EASEMOB_IM_RESISTERUSER_ERROR = tempIndex++;

    tempIndex = 0;
    EASEMOB_IM_MESSAGE_REC_TEXT = tempIndex++;
    EASEMOB_IM_MESSAGE_REC_TEXT_ERROR = tempIndex++;
    EASEMOB_IM_MESSAGE_REC_EMOTION = tempIndex++;
    EASEMOB_IM_MESSAGE_REC_PHOTO = tempIndex++;
    EASEMOB_IM_MESSAGE_REC_AUDIO = tempIndex++;
    EASEMOB_IM_MESSAGE_REC_AUDIO_FILE = tempIndex++;
    EASEMOB_IM_MESSAGE_REC_VEDIO = tempIndex++;
    EASEMOB_IM_MESSAGE_REC_VEDIO_FILE = tempIndex++;
    EASEMOB_IM_MESSAGE_REC_FILE = tempIndex++;

    EASEMOB_IM_MESSAGE_SED_TEXT = tempIndex++;
    EASEMOB_IM_MESSAGE_SED_EMOTION = tempIndex++;
    EASEMOB_IM_MESSAGE_SED_PHOTO = tempIndex++;
    EASEMOB_IM_MESSAGE_SED_AUDIO = tempIndex++;
    EASEMOB_IM_MESSAGE_SED_AUDIO_FILE = tempIndex++;
    EASEMOB_IM_MESSAGE_SED_VEDIO = tempIndex++;
    EASEMOB_IM_MESSAGE_SED_VEDIO_FILE = tempIndex++;
    EASEMOB_IM_MESSAGE_SED_FILE = tempIndex++;
    EASEMOB_IM_FILESIZE_LIMIT = 10485760;


    tempIndex = 0;
    var STATUS_INIT = tempIndex++;
    var STATUS_DOLOGIN_USERGRID = tempIndex++;
    var STATUS_DOLOGIN_IM = tempIndex++;
    var STATUS_OPENED = tempIndex++;
    var STATUS_CLOSING = tempIndex++;
    var STATUS_CLOSED = tempIndex++;

    delete tempIndex;

    var EMOTIONPMAP = {
            "[):]":"data:image/png;base64,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",
            "[:D]":"data:image/png;base64,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",
            "[;)]":"data:image/png;base64,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",
            "[:-o]":"data:image/png;base64,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",
            "[:p]":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAG40lEQVRYw8WXW2gc1xnHf9r7ZXZ3tLIiaVfOruzYjiRfZMeXRA+R7DY1xSkVNSSkLdTgp/ahOAgKpQ81pfTJon5pnipw2odADW7SmxMlbdYklZuAy7p2pMipZMleWfe9z652Z3dOH2b2povbkEAHDsww5/y///c/3/ed78D/+Wn6vAvGRzgEDAJhoK/uVxKIGiPSP0zqSyMwPoIPOAdcMAz/L88V4Er/MDe+EIHxEb5pgMk2ScIfDuMJdODt6MBit+uThABAWV1FWV0jMTdH8sGDCsSbwLntFGn6L15fBs7ZJInOZ56hdd/ezROFQAihk6gMTbCeyTAfjbI2M1PZnqGt1Gh6jPEI0Ne+fz+h/ue2NAwgtEbjQmgNRHLxODM3b5JPJjGUeL0exrSNABGgb9fAwLbGhRAITQOhgaYPoWmgieoQQuD0+dh36hROWQa4Ymzp9gqMj/BL4IK0+wgZtQWArt4W2nZ6Nnhd8RQSKznufrxEsVDmiYCLvfv9WK1NDcqUCkWmIu+TT6WSQF//MHObCIyPMABEio4QsdWWBmInvhaiq8ffIC9CkFjJ87c3Z1CLWnWu7LczeKYTm7WpIT5KhSJ333mbsqpG+oc5udUWXFQ1G7HVFqx2iedfusTzL13Capf4540YSnK9JrfQxwfX51CLGodfeJVvDf+VroNnSMYLfHYnoStVN8wWC6HDRwAGDWdrBCoFpuTtBmDg5RF2Pn2SnU+fZODlEdRCmdh0St9bAzCxnCeXUek6eIZ9x1/B5vBw4hs/xe3r4P6/01vEh4bc1obU0gJwcaMCF2ySRNniw+3roC18tPqjLXwUq11iOZapAqFpLM9n9Rg5+CKzk3dYiem5H9w7QC5bMgKxPjj1d3+ws6JCqJ7AYCXPm0xufvWjH3DxOy/y8bt/BqC5fR/FQrmWbpqGWigD8IfR1/nx0El++JUj3Lj2BjaHxwhWrRorunFduZZAsGJzyGTIHwLC3vZ2AOanP+HGtTeY+OjvXPr+d5mduIOSfARCB9XTT2C16vyjkWtVL37zi59QXM/oH3Xy6/Whpp7U3AzQV1EgDOBs9iPvcODz23G6LVXQP/36ZyipBZ7ocFYB0DRa2x0APLnbU52by6SJvv9bXG5zQ7zU1wahCaRmP0C4IQssVgudXV497U62YbGasFhNmLRJneUebw1IE8iyldY2B08+5WFXtxeL1cTh/lZckpVQ2LXJ62r8VGoIyJaGAqcJWjtchPfJzE4lOfNK7eDb0yvjdptrpdbY276jzUTGFjlwbAcHju0AwCdb6OmRjDmaXgs0qoZF5fyAvgYCGHt7YrADt2Rh+ZECQve86ynPhrqvA/t8Fr769XYm7qRQsiUCQQehkKOKtfGgasCASAOBQiaD3eVCCEHvYT+9fc11jGsRvRHU7TRx9Ji8gVxdBmxcownKqqpvu2E7CpCLx7E5ndss1DZ7UP//McY2qSAE2VQSIGoCMJqFaOLhw2qQ1AqIVs3hBuMNEd64ZvYfCa7/fJqlT7NbBmK5WGRdUWoEKp1LMhbTz/C1dW6+do9P3orpwHVEqnm9FTlNELudZvLdNQDSi4XGs8N4jy8tVm3WE7hSVlUW701RVEqsTWe5/+EKU2OLNYnrvTY8q4CquRK3frfAnT+uVAE9rdYGchWc1cVHGP1iylyZPDpG6vxpwko83td5YA82t5WVe1ni9xXWZrJ42+3Y3eZN+5xLqMx+lCT6+2VE0knQswvJ5iNdSFBQSgR7nA1rlmIPyCQSAEOjY6QsG4/jsqoOzd66Je/uPw6aYOIvi8Tv5/jwtft42u142+y4ZAu5pEp6sUBmqYjFZKV7x3FaXYEqkNPi5rOH/2L+rkKw24kQgrySZXk+BnB5y4bEOBe+B1zxd+4kdOgQ6Ud5Jq4vEZ/Nb9s5HwucwmOTN/eWsbexykWe+7afvJJl5tMJtHI5CgxWumTzxkWjY9w+fxo5n04/W8zlaNsVoPOgl+AhL06vGZOlCbvbTD5VAkCy+dgl92xJLF9SWE2sEegVzExNoJXLle54rjLHvNXC0THeOX+acD6T7kstLeHyyTg9DuSAnUC3m+ABN8H9EpmlIqmEQr6kNMhfLaxCY1mJkS3MYrapScPz2/VzzNvJOjrGW+dPM1sqFgfXYg8dxXwOh1vCbNFPOautiUCvi3yqxML86pYkiuV1FrMPsMu5iNWlPlvv+ee5GYWMm9EggMMtIflkJJ8Pk1nPisn3ssTnTEg2H3v8B2l2tKJqRSZXb7GaWwCQz16dTn2hy6nRM14AhoBNEacs+MjEmhHlTaJePnt1+tUv7XZcR2bT7biQdkTjE8Fw3QU2cvbq9GMvp/8Bf+J+kqwxd2MAAAAASUVORK5CYII=",
            "[(H)]":"data:image/png;base64,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",
            "[:@]":"data:image/png;base64,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",
            "[:s]":"data:image/png;base64,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",
            "[:$]":"data:image/png;base64,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",
            "[:(]":"data:image/png;base64,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",
            "[:'(]":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAGrElEQVRYw8WXW0xb9x3HPz4+PjY328SYSwLGpCGFkCCWbrAusJJoY5q2MDSl0zRVKqo09aVReVqlMaloHX2ZJrGXPZSHZpvWy9ZNGZ3WrVs3cmmbZFoKhBQIKbYTE24mNsbg4Mv57+H4GBvsJF0n7Uj2/9jnf37f7+/+/8H/+TJ8ms0j/diAFqAzx2MvMNY9yPj/nMBIP98CeoGeh9juBc4CQ92D+D4TgZF+ngCGtiRny5axCldFgKq6MqxlNqxOGyazAkB4JcRmeJO78ysszS0QXd/URQwBA92DrH1qAiP9vAgMyIqJEtej+G4p2B0KJ05Wopil+2q16l9h9soUd+cDukV6wspRL+B+6sWrWS6S84C/CvRW7K+i+SuPYTIrSP8M4LkR4R9vL9LxtXKKSuS8BBzVThzVThY/ucPE3//tTsTiowaR8AqD3LJTaWM+8PrWRg4f/xxGWdtSXVfIxnqCRX8Uz0wEq92EtdR0X0sUlxbjOlzHzLRqiYuCSuDsH0YX3szrgpF+ngeGGjuaqWs5kFOoZybC1Q/uEo+plFdZOPx5O+V7LdmbhAAgsp7g4rvLhFbjSOomRYnZkIGkOzMmjBngtcBf9jW4aDh2OK9WpWUKtQeKiG+pzPs28dyI4JmJaIT2WkAIRIroxXeX2YwkcdcX0f5VB/PTXouaVBtev8CbuWJgoKCkkENfbt4F6vdscnk0QDym7npWVKyJiMXULPAr51YBcNcXUVdfyHoEKhsPcXv8es9If/KJ7kHOpQmktO+tb2tMp1bmpZglSh1KToscPGKl2l2QYXnBxnpiuyjMbuCd3UjrW2goQBaRAeB4pgX6CkoKqW6s3Z0Rl8qxFyU40W3J7ZOU1rrfEXCwqZjySiX1f+pLgBCCePgRJs+Nd470U9s9iE9P6J6K/VVZckMRmdbnj/Gdlx+juS6cAzgFnlq139q9SZFwVpoprzRTXqmglBRx8mddDJ9vZu+BvbqEHgA5Vd/de/Y5s+R39bcx4bHSXBfGXpzIo/W2dmkts6whEEJgK4hhL4zx8lsNhDaMPFl5ieBisAVASjUXHNVlafm/fm8fEx4rQHrN0joNsg2uGUGkrKEBC1WAqq2hDa1m/OKdetaN1QBunQBAVvD5lgty+loH2ja5yOEGDRxVBaEihLZe89nTon5z3o2uuPygbmUriuc1uW5phGBtPsrqzQiyRaKyqQTZLKUJTnituUTb8xJ47qQX31IBoQ0TP/rubDq9EDtiIPXfR6/dxv+vYPr96xaJx5+txVqlIITgSE2QI64g126VAtDesAzxHYUovhVLu8G3XEDz/jDPnfQ+MNA+eu02C5MJap/5KbajXUSmL7HwxyHGfztH++natEvef+mvXPjYyZ+u7sNhS0KAUT0GxrSevkYoIvPk4FHa+tq3fXyfQAvMRliYTFD/whs42k8hF1qxH+1i/+lXCC9sEb4TRagqqCpCVWk/uED7wUW+9/qz/PDKC3YAKdUYvDPXVujqb+PtyxUAPHXCn5XbuQJt7vwK5V3PUOg6lOVCS1k1JY+2sXg9ou1VVURSI1FTug7A9NqBFrl1+FU9C86efuObO1JOj/rstBN6lAvB0uQ6jmOnMABGA8gGMEmgGMHe+EUNPAWsk5i7k1XSe2WAb/9teGxnIE54rHQ0rW67IAMYIQjc1Op7UXk1kkHr65lrbNWPIok0uOYGwYeT5iwc3QJ9Owmcn3Tszm2RbQEARdr+6NqbJNi49TF7XAoimUyTWLmzysXZ7JIvya3D+lF7B4E9OSsaqlZkZIt2lkne9aeBdSLr05e4tzhNaY2SNn38Xpzpq5/sSnkpF7jmAlvOiobQTGmtUJAtEssX3toGNwL3wkz96se4vlCs+T+pktiKMfbBFMlEMhRNWM488FCa1XTU7Pqeee9+3MbN3/+crYCf2s5TRFf8TP1uCMmwxCNfKkOoSeJbCcY/nGIjHAXoufHeT87JrcOjqV4QMgDIrcNBvTTq1/Gq93npG+/Q1HEEk8m4Da5mx8PUnwP4Lq+n33PWm2n6ug1ZgeDKGjPjHraiMYDe7kF+mXMukFuHn04NETqJ0Vc6fjBWZgn2yYqMq7EWV2MNsknOajYiFQ+bwTjRYByLVcJSIhEJRfDPLbLkXwUIAZ35Rrb0qTgjGL2JK9/3ZUxGZwC3bJJx1jgpLbdjKTRjL7NqcaEKopEo0cg9QoE1AgtBNsLpyegM0PdfTUY7jutPp2bDzofYHkrNhgOfeTbMMx13pizl1g8VoDUWYFQ/7T7s9R8R2ZduYFascgAAAABJRU5ErkJggg==",
            "[:|]":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAGpUlEQVRYw8WXbUyb1xXHf2BsjB8b7AQMARIchbcm6wLkxVuTFdCQWi3LRLVpWxqpsdRqcidNi6Z8nJQ00jRt1RY0qRrJl9B92GeysqpRPwSkZXRd4gGhKSEC7PJq8+a3x8Bj/Nx9eB6MzUtCtkm70tWRnufc+//fc8859xz4P4+cF13g66QKaAFcutwYfn0OAL1NXiL/UwK+Ti4Bl4GGPS7pArqavPT9VwR8nTTrm7lyjSaKDlZRVOnCJNko2Lc/SzcenGFleZF4cJboVGDjczdwuclL4IUJ/PZH5huBgPFyaN4AQEm5hR94j9H8Pdeua+SYwp/eH+Cf92ZIxJIA1NcpYVfVuuftPyp3tuobdtvoV28U3Pb9y+yVE7mcbC2n5uv78D+J0H93kvkZmVOtFZqiEFng19/pY/DvQez7zTSfP0RSURkbXTdPTuX9+O3Xc/yfDK0PZuLk7WL227//g8lTVVfElRtnKCmXAHgrpnD9nV76/hLg3fdOAQIEadl3x09gNMJbv3iZ71w4gtj43hOg8/oAQJevE5q8fLjrFfg6+TnQIVW/woGjNUg2ow6iAcnRJPMzMq7aom0EBILAkwhVtYXZ1hEC/2iE2NP7iNWlMNDS5GVwGwE9xAYch2vsh77ZDAjiEYXQVIzkWgpnhRVHsTkLcCsQgBxVmBgJp785yy04yy2klDVG731CMiH3Nnlp3YnAbaNk9dS93k5KNfDZp18xPZYdzvZiM+62So2I2E7Adz/I6NDStmutcFlxt5SiRBcYv38PwNPk5UPDltN3VTSeRtpfQm/3GHOBGFLRAeq/8SalrhMALM5O8tVomKrqQkymHB1cgBA8GVriiwcLGPOtNH77Zxw748FZdZLluScsBpeILivUfM1JfHGe5ErCdbOHm5lO6Mk1GnG4jjD+eJHQtIyjtJa2S7cwmW2aRjP037nK+GAPw5+HcLeWbfoAMPxgAYC2S7fIt5Th//IRrpde5WB9Cx/fvMB0YJZ4dI1i1xHkxfkGXyfHczMItBeVHwJVJTQVB+Dl5p8QXljG01jFD6sdfP7pXznx2hWM+VamJmKgqiBUbc20TFJRqaxrYV9ZHe+/e5H3Lp7n2sXvYjLbqHe/CcCUX6bQWUZuXh5AeyaBhsLySlBV5KgCQKnrJI//8TcSsSgAgS8fYTLbcJTVkVQ2wdMSkOwHtIfh8SN9zTAARt2KybUUqCrWfcUALbkZ6RZTgQWEimTVbibof8BR91lKKg5isRVyqu0cymqMUOChpqOqCH1aJM2dpkZ6tfv85a856j7DT3/zAQChwAPNiR15IFTM1kIAe1YiKrAVgapyuNbGxGiUh3d/R9ulW3zQN5TW6b9zVUvLZfkI/dQIgSTlUlKaz3xwlv47V3nl3BVavq+ZfeSzPzM+2IPRmENlRT6oKoY8A0BDdiYUKRDgLMvncI2ViaezfHzzAgfrW5Ds5YwPfIQcmcViNdB42pE2+0YYus84uPtRkPHBHiZHenGU1SGHZ5AjswCcfdWexjBLth1SsSrS6fP0t4oxGnMYfRxjfLAnrVJSms/Z1mJMeWh3n5EJJUsOr50rYXgohn88TijwUFvjNNLYZMVhz0OoWsiuxCJZBMIAsfkg1v3F6U0bTzk4dryQ8JKiAVgNSJJBA1RFOvwyE5FkycHttuF220DouVL/LzIIq8kkwEAuwEZeTibkbK8WKUx54HQacTqNSJac7Z6/ZQpVRYhNuZvuSjwK4M8Mw9744ryukNpUfhag2AVQ3Vk3U8rhMEBvJoHuaGiWVHJNM+9eANW9A2bO5eAsamodoDuTQJe6vs6Cf1zz1IzFQojdAcXeLJUpw6E59MI1kCagV7FdC5N+lERCBxQ6aOo/Atrx9KE55GgE4NpOz3ER4JeKHPbDDSeyQgwE4/0R5kbk7Hc24zHaOhrOOygoMqSjQFlbZWx4EDWV6m7y8sa2PNDkJeLrxCNHlrunRr6gsuYlfXOdhFBZ9K/uqSbPy89BSaxTYNOe7FRqncnREdRUKgx4nlkV+zq5ClyzO8uorK7LLr12qIDE1sJkS6mmrK0yOfaU1ZVEVjn2zLLc18kN4LLZIlFRXUuBRdozYKaMhpeZDkxsnDwL/Ll9gd4NdQB2e7GTkopKTKb8ZwJuAodZnA+SiMfQ2zXPVvC9dkZVOol2AHOBBZvdgdliwWAwZF2NsrZGIh5DjsdIKspGiu8AOnbrFV+kNzyu94btgP056n69net4XpP6wt1xBpkGvUPOHAPAwG594E7j38O7AhDEtOj4AAAAAElFTkSuQmCC",
            "[(a)]":"data:image/png;base64,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",
            "[8o|]":"data:image/png;base64,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",
            "[8-|]":"data:image/png;base64,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",
            "[+o(]":"data:image/png;base64,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",
            "[<o)]":"data:image/png;base64,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",
            "[|-)]":"data:image/png;base64,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",
            "[*-)]":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAFdElEQVRYw82XS2xc5RXHf/fO0/O6M3Ycx4kTOygPQmMyQQZCEimDYJGyYSQkJJBaGYmqZNddlxn2XXTbqgIvKkBiM1UXLVQIU6UphBCNycM0hMR2nBi/4nl4xnfm3vsdFhmP547HiZ1mwd3cuZ/+95zfOd+Z852r8X9cpfGTR4B4/TEfPXRubKs2tEdwOAykgCQCAlD/IQAiORFGgZH44PmxxwJQGj95CsgAKRHQvB40rxctGHDpnIqJsiykZtdhGBWRTNfRL794JIDS+ElDhBGQNLqOJxJGj0bQA/4HAiuzilVYxsqXENsByIow3D30VWHTAMWrJ/oFsghJTzyKNxFH8+hb2l9xHKpzS1QX8oiQQxjuef7C2EMB8peP9wM5TdfjtaDBd7kKlYIFwMCgwcCgsaHTcsHi6rkFl75vr4/lWzOI7eRFSPUevzi2IcDSt8cNkFFN15N2bBuffXAHq6pcmv1DCZIv9bR1/q/3b7XVH37BoHh9GrGdnEBq18lvCgDrcipKMqIkGejbwfjXRayqYupGiev/6+XlX/8JXyDC9xeXmJuqrAO4em5hQ/29BUXsQB+i60lRMrL6jgtg8dKxU0rJ73zdXdh4mbxSoHCvyqXz81z76j8szJq88GoGgInL7nqqmc5D9d5QkFBvF8qR9NTnR0+tA1BKMprHg7/LID9XBWDm9lqkoajB7idfBGjscaNuNqkP9Xbi6QiglMq4AOYuPNcvSlL+7oTLcCSxj1A0xivD77D3qUEAEj0HNizCzegju7ehHEnd/PTpI96m6NOaR8ffGXOJf/mr1/j9X37rLtTZ63TvDrUF2Iw+2BVD9/twzFpabyq+tDcWboji2+93uZu5v7uM/VB/jve4u+BW9X4jhFKS0psykPQ0tVZ/0EP/YYNyYYb//u0sNbPE7MRFvvnkD/W/Vqfb4EP1CRBBRBAlBGIhlCOpRh+Y/vczYjy5B38s5Krs0Q+nKNQLbPV69pXets1oI/3Q6R4GfhFDpHFiYS6Vmc1N0FwDrJ5tzVGl3tjD9xeXmJ+q4Avq7B/qZPueUMNQ/QYIPp/Gqdf77uunK/j8OvuPGnT3daAsu6FDBLEdlJK1Tjj5WVISh/sJGOGWzrTeEUIjnfc1m1hredcsVJi5Mt2SAaGtAZD6rWlNVqEeDUjZDuLIGoAoydeKlbgvHGhxVI//Ic63BCRQLa6glOSbMzBq3ltOh7ZFmyKvZ+QxATWvmSUTUZJzA+TLace00HWtvXPgxj/nmPxiEXvl/okX3RkgmPCx/XCEnc/E2oM3100doLxYQSnJNm9B1nbsP1bmi4S7Im2diwjF2ysN5wClu1VKd6vMX11m7nKJI2/2uGuG1sxBabGCbTmgaVnXPDCePfS+x+cd7jm4A03X2myFOxoAa8Vh/lqZ6/9YxDaF/acT7DkWfSDA1Pgcds0ZGRq++ZbXPQuQsUxrOH9niXivsQkAweOFHYMdhLu3c2u0QKTbi7Id17vNAEuzZWqmjaZpmbYT0eWPD55FyHTuihOOd2wAsPb7QZG2rhfzJnN3iiBknn974t0NZ8Kxjw58jkiqc6dBJB5s6g/rDUtrVpoBmtZXyhYz0yWUI7ljv5k4uurL23aaFUmLktGF2/mkU4sQSwTXO3pAXbSu5++ZLMxWEMhpGqlNjeWX/rrPEJEsQirQ4aOzO4Q/oG8JwLYcZn+ssFKxERjV0NLH35ksbOnL6OuRJ84iZESEYIeXSNRPOOxF17W2AI4SyssWy8sW5WV71UzmxJmpdx/50+zCe3v7RSQjwvBqPfj9HnR97QAVEZQSqu6RfKTufPKxfJx++ecBQ0TSIqQFSSIMtEgmgByQBbInzkwV+LlfPwH8Jg9a3haDYQAAAABJRU5ErkJggg==",
            "[:-#]":"data:image/png;base64,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",
            "[:-*]":"data:image/png;base64,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",
            "[^o)]":"data:image/png;base64,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",
            "[8-)]":"data:image/png;base64,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",
            "[(|)]":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAWlBMVEUAAADuSSjuSSjuSSjuSSjuSSjuSSjuSSjuSSjuSSjuSSjuSSjuSSjvXj/ziG3zgWbxc1buUC/0ln34uaTuSSj2pIz2q5TuSSj1nYX3spzxbE70j3XvVzfyel7cxRSSAAAAHnRSTlMAL3+fv18PT6//799v/////////x///8////////+sIC8ZAAAA9ElEQVQ4y61TQYKDIAxMEcSktWrDttV2///NJaJoK3DauSUzJGQIAP+Ek6q0MvUaWtVoZXe0xhmkQnhewsvCG8L22vWSq+Q4RlThAA037pbUBRxtApxLavzh+5ohp3EPB+CwZ77GzOOD9xXBYMexwwEaQIngWRT4FmNBYHEYmaeMoJFLSo9XRiBeNXOJd5Incd8785srEbw3iE/mNn3FReGbJCZ9xOc12CYG2XhR9DwOeT4obgVeDJ3GqcADVNjeNzPO9XEvvWHx1emUWNx6two2vdr0aeAR5svA1DXCXmYFNa1PnIMtNgh/oNBA4LITxEm+4j9JsxdaKeGywAAAAABJRU5ErkJggg==",
            "[(u)]":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAtFBMVEUAAADuSSjuSSjuSSjuSSjuSSjuSSjuSSjuSSjuSSjuSSjuSSjuSSjmvbvuSSjvVzf0j3XxbE7pinrmvbvzgWb4uaT1nYXrbVXmvbvmvbvwZUftUDHsWT3uSSj0ln3uUC/qg3HsZkzmvbvziG3yel7rdF/mvbvuSSjnrqjmvbvmvbvmvbv2q5TtVzrvXj/np5/mvbvxc1booJbmvbvmvbvooJb2pIzqe2juSSjpkYPmtbHqg3Ert3r1AAAAPHRSTlMADz8fX39vT8//3++PD7//////j///////r///b6//////3////78v/+9fz/////8v//9/n7///5///1+U7zcrAAABPUlEQVQ4y81T21LCMBDtLaXb2FIuwRWFAgpFpUVEpej//5dJk95oRsc3z0Nmzp4zu9nNxjD+L0zLspvcIYS4daTnAYfvVJxCgatAcgIKoal4P4oGIjAcCYsDFUKhWzBmE8mv8YaXp7UBRJVwwNhU0lvEuzBs6DAzDBvmjMWSLhCX0IaoMKkyDHE10xjuGXuQbI0bp2NIYMrKS8L20fBaumiDihr9so2npNkEuMUYeIpIBdaroOnwxaRMH6IqBSyeA1IbkmKSCY13bK5CKW7s1pikI6s6hT2+0AtdOA5sp6KvePQudekYl4a3ri4dssgW3zU63wnIPuLikngqdqOzZA5kBy6cEFP5ih3kqsKZn56pW1Rx+aVMkGg32aaih7N6AR1cnuAzVZuoRf6Fe57A/uHDHEc5kF/+lPe3P/gNbKkfpYJqqEsAAAAASUVORK5CYII=",
            "[(S)]":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAACK1BMVEUAAABjZIRjZIRjZIRjZIRjZIRjZIRrbIt7fJpjZIRjZISDhKGrrMbLzOTj5fujpL9jZIRjZISLjKnT1Ozb3PNjZIRjZITDxN3S1Ozi5Puio7/g4vvf4fpyc5JjZIRzdJLh4/vd3/rNzutjZISztM7c3vra3Pq7vdza3PPZ2/rX2fq5u9yCg6He4PrV1/nU1vm2uNugob+nqs64u+C0tttwcZKJi6+Wl758faFjZISeoL/W2PnS1Pm/weZwdJiBharMzvjKzPjIyvjHyfjFx/ixs+Joaoudnr/R0/nP0fm2ueDJy/jDxffCxPfAwvenqdqbnb7T1fnNz/i5vOaFibDExve/wfe9v/e8vvaam77O0Pifos60tuW8vve6vPazte59fqHLzfjBw/e4uva3ufaCg65ub5nDxPDGyPiho9Oho9l3eKBmZ4qEhsKanMWxs+hoaYuIibWvsO6jpeBnaItxcp+Zm+x4ea1vcJK+wPe5u/anqeBqa5GGiMmbnfOTleWQkr22uPa0tvatr+6Aga5jZISDhLyCg7yBgruEhcKSk96anPN0daapq+CytPWxs/WvsfWtr/WipOaBg7V0daBzdaBzdKCeoO2govSeoPOdn/OFh8mlp+CytPausPWsrvWqrPWoqvSnqfSlp/SkpvSipPSfofOMjtdnaYuho9+pq/ScnvOLjcOmqPSWmOx7fLSUldiho/Rpa5Fqa5J9frSKjNCPkd6IitB3ea0J8x3fAAAAuXRSTlMALz8fb7/////vn///////z3////9PD/////////9f/////9////////////////////////////+P////////////////////////////////////////////////////////////////////////////////////////////////////r/////////////////////////////////////////////////////////////////////CFNf8AAAIBSURBVDjLY2AgDTAyMTEx45JkZmFlY2PnYGPjxC7NxcbNw8vHx88uwIJNXpBNSJiPj09EiFMUm7QYK7s4HwgICYhhlRfgEAHL83NilWfggspLsGM1n4GFnRckLSkpxYpVXoyTBywtLSMrh1WBoDxIWkFGUYkNuwuUVfhA0qpq6srYQ5dNAyytqaWN3QksOjK6IGk9fQNlQUFBzJjgMoRIGxmbmJqZW7BZoitgtdLUsta3sbWzd3B0cnZxdUNXweoOlPbw9LKz83Z28fH180f2i4AgUEFAoIdnkEOwXYhLqK9fWHgEGxNcnokNqMAy0jPKwdHbOToGJB0bF8/GCA9CZTZg0LEkOCQCDQ/1TQJJJ6ekCiDcnwYyjZEt3TkDJJ0Jks7K5mSEp4GcXHDiUs4L9QHqzmcrKMwqKi5RhkSImCBnaVk5FzikKpLCKmPjqqoL2EBAQI6F1ZKLla2mtq4e4l4x5QagdEpjU3MLW6scEwtrSVt7R2dXXXd3DzTsRdl6gdJ9/RMmTpo8Zeq0tukzZs4CSnfP5oSFu2XBnLn9E+bNX7Bw0eIlS2csA0t3L2dDJA+uFSuB0qug0qtB0t2zc5CTD1fJmlWL1iJJr1vPhpq85Dinbli6ESbdPXuTMhN6yuTi3Lxlaz1Qctv2HTnKgtgSr1yrMiQkuERxZ28xdJMBvF2JRlNcrBgAAAAASUVORK5CYII=",
            "[(*)]":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAABwlBMVEUAAAC6iS+6iS+6iS+6iS+6iS+6iS+6iS+6iS+9jzHVuUG6iS+6iS/Rsj/18Ve6iS/p3E/5+FrZwES6iS/BljTdx0fx6lS6iS/491nRsT7l1Uz381bv4U7IoDbFnTf591n49Vj38FT27FH0503z4kry3kbx2kPw1kDv0j3uzjrtyjfsxjTMnzD27lP16k/05Uzz4Ejy3EXx2ELw1D/v0DzuzDntyDbsxDPMnjD38VX16E7z40rrwzHMni/39Fb271Pz4UjtyTbsxTPrwTDMnS66iS/t41H49lj27VHy30fuzzrtyzfsxzTqvy7MnC7s4E/161D05kzz4Uny3UXw1T/v0TzuzTnqvS3Roi3q10j05Evx20Tw10Hv0z7uzzvtyzjsxzXrwzLqvy/pvCzXpyy9jjDnzUHx2ULrwjDqvi3puyvdrCu6iS/pzT7syDXrxDLqwC/qvCzpuSrotyjiryfKoDPv0T3rwjHqvi7ouCnotSfnsyXnsSTKmCrhvTjtzDjSoy7Lmy3isSnntCbnsiTbpybHmTHYqy/Ajy68iy7QnSnkriS/ji3ctDPeszDDky/WoijAkC/lvDHGly/FkyzeqSYNOZEtAAAAlnRSTlMADy9vv9//P5///x/v//9f////z////3////////////////////////////////////////////////////////////9P//////////////////////////////////////////////////+P//////////////////////////////////////////////////////+XLHICAAABkklEQVQ4y5VT5V8CURCU42455AGeBSaI3Z2gWKjY3d3d7WEXigrG/+sDQY4Dj5/7cXdmbt7ebEjIf0tEBAGIySAACiSCcwkALQigpaEgE7KI5AqpkIQSwphwIYmISIZRCLggIIphGPnfEjQoMCDaR0Km4hSS4zmjjgFvC68OOBXrnMfFJ3g7LueJTmF3abRJuuSU1LT0jMys7Jyfj3ER6rjcvPyCwqLiktKy8gqPmV+ERlupq9K76YZqr1k3Ql1jzMuvddHr6hsauY8xocgmTXNlS5XejOmtbe2Gjk7ffRFI2mXs7untK+ofGMT0oWH+PjFiZNQ8Nj4xOTU9Mzs3779vAi0sLrnoyyura4H+xzpsYPrm1vbO7t5+AIAIHRzixx0dr56cnrEWJOIDVHB+gemXV9c3tyx7B0q/tN5j+sMjgPXpmWVZG+WXpZfy1zegTDISbHaWtfPTTTnePwC5dCUUfH49W2megAOQymNMjMBi8c0Vie+B0xDROAoqn3sheTkkSEDciwxwbyZKGezSnYf+Da0FSRY6a5opAAAAAElFTkSuQmCC",
            "[(#)]":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAtFBMVEUAAADtMCHtMCHtMCHtMCHtMCHtMCHtMCHtMCHtMCHtMCHtMCHtMCHtMCHtMCG6iS+6iS/BeyzGcivJbSrMaSq6iS/RqirgwCboyyXDeCztMCHNZynFmSzw1iP44iK6iS/03CLTXCi6iS+6iS/s0SS9gy7TXCjOZSnNpCrBfC3ZtSjPYinVrym6iS/BlC3NZym6iS/kxibQYSi9ji7ZUSbcuyfdSyXYUya6iS/PYynVWSftMCFeFPtwAAAAPHRSTlMAP28fX78v308P/6+fj+8fb8///9//////r3//////f///D+///x+f/2//3/9P/3/f/4/////Pny+/78+blAboAAABIElEQVQ4y7VTa1ODMBAEm+cBaX20aEqxKCpirdi0WuX//y+xQKAhM44zep+S281eNrlznN+G+/+EE2t2hPQSd1nSU0OaQYkuxvoaqJHmgAZnmtoeP6TBr/eBb97DE8gZT07PzifjSp5SbhK4gIvpLLwMZ9MrCmCxK+fRIv6ORTQHbPF6HS3jOpZRwob4zW0at5He3Q9w/hDFXWSPxw/pSgxJ3iPkicd4C7pIBhhMAgBQX7LODHpa9QirhErT6PO6R1i/WGwWocZfC9ufb1TrM1UbC87FVu0O+E5tBbe8NMBbobI8U8W7ADnAicDVtfcfyee+UguAmAXKumNY0w9uaRQJSNtRzTdx/4ghtWI50j3GbbjjdVlmnQD50+CwP5/NL6lmHHJczhNXAAAAAElFTkSuQmCC",
            "[(R)]":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAABO1BMVEUAAADtMCHtMCHtMCHtMCHtMCHtMCHtMCHtMCHtMCHtMCHtMCHtOx/ydRj2rxH50Qz16wnw7gj76Qr3ug/zgBbuRx7tMCHtMCH0jBX33gvn8QbG8Qie7AyC4xKL5hC67wri9Ab1oxLtMCHwXhvl8waY6A9b1ho1ySJIzx7V8gfy7AgxyS4lyV8byYQhyWsuyTo+zCCh6w3q8AcVyZwFydkCyuYOybUoyVNu3BYYyZD0mBTE8ggFt9kTdq4ZWpshNYMbUJUVbKgJpM0LycERf7QDwN8RyajtMCEfPonxaRkuMoZCLotQK45XKpBJLIw1MIcIyc0NksD46glXKpBXKpBXKpA8L4kdR49l2RhXKpBTKo9XKpBXKpDw7giC4xI1ySIbyYQCyuYhNYNXKpBXKpAuMoYJpM3l8wb0jBX41gnuAAAAaXRSTlMAT4+/7/+fXx+vP3//////////////D8//////////////L////////////////////////////////////////////////9///////////////28/3////x//D6+/v7+/v7+/f7+/v79O3N4bAAABdklEQVQ4y+2Q51bCQBBGF5MJqIEQGx0LZRQ0NBcLZbGiYuy9IcH2/k/gEIpHj2+g99ecvTPf7C5jfw7HkCQDgKQ4Xb9Yl9KRfYZHfvpRANXt0by6ro+NT0xSzreUKR+o/kAwFI4Q0ekZ7+wkyI4vPydDTIsnkthjPrLg9QM4B/MyuFPTpNOLS4SRQczm8rPqoMNHPpfFTGGZdymuIK4Gx0Ge690vlsohGn3dYS2Nq/l18NnvA1UrZdGg43KlKkRtY5PKrTRGUzF7iQL+eNL226JHdYfzXcyWNKhTg6wGEpih/A0xYK/MuUFL9sHBHODOJ7HQnT9oHJpHx1TUOD9BDHlAYUPgCWF6mZfp+Ni0aVB52omIntEOCbQwLnJeoXnTPGfs4tK8EuKa8wLe6DFgdfBGcIlzun+j4xm7Ne8oosyLmIzvAwPQ7YY9IQ7Ne/tjHswDIeitiHE/MEl6fGo+t1qWZbXb3Z99ab9a1lur1Wy+f0jsH5tPJc9K5e3l4mIAAAAASUVORK5CYII=",
            "[({)]":"data:image/png;base64,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",
            "[(})]":"data:image/png;base64,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",
            "[(k)]":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAACqVBMVEUAAADuSSjuSSjjPB7hOh3gORzuSSjuSSjuSSjuSSjhOh3fORvdNhrcNBjuSSjtSCfrRibqRCTgORzfOBvdNhnbMxjZMRbXLxTuSSjvVzfrRSXpQyPnQSLlPyDgORzcNRnaMxfYMRbWLhTULBLTKhHvXT/1qZPxmIHsUjPqRSXoQyPmQCHkPiDiPB7gORzeNxrYMBXWLhPULBLSKRDQJw7OJQ3uSSjwb1LzoYvthW3oaE7pSCnoQiPkPh/iOx7gORzcNBjaMhfVLRPTKxHRKRDPJg7NJAzLIgrJIAnuSSjxgGbvjnfpcljmVjroRifoQiLmPyHjPR/hOx3dNhrbNBjZMhbXLxTRKA/PJg3LIQrJHwjHHQbuVDXwhWzsemHqWz7qSCnpRCTnQSLlPyDhOh3ZMRbVLBLTKhHMIwvKIQrIHwjGHAbEGgTCGAPuUTHvZUjub1PtWDrjPB7hOhzSKhDQJw/OJQ3KIAnIHgjCFwLAFQG/FADuSSjuTy/vaEruVjbsRyfoTC/qblbpbFXna1TmaVLkZ1HjZlDhZE/gYk3eYEzcX0rbXUnZW0jYWUfWWEXVVkTJKhXDGQTBFwK/FQC/FADuSSjvXj/2r5rynIXuiXHrY0foa1TzvrL8+vb47OfcfW/DGQPBFgL0lXzqa1HjZE7zwbj78e7rr6bIKBPDGAPBFgHuZknuhGzqdl3mRynlf2/76Ob329jWXEzCGAO/FAC/FADrRibpRCTnRSfnWT3mXkTiRCfYSzb42db75uTxwLrMNSG/FADlPyDjPB7hPiHhRireOh7QJw7OJQzURzP32dbJKBPeNxvcNRnLIgrJIAnXXEzMNCG/FADYMBXVLRPHHQbFGgW/FADRKA/PJg3NIwzKIQnEGQS/FADGHAbBFgK/FAC/FABbs/P1AAAA43RSTlMALz8PPw+f/68Pr//PD2//zw9f////zw9f////7y9//////88P////////////z///////zw+P/////////////////////88Pv///////////////////////n9//////////////////////n5////////////////+ff+/////////////////////////////////P////////////////////////////////////////718Pf+///////////y8Pf+//////////D3//////zx+///8Pb+8fv/+Pfy/fPzM30SoAAAGnSURBVDjLY2AYfoCRCcpgZmHFJs/Gzs7BCWZxcfPwYsrzsbOz8wsIAllCwiKiYuLo8hKSkuz8UtIysgxywvIKikrKKmjyqmrqGppa2jq6evryCgaGRsYmpsjyZuYWllbWNtq2dvb6Do4GTs4urm7uHnBpTk8vbx9fP/+AwCDu4JDQMCfn8Ai3yKhomDxTTGxcfEJiUnJgCtB5qWFp6eERGZlZ2Tm5EO15+QWFQOclJRcVg51nVFJallFekZ1TWVUNlK6pravnb9DUamxqbmlta+/o7Oru6e3rnzBx0uQpU6cyMEybPmPmrNmaQOfNmTsPAeYvWLho6lSQAnbJxTNnLYE4b+my5VCwYuWq1VMhCpg4+NesXbce6rwNG0Fg0+acLVUg6a3bQI7cvmPnrt17oM7bu2///gMHgc4Dyx+CevPwkaPHjoND78TJU6cPnAE7D0keCM6eg4be+QsXL0GcN/XyIZS4uHIVEnrXrkOdd/kGenTevAUOPYjzplbfwEwQt+9UZN+FOG/qPexp7j7UeVO34UqVDx6CpB8ewpNwDz169GiQ5SUAHrG6xm0Tgr0AAAAASUVORK5CYII=",
            "[(F)]":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAACT1BMVEUAAAD3Uz70Pyf2SDH8dGf4W0j0QSjwJwnhGgXOEgu9DBH3Uz70PSTuIwXoOyv1V0XNEgu7CxK2CRS4ChOtBRfcGAfKFBDpNSLIEwbPFAjHEA64ChOtBRf3VkLEFBbmHwS+EwLWFgj4V0OzCBXjJxS9FgPgGgO9Fh74Wke3DBbLIxLdHgTlHAPTTE/7bF3MIBrHHAjwJgjjbGz7b2DIHAnsNBvsfXurBBf7cmXNFAfYKRPzOiDWLin1lZH8dmrTGAHxRzH/rqj/iH/hGgPfKxL2TzrylJHBRFL/iH/kHAHtRjG+Pk6gABz/iH/oHgD3X03LHBrjmp2pBBigABzwJAXwOB/5ZFPZHxL1p6PVanD/iH/8dmn0STPpKRLycWjldHG4ChOtBRZYngB3kRPkYT3zNxz5YU/IEA28CxFUlABmhQN6fhGPgSi4bzPLWivIShjFOQazNQKMQATNEgxWmQBVlQBSkABQjABOhwBMggBJfQBHeABFcwBDbgBBaQA+ZAA8YQBYngBXmgBVlgBAgAFGgQBJfQBIeQBEcgBDbgBBaQA+ZQBYngBYnAAPXgdLgQBJfQBHeABGdQBDcABBagBQjABNhQBKfgBHdwBDcABAaAA9YgBXmgBUlABRjQBNhgBAaAA+ZAAPXgdXmwBUlQBHdwBDcABXnABTkgBOhwBKfwBJkAFUlQBRjQBNhgBKfwBTkQBIegBEcAAPXgcPXgdWmQBIegBDbwAlYQMPXgdRjwBNhgA0YwEPXgdMggBIegBEcAAPXgcPXgcPXgcPXgeUFVsMAAAAxXRSTlMAP18vf9////+/T3////////+fPx//////////f6//////v///////////////L/////9v////v6////////////8//////99P////D3///////x////////8P7//////vL1/v////3y+P//////////+/D0//3////6/v////308P309//88vHz8/L28P/x8/Px8/H0+v/////48Pr///zw+/n//vf6+PXw+fv39/T//vT39PH///z49f79/PDz8vH2/vD/nTwCsAAAFzSURBVDjLY2AgATAyMbOwsrFzcHLhUMDNw8vHD1QgICgkLIJDgaiYODuHhKSUtAw2BbJABVJy7PIKijgUKIEUKKuoqilKqWNVoAFSoKmlraMopYtNgR5Ygb6BIVCBETYFxmAFJqYgBWbmWBRYgBRYWlkDFdjYYlNgB1Jg7wBW4IhFgRNIgbOLK0iBlJs7pgIPkAJPL4gCdW8fDAW+IAV+/mAFAYFBwVhNCAkNAykIj4jE4oaoaKCCGJCC2Lj4hERMBUnJKTypaWATFNMzsEZ3ZlZ2Tm5efkFhUTFW+ZLSsvKKyqrqmtq6+gYs8o1NzQwtrZVt7R2dXd3YDOjpBRJ9/RMmMjBMmjwFV7LsY2CYOm36jJmzZuNSMGfuvPlABQsW4lCwaPESoIKly7DJLV+xchXDotVr1q5bj13z4g3zN27avAV3ttm6Yf627Tt24slYu3Zv275nL76st2//AYa+gwTy56LNBBQcOnwEv4Ijh9GMAAAtMGlRHWiirgAAAABJRU5ErkJggg==",
            "[(W)]":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAACLlBMVEUAAABZnwBVlwBQiwBKfwBGdgBVlgBQigBKfgBEcQBAaABTlABEcQA+ZQAPXgcPXgcPXgdPiABJfQA4bQEbYAUPXgcPXgcPXgdOiABMgwBLgAAPXgcPXgcZXgUUXgYPXgdYnQBWmABTkwBRjgBOhwBMggBKfQBCdgAyZAE+YwAPXgcPXgdYnQBVmABxggWhWwXDOAHQIgWETwQ3XAUxaAJAaAA/ZQD3VD/6iHr2blvpHQLcGAbPEwvCDg96Kg5PYAJAaQAPXgf4XUv7cmT6hnnxKQu1CRSoAxiaKgpeTQQPXgcPXgf5YE70Qim/DBDMEQy5ChKsBRf7bFz8k4j3V0L0PCK5ChPaFweoAxj7bFz9q6T6k4bSFAreGQanAxn7bl/9sar5iHrJEhDuIwWpBBj7b2H+vbjnLhmrBRdJjwFTkgBPigD8eGv8lIn2TjjcJRjzOyG5ChKuBhcTYgZOkwBTkgBPigBLgQBIegD+fnP9fnL5ZFPhIhD1Tzu9CxEtdwRTkgBLgQBHeQBEcQD+f3X8dWfrIwn2XUz3VEDNEgzADRBSkABPiQBDcABAaQD+gnj8cmTxKw36aFj7bl/REwpLgABHeAA/aAA9YQD+g3nyNRrxLA/7b2HfGQXpST7dJxrlGwPsHwL2TDfjGwTMEgzRFArZFwfhGgXqIwnvIwXlHATJEA3OEgvVFQndGAboKRP2UDvwJQcPXgfQEwvWFQndGAb2TjjzOR/xKQsPXgdPdr5LAAAAunRSTlMAP//ffw/f///fL0//z4+/fz+vz///zw8vPw8v78+Pry8/Pz8fz/+/r69PP3/v////r///798Pn///////////Px+f////////v59f//////9PH///////zz///////3//////v6///29PPz/v/////+8P/////+9vL/////9/b+///59v/////98PL8//n7//////X1/P/1/v////32//////X5//////7w9f3/////+fbx8/Lx+fT98nuUF/AAABm0lEQVQ4y2NgIB4wMjGzsOJVwcbOwcmFTwE3OwcPLx8/vwBOFYJCwiKiQCAmjk1WQlKKQVpGVFaOX1RUHl1SQVFJWUVVTV1GRkOTgUFLRlQbTYGOrp6+gaGRsaiJqRmQKyDKj26EuYWllbWNrZ29A4gnLiPqiCrv5OziClLg5u7hCeJ7iXqjKvBx9oUo8PMPCATypUW9UOSDgkNCwQrCwv0DIkAiMqiOiIyKhiiIifUPiAOJyIuiKIhPSAQrSEoGKkhhAPsDRUFqGsSKdJCCDJCIt2hmVjZCQU5uHkhBfgFQQWERSES7uKS0rLwCKl9ZVQ1SUFMLUlAHFtIWrW8oa2xqhihoafUBKmhr7wAq6OyCKtDu7mls6u0D8/onABVMnDQZpGAKA0wBA8PUab3TZ4B4M4EKZs2eA1IwlwFJAQLMm1+zYOEikILF2BUwLFm6bPmKSR0FK1fhUMCwes3ades3FGyE8TdhpAiGzVu2btu+A8YTEBXHnwXQ4gITiBFSILoTv7w2ZqJEBZsIKZAXFcCvQIaAAm1RRDgBAONoa547W9uXAAAAAElFTkSuQmCC",
            "[(D)]":"data:image/gif;base64,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"
    };

    Easemob.im.Connection = Connection;
     
    Easemob.im.Utils = Utils;
    window.Easemob = Easemob;

}(window, undefined));
