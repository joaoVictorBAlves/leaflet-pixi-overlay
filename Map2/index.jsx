import { useEffect, useRef, useState } from "react";
import L, { polygon } from "leaflet"
import "leaflet-pixi-overlay";
import "leaflet/dist/leaflet.css";
import "pixi.js";
import Style from "./Map.module.css"

const Map = ({ data, coordenates = [0, 0], zoom = 10, minzoom = 1, maxZoom = 20, dataMakers, route }) => {
    // states
    const mapContainerRef = useRef(null);
    // UpdateStates
    useEffect(() => {
        if (mapContainerRef.current) {
            var loader = new PIXI.loaders.Loader();
            loader.add('marker', 'assets/default.png');
            loader.load(function (loader, resources) {
                var markerTexture = resources.marker.texture;
                // CRIACAO DO MAPA
                var map = L.map(mapContainerRef.current).setView(coordenates, zoom);
                L.tileLayer('//stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
                    subdomains: 'abcd',
                    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
                    minZoom: minzoom,
                    maxZoom: maxZoom
                }).addTo(map);
                map.attributionControl.setPosition('bottomleft');
                map.zoomControl.setPosition('bottomright');

                // OVERLAY DE GRÁFICOS PIXI.JS
                var pixiOverlay = (function () {
                    var frame = null;
                    var firstDraw = true;
                    var prevZoom;
                    // INSTANCIAÇÃO DE UM SPRITE PARA GERAR O MARCADOR ONDE É PASSADO A TEXTURA
                    var markerLatLng = [51.5, -0.09];
                    var marker = new PIXI.Sprite(markerTexture);
                    marker.popup = L.popup()
                        .setLatLng(markerLatLng)
                        .setContent('<b>Hello world!</b><br>I am a popup.')
                    // DEFINIÇÃO DAS CORDENADAS DO POLÍGONO
                    var polygonLatLngs = []
                    var projectedPolygon;
                    var polygons = []
                    if (data) {
                        data.features.map((feauture) => {
                            if (feauture.geometry.type === "Polygon") {
                                var polygonCoord = []
                                feauture.geometry.coordinates[0].forEach(coord => {
                                    polygonCoord.push([coord[1], coord[0]])
                                });
                                polygonLatLngs.push(polygonCoord);
                                polygons.push(new PIXI.Graphics());
                            } else {
                                console.log("SubPolygon")
                                feauture.geometry.coordinates.forEach(polygon => {
                                    var polygonCoord = []
                                    polygon.forEach((coords) => {
                                        coords.forEach(coord => {
                                            polygonCoord.push([coord[1], coord[0]])
                                        })
                                    })
                                    polygonLatLngs.push(polygonCoord)
                                    polygons.push(new PIXI.Graphics());
                                })
                            }
                        });
                    }
                    // INSTANCIAÇÃO DE UM CONTEINER E ADICIONANDO MARCADORES
                    var pixiContainer = new PIXI.Container();
                    // if dataMaker
                    [marker].forEach((geo) => { geo.interactive = true });
                    pixiContainer.addChild(marker);
                    if (data) {
                        [...polygons].forEach((geo) => { geo.interactive = true });
                        pixiContainer.addChild(...polygons);
                    }
                    pixiContainer.interactive = true;
                    pixiContainer.buttonMode = true;
                    // COMPATIBILIDADE [IRRELEVANTE]
                    var doubleBuffering = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                    // RETORNA-SE OS GRÁFICOS GERADOS
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
                            var getRenderer = utils.getRenderer;
                            utils.getMap().on('click', function (e) {
                                var interaction = utils.getRenderer().plugins.interaction;
                                var pointerEvent = e.originalEvent;
                                var pixiPoint = new PIXI.Point();
                                interaction.mapPositionToPoint(pixiPoint, pointerEvent.clientX, pointerEvent.clientY);
                                var target = interaction.hitTest(pixiPoint, container);
                                if (target && target.popup) {
                                    target.popup.openOn(map);
                                }
                            });
                            // DEFINIÇÕES DO MARCADOR NO PRIMEIRO DESENHO COMO ANCORAGEM, POSIÇÃO E ESCALA
                            var markerCoords = project(markerLatLng);
                            marker.x = markerCoords.x;
                            marker.y = markerCoords.y;
                            marker.anchor.set(0.5, 1);
                            marker.scale.set(0.1 / scale);
                            marker.currentScale = 0.1 / scale;
                            // DEFINIÇÃO INICIAL DO POLÍGONO COM O PROJECTED DOS PONTOS
                            if (data) {
                                projectedPolygon = polygonLatLngs.map(poly => poly.map(coord => project(coord)));
                            }
                        }
                        if (firstDraw || prevZoom !== zoom) {
                            marker.currentScale = marker.scale.x;
                            marker.targetScale = 0.1 / scale;
                            // REDESENHO DO POLÍGONO COM ESCALA DIFERENTE
                            if (data) {
                                polygons.forEach((polygon, index) => {
                                    polygon.clear()
                                    polygon.lineStyle(3 / scale, 0x3388ff, 1);
                                    polygon.beginFill(0x3388ff, 0.2);
                                    projectedPolygon[index].forEach(function (coords, index) {
                                        if (index == 0) polygon.moveTo(coords.x, coords.y);
                                        else polygon.lineTo(coords.x, coords.y);
                                    });
                                    polygon.endFill();
                                    polygon.on("pointerdown", () => {
                                        polygon.popup = L.popup()
                                            .setLatLng([-3.7432953169100585, -38.79698816466384])
                                            .setContent(`Polígono ${index}`)
                                    });
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
                            marker.scale.set(marker.currentScale + lambda * (marker.targetScale - marker.currentScale));
                            renderer.render(container);
                            if (progress < duration) {
                                frame = requestAnimationFrame(animate);
                            }
                        }
                        if (!firstDraw && prevZoom !== zoom) {
                            start = null;
                            frame = requestAnimationFrame(animate);
                        }
                        firstDraw = false;
                        prevZoom = zoom;
                        renderer.render(container);
                    }, pixiContainer, {
                        doubleBuffering: doubleBuffering,
                        autoPreventDefault: false
                    });
                })();
                pixiOverlay.addTo(map);
            });
        }
    }, [mapContainerRef, data]);

    return (
        <div ref={mapContainerRef} id="map-container" className={Style.Map}>
        </div>
    );
}

export default Map;