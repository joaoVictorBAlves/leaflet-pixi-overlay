import { useEffect, useRef, useState } from "react";
import L, { point, polygon } from "leaflet"
import "leaflet-pixi-overlay/L.PixiOverlay";
import "pixi.js";
import "leaflet/dist/leaflet.css";
import Style from "../../styles/Map.module.css"
import data from "../../data/mapa-social-caucaia.json"
import teste from "../../data/teste-france.json"
import marker_stress from "../../data/stress_markers.json";
import { makeStyles } from "@mui/material";

const Map = () => {
    const [escalaSocial, setEscalaSocial] = useState(data.escalas.maiorV005 / 5.0);
    const mapContainerRef = useRef(null);

    function getRandom(min, max) {
        return min + Math.random() * (max - min);
    }

    useEffect(() => {
        if (mapContainerRef.current) {
            // Criando mapa e tiles
            const map = L.map(mapContainerRef.current).setView([48.838565, 2.449264526367], 13); // Chicago origins
            const mapTiles = '//stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png';
            const osmCPLink = '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';
            const mapCPLink = '<a href="http://maps.stamen.com/toner">Stamen Design</a>';
            L.tileLayer(mapTiles, {
                attribution: `${osmCPLink} | ${mapCPLink}`,
                detectRetina: false,
                minZoom: 4,
                maxZoom: 18,
                noWrap: false,
                subdomains: 'abc'
            }).addTo(map);

            // MARCADORES
            var markersLatLng = marker_stress.map((marker) => [marker.latitude, marker.longitude]);
            var markersLatLng = []
            var markerCount = 100000;
            var markers = [];
            // Gera as coordenadas randomicas
            for (let index = 0; index < markerCount; index++) {
                markersLatLng.push([getRandom(48.7, 49), getRandom(2.2, 2.8)]);
            }
            // Carregando marcadores
            var loader = new PIXI.loaders.Loader();
            loader.add('marker', './assets/red.png');
            loader.load(function (loader, resources) {
                var pixiContainer = new PIXI.Container();
                var markerTexture = resources.marker.texture;
                for (var i = 0; i < markerCount; i++) {
                    markers[i] = new PIXI.Sprite(markerTexture);
                    markers[i].anchor.set(0.5, 1);
                    pixiContainer.addChild(markers[i]);
                }

                var firstDraw = true;
                var prevZoom;

                var pixiOverlay = L.pixiOverlay(function (utils) {
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
                            markers[i].scale.set(0.03 / scale);
                        }
                    }

                    firstDraw = false;
                    prevZoom = zoom;
                    renderer.render(container);
                }, pixiContainer);
                pixiOverlay.addTo(map);
            });

            // POLIGONOS
            function getPolygonCoords(geojson) {
                var polygonLatLngs = [];
                geojson.features.forEach(function (feature) {
                    if (feature.geometry.type === "Polygon") {
                        polygonLatLngs.push(feature.geometry.coordinates[0]);
                    }
                });
                return polygonLatLngs;
            }
            // Array com polígonos e coordenadas
            var polygonLatLngs = getPolygonCoords(data)
            // Ajuste de posição de mão
            polygonLatLngs = polygonLatLngs.map(polygon => polygon.map(coords => {
                const newCoords = [coords[1], coords[0]];
                return newCoords;
            }));

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
                var polygons = polygonLatLngs;
                var color = 0xff00000;

                const drawPolygon = (polygon) => {
                    // Create the polygon
                    var pixiPolygon = new PIXI.Graphics();
                    container.addChild(pixiPolygon);
                    var projectedPolygons = polygon.map((coords) => project(coords));
                    pixiPolygon.clear();
                    pixiPolygon.lineStyle(1.2 / scale, color, 1);
                    pixiPolygon.beginFill(color, 0.2);
                    projectedPolygons.forEach(function (coords, index) {
                        if (index == 0)
                            pixiPolygon.moveTo(coords.x, coords.y);
                        else
                            pixiPolygon.lineTo(coords.x, coords.y);
                    });
                    pixiPolygon.endFill();

                    // Add click event for the polygon
                    pixiPolygon.interactive = true;
                    pixiPolygon.buttonMode = true;
                    pixiPolygon.on("pointerdown", function () {
                        console.log("Hello!");
                    });
                }

                if (firstDraw || prevZoom !== zoom) {
                    // Clear the container and draw the polygons on each iteration
                    container.removeChildren();
                    polygons.forEach((polygon, index) => {
                        drawPolygon(polygon);
                    });
                }
                firstDraw = false;
                prevZoom = zoom;
                renderer.render(container);
            }, pixiContainer);
            pixiShapeOverlay.addTo(map);



            return () => {
                map.remove();
            }
        }
    }, [mapContainerRef]);

    return (
        <div ref={mapContainerRef} id="map-container" className={Style.Map} style={{ marginTop: 50 }}>
        </div>
    );
}

export default Map;
