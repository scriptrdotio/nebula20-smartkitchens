var myApp = angular.module('myApp', ["Layout",  "WsClient", "HttpClient", "Map", "Chart", "Grid", "Gauge", "ngTagsInput", "gridster", "Button"]);

myApp
    .constant("menuItemsJson",  menuItems)
    .constant("headerItemsJson", headerItems)
    .constant("routingJson", routingItems)
    .config(httpsConfig)
    .config(wssConfig)
    .config(function($routeProvider, routingJson, $sceProvider){
   
    for(var i = 0; i < routingJson.params.length; i++){
        $routeProvider
            .when("/", {
            templateUrl: '/smartkitchens/view/html/views/map/map.html'
        })
            .when("/" + routingJson.params[i].route,
                  {
            templateUrl: routingJson.params[i].template,
            controller: routingJson.params[i].controller,
        })
    }
    
}); 