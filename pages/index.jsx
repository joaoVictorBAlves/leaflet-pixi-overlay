import { Container, MenuItem, Select, TextField, Typography } from "@mui/material";
import dynamic from "next/dynamic";
import data from "../data/mapa-social-caucaia.json"
import data_markers from "../data/evasao-escolar-caucaia-em-2019.json";
const Map = dynamic(() => import("../Map"), {
  ssr: false
});

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { useEffect, useState } from "react";
import { index } from "d3";

const Home = () => {
  const [choroplethVar, setChoropletVar] = useState("V001");
  const [makersVar, setMakersVar] = useState("index");
  const [lon, setLon] = useState(data.features[0].geometry.coordinates[0][0][0])
  const [lat, setLat] = useState(data.features[0].geometry.coordinates[0][0][1])
  const props = []

  Object.keys(data.features[0].properties).forEach((item) => {
    props.push(item);
  });

  return (
    <Container>
      <Typography
        variant="h5"
        component="h1"
        align="center"
        style={{ paddingTop: 20 }}
        children={"Mapas usando leaflet.PIXI.Overlay"}
      />
      <Select
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        value={choroplethVar}
        label="Age"
        onChange={(e) => { e.target.value === "" ? setChoropletVar(undefined) : setChoropletVar(e.target.value) }}
      >
        {props.map((prop) => (
          <MenuItem value={prop}>{prop}</MenuItem>
        ))}

        {/* <MenuItem value={10}>Ten</MenuItem>
        <MenuItem value={20}>Twenty</MenuItem>
        <MenuItem value={30}>Thirty</MenuItem> */}
      </Select>
      <Map
        data={data}
        coordenates={[lat, lon]}
        zoom={12}
        choroplethVariable={choroplethVar}
        dataMakers={data_markers}
      />
    </Container>
  );
}

export default Home