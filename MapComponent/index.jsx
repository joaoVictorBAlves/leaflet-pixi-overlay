import { useEffect, useRef } from "react";
import Style from "./Map.module.css"
import "leaflet/dist/leaflet.css";
import "leaflet-pixi-overlay";
import * as d3 from "d3"
import "pixi.js";

const Map = ({ data, coordinates = [0, 0], zoom = 10, minzoom = 0, maxZoom = 20, variable, type = "polygons", scaleMethod, scaleColor = [0xe5f5e0, 0xa1d99b, 0x31a354, 0x006d2c] }) => {
    const mapContainerRef = useRef(null);
    var map;
    // DEFINIÇÃO DAD ESCALAS
    const set = [];
    let mapScale = null;
    useEffect(() => {
        data.features.forEach((feauture) => set.push(feauture.properties[variable]));
        if (type === "polygons") {
            if (scaleColor === "Sequencial")
                scaleColor = [0xe5f5e0, 0xa1d99b, 0x31a354, 0x006d2c];
            else
                scaleColor = [0x00939C, 0xA2D4D7, 0xEFBEAE, 0xC22E00];
        } else {
            scaleColor = ['red', 'orange', 'yellow', "green"]
        }
        if (scaleMethod === "quantile")
            mapScale = d3.scaleQuantile()
                .domain(set.sort((a, b) => a - b))
                .range(scaleColor);
        else
            mapScale = d3.scaleQuantize()
                .domain([d3.min(set.sort((a, b) => a - b)), d3.max(set.sort((a, b) => a - b))])
                .range(scaleColor);
    }, [variable, scaleMethod, scaleColor]);
    // UPDATE STATES
    useEffect(() => {
        if (mapContainerRef.current) {
            var loader = new PIXI.loaders.Loader();
            loader.add('marker', 'assets/default.png');
            loader.add('red', 'assets/red.png');
            loader.add('orange', 'assets/orange.png');
            loader.add('yellow', 'assets/yellow.png');
            loader.add('green', 'assets/green.png');
            loader.load(function (loader, resources) {
                // CIRAR MAPA
                map = L.map(mapContainerRef.current).setView(coordinates, zoom);
                L.tileLayer('//stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
                    subdomains: 'abcd',
                    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
                    minZoom: minzoom,
                    maxZoom: maxZoom
                }).addTo(map);
                map.attributionControl.setPosition('bottomright');
                map.zoomControl.setPosition('topleft');
                // CRIAÇÃO DAS LEGENDAS PARA CHOROPLETH
                // GRAPHICS OVERLAY
                var markerTexture = {
                    marker: resources.marker.texture,
                    red: resources.red.texture,
                    orange: resources.orange.texture,
                    yellow: resources.yellow.texture,
                    green: resources.green.texture
                }
                var pixiOverlay = (function () {
                    var frame = null;
                    var firstDraw = true;
                    var prevZoom;
                    // INSTANCIANDO POLÍGONOS
                    if (type === "polygons") {
                        var polygonsByGeojson = [];
                        var polygonFeautures = [];
                        data.features.forEach((feauture) => {
                            feauture.geometry.coordinates.forEach(polygon => {
                                var obj = {
                                    type: "Feauture",
                                    properties: feauture.properties,
                                    geometry: {
                                        type: feauture.geometry.type,
                                        coordinates: polygon
                                    }
                                }
                                polygonFeautures.push(obj)
                                polygonsByGeojson.push(new PIXI.Graphics());
                            });
                        });
                    }
                    // INSTANCIAÇÃO DO MARCADORES
                    if (type === "markers") {
                        var markers = []
                        if (variable) {
                            // ESCALA DOS MARCADORES
                            var values = data.features.map(feauture => feauture.properties[variable])
                            var max = Math.max.apply(Math, values);
                            var min = Math.min.apply(Math, values);
                            var scaleValue = (max - min) / 3.0
                        }
                        data.features.forEach((marker) => {
                            let texture = markerTexture.marker;
                            if (variable) {
                                var valor = marker.properties[variable]
                                texture = markerTexture[mapScale(valor)]
                            }
                            var pixiMarker = new PIXI.Sprite(texture);
                            pixiMarker.popup = L.popup()
                                .setLatLng([marker.geometry.coordinates[0], marker.geometry.coordinates[1]])
                                .setContent(marker.properties[variable]);
                            markers.push(pixiMarker)
                        });
                    }
                    // ADICIONANDO GRÁFICOS NO PIXI CONTAINER
                    var pixiContainer = new PIXI.Container();
                    if (type === "polygons") {
                        polygonsByGeojson.forEach((geo) => { geo.interactive = true });
                        pixiContainer.addChild(...polygonsByGeojson);
                    }
                    if (type === "markers") {
                        markers.forEach((geo) => { geo.interactive = true });
                        pixiContainer.addChild(...markers);
                    }
                    pixiContainer.interactive = true;
                    pixiContainer.buttonMode = true;
                    // DESENHOS DOS GRÁFICOS GERADOS
                    return L.pixiOverlay(function (utils) {
                        if (frame) {
                            cancelAnimationFrame(frame);
                            frame = null;
                        }
                        var zoom = utils.getMap().getZoom();
                        var container = utils.getContainer();
                        var renderer = utils.getRenderer();
                        var project = utils.latLngToLayerPoint;
                        var scale = utils.getScale();

                        if (firstDraw) {
                            utils.getMap().on('click', function (e) {
                                // DEFINIÇÕES DE INTERATIVIDADE
                                var interaction = utils.getRenderer().plugins.interaction;
                                var pointerEvent = e.originalEvent;
                                var pixiPoint = new PIXI.Point();
                                interaction.mapPositionToPoint(pixiPoint, pointerEvent.clientX, pointerEvent.clientY);
                                var target = interaction.hitTest(pixiPoint, container);
                                if (target && target.popup) {
                                    target.popup.openOn(map);
                                }
                            });
                            // DEFINIÇÕES DO MARCADORES 
                            if (type === "markers") {
                                data.features.forEach((marker, index) => {
                                    var markerCoord = project([marker.geometry.coordinates[0], marker.geometry.coordinates[1]]);
                                    markers[index].x = markerCoord.x;
                                    markers[index].y = markerCoord.y;
                                    markers[index].anchor.set(0.5, 1);
                                    markers[index].scale.set(0.09 / scale);
                                    markers[index].currentScale = 0.09 / scale
                                });
                            }
                        }
                        // ATUALIZAÇÕES DE GRÁFICOS
                        if (firstDraw || prevZoom !== zoom) {
                            if (type === "polygons") {
                                polygonsByGeojson.forEach((polygon, i) => {
                                    var color = scaleColor[0];
                                    var valor = 0;
                                    var alpha = 0.8;
                                    // CORES PARA O CHOROPLETH COM BASE EM ESCALA
                                    if (variable) {
                                        var valor = polygonFeautures[i].properties[variable]
                                        color = mapScale(valor);
                                    }
                                    // DESENHO DO POLÍGONO
                                    polygon.clear()
                                    polygon.lineStyle(1 / scale, 0x000000, 1);
                                    polygon.beginFill(color, alpha);
                                    polygonFeautures[i].geometry.coordinates.forEach(function (coords, index) {
                                        if (polygonFeautures[i].geometry.type === "Polygon") {
                                            var point = project([coords[1], coords[0]])
                                            if (index == 0) polygon.moveTo(point.x, point.y);
                                            else polygon.lineTo(point.x, point.y);
                                        } else {
                                            coords.forEach((coord, index) => {
                                                var point = project([coord[1], coord[0]])
                                                if (index == 0) polygon.moveTo(point.x, point.y);
                                                else polygon.lineTo(point.x, point.y);
                                            });
                                        }
                                    })
                                    polygon.endFill();
                                    // AQUI VAI O CLIQUE NO POLIGONO
                                });
                            }
                            if (type === "markers") {
                                markers.forEach((marker) => {
                                    marker.currentScale = marker.scale.x;
                                    marker.targetScale = 0.1 / scale;
                                });
                            }
                        }
                        // ANIMAÇÃO DO MARCADOR
                        var duration = 100;
                        var start;
                        function animate(timestamp) {
                            var progress;
                            if (start === null) start = timestamp;
                            progress = timestamp - start;
                            var lambda = progress / duration;
                            if (lambda > 1) lambda = 1;
                            lambda = lambda * (0.4 + lambda * (2.2 + lambda * -1.6));
                            if (type === "markers") {
                                markers.forEach((marker) => {
                                    marker.scale.set(marker.currentScale + lambda * (marker.targetScale - marker.currentScale));
                                });
                            }
                            renderer.render(container);
                            if (progress < duration) {
                                frame = requestAnimationFrame(animate);
                            }
                        }
                        // OUTRAS CONFIGURAÇÕES
                        if (!firstDraw && prevZoom !== zoom) {
                            start = null;
                            frame = requestAnimationFrame(animate);
                        }
                        firstDraw = false;
                        prevZoom = zoom;
                        renderer.render(container);
                    }, pixiContainer);
                })();
                pixiOverlay.addTo(map);
            });
        }
        return () => {
            map.remove();
        }
    }, [mapContainerRef, data, variable, scaleMethod, scaleColor]);

    return (
        <div ref={mapContainerRef} id="map-container" className={Style.Map}>
        </div>
    );
}

export default Map;