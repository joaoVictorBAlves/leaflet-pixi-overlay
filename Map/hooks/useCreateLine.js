import "leaflet-pixi-overlay/L.PixiOverlay";
import "pixi.js";

const useCreateLine = (data, map) => {
    console.log(data.features[0].geometry.coordinates)
    // POLIGONOS
    function getPolygonCoords(geojson) {
        var roteCoordinates = geojson.features[0].geometry.coordinates
        return roteCoordinates;
    }
    // Array com polígonos e coordenadas
    var roteCoordinates = getPolygonCoords(data)
    console.log(roteCoordinates)
    // Ajuste de posição de mão
    roteCoordinates = roteCoordinates.map((coords) => {
        const newCoords = [coords[1], coords[0]];
        return newCoords;
    });
    console.log(roteCoordinates)

    // Initial settings
    var pixiContainer = new PIXI.Container();
    var firstDraw = true;
    var prevZoom;

    // Creating shapes
    var pixiShapeOverlay = L.pixiOverlay(function (utils) {
        // Utilities
        var zoom = utils.getMap().getZoom();
        var container = utils.getContainer();
        var renderer = utils.getRenderer();
        var project = utils.latLngToLayerPoint;
        var scale = utils.getScale();
        var color = 0xff00000;

        const drawLine = (coordinates) => {
            // Create the polygon
            var pixiCordinate = new PIXI.Graphics();
            container.addChild(pixiCordinate);
            var projectedPolygons = coordinates.map(coord => project(coord));
            pixiCordinate.clear();
            pixiCordinate.lineStyle(5 / scale, color, 1);
            projectedPolygons.forEach(function (coords, index) {
                if (index === 0)
                    pixiCordinate.moveTo(coords.x, coords.y);
                else
                    pixiCordinate.lineTo(coords.x, coords.y);
            });
        }

        if (firstDraw || prevZoom !== zoom) {
            // Clear the container and draw the polygons on each iteration
            container.removeChildren();
            drawLine(roteCoordinates);
        }
        firstDraw = false;
        prevZoom = zoom;
        renderer.render(container);
    }, pixiContainer);
    pixiShapeOverlay.addTo(map);
}

export default useCreateLine;