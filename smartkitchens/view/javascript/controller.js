myApp.controller('mapCtrl', function($location, mapConstants, $routeParams) {
    var vm = this;
    vm.deviceKey = null;

    vm.sources = mapConstants.sources;
    vm.icons = mapConstants.infoWindows.icons;
    
    vm.init = function() {
         if($routeParams && $routeParams.deviceId) {
             vm.deviceKey = $routeParams.deviceId;
             vm.params = {"id":  vm.deviceKey }
             vm.tag = "dashboard_" +  vm.deviceKey;
         }
    }
    
    vm.onSelectAsset = function(data) {
        if(data){
            vm.selectedDevice = data;
            vm.params = {"id": data.assetId}
        }
        if($routeParams && $routeParams.deviceId != data.assetId )
        	$location.path("/map/deviceId/"+data.assetId)
    }
    
    vm.setMarkerIcon = function(data, marker){
        marker.icon =  mapConstants.sources[marker.source]["kitchen"]
        return marker
    }

});
    
myApp.controller('menuCtrl', function(headerItemsJson, menuItemsJson) {
    var vm = this;
    vm.headerItems = headerItemsJson;
    vm.user = JSON.parse($.cookie('user'));
    vm.menuItems = menuItemsJson;
    
});

myApp.controller('notificationCtrl', function(httpClient) {
    var vm = this;
    vm.params = {} 
    httpClient
        .get("smartkitchens/api/notifications/getSettings", null)
        .then(
        function(data, response) {
            if(data && (data.emails || data.mobiles)){
                vm.emails= [];//data.emails;
                vm.mobiles = []; //data.mobiles;
                for(var i = 0; i < data.emails.length; i++){
                    vm.emails.push({"text":data.emails[i]});
                }
                for(var i = 0; i < data.mobiles.length; i++){
                    vm.mobiles.push({"text":data.mobiles[i]});
                }
            }else{
                vm.emails = [];
                vm.mobiles = [];
            }
        },
        function(err) {
            console.log('ERROR', err);
        });

    vm.buildParams = function(){
        var emailsArray = [];
        var mobilesArray = [];
        for(var i = 0; i < vm.emails.length; i++){
            emailsArray.push(vm.emails[i]["text"]);
        }
        for(var i = 0; i < vm.mobiles.length; i++){
            mobilesArray.push(vm.mobiles[i]["text"]);
        }
        vm.params["emails"] = emailsArray;
        vm.params["mobiles"] = mobilesArray;
    } 

});

myApp.controller('rulesCtrl', function(httpClient, $sce, $timeout,$routeParams) {
    var vm = this;
    var params = {};
    params["scriptName"] = $routeParams.id;
    
     vm.editorUrl = null;
    httpClient
        .get("smartkitchens/api/rules/getGenericRuleEditor", null)
        .then(
        function(data, response) {
            vm.editorUrl = data;
            if(params["scriptName"]){
                vm.rulesrc = $sce.trustAsResourceUrl(data +  '/decision_table_' + params["scriptName"]+"&pluginName=SimpleDecisionTable");
            }else{
                vm.rulesrc = $sce.trustAsResourceUrl(data +  '/decision_table_generic&pluginName=SimpleDecisionTable');
            }
            
             $timeout(function() {
               $(".loading-frame").css("display", "none")
               $(".allFrame").css("display","")
            }, 2000);
        },
        function(err) {
            console.log('ERROR');
        });
});

myApp.controller('alertsCtrl', function(httpClient, $routeParams) {
       var vm = this;
       vm.deviceKey = null;
       vm.colDef = [
            {headerName: "Temperature", field: "temperature", cellRenderer: function(params){return params.value + " " + params.data.temperature_unit}},
            {headerName: "Humidity", field: "humidity", cellRenderer: function(params){return params.value  + " " + params.data.humidity_unit}},
            {headerName: "Pressure", field: "pressure", cellRenderer: function(params){return params.value + " " + params.data.pressure_unit}},
            {headerName: "Timestamp", field: "creationDate"},
            {headerName: "Temperature Unit", field: "temperature_unit", hide: true},
            {headerName: "Humidity Unit", field: "humidity_unit", hide: true},
            {headerName: "Pressure Unit", field: "pressure_unit", hide: true},
        ] 
     
       vm.init = function(){
            if($routeParams && $routeParams.deviceId) {
                vm.deviceKey = $routeParams.deviceId;
                vm.params = {"id":  vm.deviceKey }
                vm.tag = "dashboard_" +  vm.deviceKey;
                httpClient.get("smartkitchens/api/getLatestDevice", vm.params).then(
                function(data, response) {
                    vm.summaryData(data)
                },
                function(err) {
                    console.log('ERROR', error);
                });
             }
        }
		
        vm.formatData = function(data){
            if(data){
                return {documents: data, count: data.length}  
            }
        }
        
        vm.summaryData = function(data) {
            if(data && data[vm.deviceKey] && data[vm.deviceKey][0] && data[vm.deviceKey][0][0])
                vm.selectedDevice = data[vm.deviceKey][0][0];
        }
});
        	

myApp.controller('dashboardCtrl', function($scope,  wsClient, httpClient, $routeParams) {
    var vm = this;
    vm.deviceKey = null;
    vm.gridsterOptions = {
        pushing: false,

        minRows: 1, // the minimum height of the grid, in rows
        maxRows: 100,
        columns: 4, // the width of the grid, in columns
        colWidth: 'auto', // can be an integer or 'auto'.  'auto' uses the pixel width of the element divided by 'columns'
        rowHeight: 'match', // can be an integer or 'match'.  Match uses the colWidth, giving you square widgets.
        margins: [10, 10], // the pixel distance between each widget
        defaultSizeX: 2, // the default width of a gridster item, if not specifed
        defaultSizeY: 1, // the default height of a gridster item, if not specified
        mobileBreakPoint: 1024, // if the screen is not wider that this, remove the grid layout and stack the items
        minColumns: 1,
        resizable: {
            enabled: false
        },
        draggable: {
            enabled: false
        }
    };

    vm.init = function(){
        if($routeParams && $routeParams.deviceId) {
            vm.deviceKey = $routeParams.deviceId;
            vm.params = {"id":  vm.deviceKey }
            vm.tag = "dashboard_" +  vm.deviceKey;
            wsClient.subscribe(vm.tag, vm.consumeData.bind(vm), $scope.$id);  
            httpClient.get("smartkitchens/api/getLatestDevice", vm.params).then(
                function(data, response) {
                    vm.consumeData(data)
                },
                function(err) {
                    console.log('ERROR', error);
                });
        }
    }


    vm.consumeData = function(data) {
        if(data.latest) {
            data = data.latest
        }
        if(data && data[vm.deviceKey] && data[vm.deviceKey][0] && data[vm.deviceKey][0][0])
            vm.selectedDevice = data[vm.deviceKey][0][0];
    }

    vm.historicalFormatData = function(data){
        if(data.historical) 
            return data.historical;
        else
            return data;
    }  
    vm.gaugeFormatData7 = function(data){
        return data.latest.temperature;
    }

    vm.gaugeFormatData8 = function(data){
        return data.latest.pressure;
    }

    vm.gaugeFormatData10 = function(data){
        return data.latest.humidity;
    }
});




