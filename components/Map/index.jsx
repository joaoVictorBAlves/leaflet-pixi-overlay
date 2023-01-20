import { useEffect, useRef, useState } from "react";
import L from "leaflet"
import "leaflet-pixi-overlay/L.PixiOverlay";
import "pixi.js";
import "leaflet/dist/leaflet.css";
import Style from "../../styles/Map.module.css"
import data from "../../data/mapa-social-caucaia.json"
import marker_stress from "../../data/stress_markers.json";

const Map = () => {
    const [escalaSocial, setEscalaSocial] = useState(data.escalas.maiorV005 / 5.0);
    const mapContainerRef = useRef(null);

    const onEachFeature = (place, layer) => {
        layer.options.fillOpacity = 1
        layer.options.color = "#000"
        layer.options.weight = 0.5
        const valor = place.properties.V005
        const nome = place.properties.NM_BAIRRO
        if (valor < escalaSocial) {
            layer.options.fillColor = "#C1EAF3"
            layer.bindPopup(nome + "| " + valor.toFixed(2) + " | Renda baixa")
        } else if (valor > escalaSocial && valor < (escalaSocial * 2)) {
            layer.options.fillColor = "#79E0DF"
            layer.bindPopup(nome + "| " + valor.toFixed(2) + " | Renda média baixa")
        } else if (valor > (escalaSocial * 2) && valor < (escalaSocial * 3)) {
            layer.options.fillColor = "#54C7C1"
            layer.bindPopup(nome + "| " + valor.toFixed(2) + " | Renda média alto")
        } else if (valor > (escalaSocial * 3) && valor < (escalaSocial * 4)) {
            layer.options.fillColor = "#54C7C1"
            layer.bindPopup(nome + "| " + valor.toFixed(2) + " | Renda média alto")
        } else {
            layer.options.fillColor = "#02A199"
            layer.bindPopup(nome + "| " + valor.toFixed(2) + " | Renda alta")
        }
    }
    
    function getRandom(min, max) {
        return min + Math.random() * (max - min);
    }

    useEffect(() => {
        if (mapContainerRef.current) {
            const map = L.map(mapContainerRef.current).setView([48.840383, 2.341108], 13); // Chicago origins
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
            
            var markersLatLng = marker_stress.map((marker) => [marker.latitude, marker.longitude]);
            var markerCount = markersLatLng.length;
            var markers = [];

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

            const mapa_social = L.geoJSON(data, {
                onEachFeature: onEachFeature
            });
            mapa_social.addTo(map);


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
