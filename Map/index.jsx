import { useEffect, useRef, useState } from "react";
import L from "leaflet"
import "leaflet-pixi-overlay/L.PixiOverlay";
import "leaflet/dist/leaflet.css";
import Style from "./Map.module.css"
import useCreatePolygon from "./hooks/useCreatePolygon";
import useCreateMarkers from "./hooks/useCreateMarkers";

function findMaxValue(data, property) {
    if (!data || !data.features || !property) return;
    var arr = data.features.map(feauture => feauture.properties[property]);
    var maxValue = Math.max(...arr);
    return maxValue;
}
function findMinValue(data, property) {
    if (!data || !data.features || !property) return;
    var arr = data.features.map(feauture => feauture.properties[property]);
    var minValue = Math.min(...arr);
    return minValue;
}
function findMaxValueMarker(data, property) {
    if (!data || !property) return;
    var arr = data.map(feauture => parseFloat(feauture[property]));
    var maxValue = Math.max(...arr);
    return maxValue;
}
function findMinValueMarker(data, property) {
    if (!data || !property) return;
    var arr = data.map(feauture => parseFloat(feauture[property]));
    var minValue = Math.min(...arr);
    return minValue;
}

const Map = ({ data, choroplethVariable, coordenates = [0, 0], zoom = 10, minzoom = 1, maxZoom = 20, dataMakers, makerVariable }) => {
    const [coordenatesState, setCoordenates] = useState(coordenates);
    const [zoomState, setZoom] = useState(zoom);
    const [dataState, setData] = useState(data);
    const [choroplethVariableState, setChoroplethVariable] = useState(choroplethVariable);
    const [dataMakersState, setDataMakers] = useState(dataMakers);
    const [makerVariableState, setMakeVariable] = useState(makerVariable);
    const [choroplethScale, setchoroplethScale] = useState((findMaxValue(data, choroplethVariableState) - findMinValue(data, choroplethVariableState)) / 3.0);
    const [makersScale, setMakersScale] = useState((findMaxValueMarker(dataMakersState, makerVariableState) - findMinValueMarker(dataMakersState, makerVariableState)) / 3.0);
    const mapContainerRef = useRef(null);
    var mapState;

    useEffect(() => {
        setData(data);
        setChoroplethVariable(choroplethVariable);
        setCoordenates(coordenates);
        setZoom(zoom);
        setDataMakers(dataMakers);
        setMakeVariable(makerVariable);
    }, [data, choroplethVariable, coordenates, zoom])

    useEffect(() => {
        if (mapContainerRef.current) {
            // MAPA
            mapState = (L.map(mapContainerRef.current).setView(coordenatesState, zoomState)); // Chicago origins
            const mapTiles = '//stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png';
            const osmCPLink = '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';
            const mapCPLink = '<a href="http://maps.stamen.com/toner">Stamen Design</a>';
            L.tileLayer(mapTiles, {
                attribution: `${osmCPLink} | ${mapCPLink}`,
                detectRetina: false,
                minZoom: minzoom,
                maxZoom: maxZoom,
                noWrap: false,
                subdomains: 'abc'
            }).addTo(mapState);

            let variable;
            if (dataState.features[0].properties[choroplethVariableState] !== undefined) {
                variable = choroplethVariableState;
            }
            useCreatePolygon(dataState, mapState, choroplethScale, variable);

            let makerVariable;
            if (dataMakersState[0][makerVariableState] !== undefined) {
                makerVariable = choroplethVariableState;
            }
            useCreateMarkers(dataMakersState,mapState, makersScale, makerVariableState)
        }

        return () => {
            mapState.remove();
        }
    }, [mapContainerRef, choroplethVariableState]);


    return (
        <div ref={mapContainerRef} id="map-container" className={Style.Map} style={{ marginTop: 50 }}>
        </div>
    );
}

export default Map;