import "pixi.js";

const useCreateMarkers = (data, map, escala, escalaVar) => {
    var markersLatLng = data.map((marker) => [marker.lat, marker.lon])
    var markerCount = markersLatLng.length
    var markers = [];
    var pixiOverlay;

    // Carregando marcadores
    var loader = new PIXI.loaders.Loader();
    loader.add('default', './assets/default.png');
    // Marcadores para escala
    loader.add('red', '../assets/red.png');
    loader.add('orange', '../assets/orange.png');
    loader.add('yellow', '../assets/yellow.png');
    loader.add('green', '../assets/green.png');
    loader.load(function (loader, resources) {
        var pixiContainer = new PIXI.Container();
        var markerTexture = {
            default: resources.default.texture,
            red: resources.red.texture,
            orange: resources.orange.texture,
            yellow: resources.yellow.texture,
            green: resources.green.texture
        }

        data.forEach((marker, index) => {
            var valor = marker[escalaVar]
            var color;
            if (escalaVar !== undefined) {
                if (valor < escala) {
                    color = "green"
                } else if (valor > escala && valor < escala * 2) {
                    color = "yellow"
                } else if (valor > escala * 2 && valor < escala * 3) {
                    color = "orange"
                } else if (valor >= escala * 3) {
                    color = "red"
                }
            } else {
                color = "default"
            }
            markers[index] = (new PIXI.Sprite(markerTexture[color]))
            markers[index].anchor.set(0.5, 1);
            pixiContainer.addChild(markers[index]);
        });

        var firstDraw = true;
        var prevZoom;

        pixiOverlay = L.pixiOverlay(function (utils) {
            var zoom = utils.getMap().getZoom();
            var container = utils.getContainer();
            var renderer = utils.getRenderer();
            var project = utils.latLngToLayerPoint;
            var scale = utils.getScale();

            for (var i = 0; i < markerCount; i++) {
                if (firstDraw) {
                    var markerCoords = project(markersLatLng[i]);
                    markers[i].x = markerCoords.x;
                    markers[i].y = markerCoords.y;
                }
            }

            if (firstDraw || prevZoom !== zoom) {
                for (var i = 0; i < markerCount; i++) {
                    markers[i].scale.set(0.07 / scale);
                }
            }
            firstDraw = false;
            prevZoom = zoom;
            renderer.render(container);
        }, pixiContainer);
        pixiOverlay.addTo(map)
    });
}

export default useCreateMarkers;