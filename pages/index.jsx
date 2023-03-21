// Styles and Material UI
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
// Data and Import utilities
import dynamic from "next/dynamic";
import data from "../data/fortaleza.json";
import points from "../data/teste-rota.json"
import { useEffect, useState } from "react";
import { ColorLens, Straighten } from "@mui/icons-material";
const Map = dynamic(() => import("../MapComponent"), {
  ssr: false
});

const Home = () => {
  // LISTAS DE PROPRIEDADES DOS GRÁFICOS
  const propsVariables = [];
  Object.keys(data.features[0].properties).forEach((item) => {
    if (!isNaN(data.features[0].properties[item])) {
      propsVariables.push(item);
    }
  });
  // STATES
  const [variable, setVariable] = useState();
  const [lon, setLon] = useState(data.typeMap === "markers" ? data.features[0].geometry.coordinates[1] : data.features[0].geometry.coordinates[0][0][0]);
  const [lat, setLat] = useState(data.typeMap === "markers" ? data.features[0].geometry.coordinates[0] : data.features[0].geometry.coordinates[0][0][1]);
  const [scaleMethod, setScaleMethod] = useState();
  const [scaleColor, setScaleColor] = useState()
  const drawerWidth = 240;
  var fetch_data = null;

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248a096800fd41c43268951103adacba4d4&start=${points[0].lon},${points[0].lat}&end=${points[1].lon},${points[1].lat}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        fetch_data = await response.json().then(data => {
          setRoute(data);
        })

      } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
      }
    }
    fetchData()
  }, [])

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Leaflet-pixi-overlay map
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem disablePadding style={{ display: "flex" }}>
              {data.typeMap === "polygons" && <MapOutlinedIcon style={{ marginLeft: 20, marginTop: 18, marginRight: 5 }} fontSize="medium" />}
              {data.typeMap === "markers" && <LocationOnOutlinedIcon style={{ marginLeft: 20, marginTop: 18, marginRight: 5 }} fontSize="medium" />}
              <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                <InputLabel id="demo-simple-select-standard-label">{data.typeMap === "polygons" ? "Poligonos" : "Marcadores"}</InputLabel>
                <Select
                  labelId="demo-simple-select-standard-label"
                  id="demo-simple-select-standard"
                  value={variable}
                  onChange={(e) => {
                    setScaleColor("Sequencial");
                    setScaleMethod("quantize");
                    e.target.value === "" ? setVariable(undefined) : setVariable(e.target.value)
                  }}
                  label="Marcadores"
                >
                  {propsVariables.map((prop) => (
                    <MenuItem key={prop} value={prop}>{prop}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </ListItem>
          </List>
          <Divider />
          {variable &&
            <List>
              <ListItem disablePadding style={{ display: "flex" }}>
                <Straighten style={{ marginLeft: 20, marginTop: 18, marginRight: 5 }} fontSize="medium" />
                <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                  <InputLabel id="demo-simple-select-standard-label">Método</InputLabel>
                  <Select
                    labelId="demo-simple-select-standard-label"
                    id="demo-simple-select-standard"
                    value={scaleMethod}
                    onChange={(e) => { setScaleMethod(e.target.value) }}
                    label="Choropleth"
                  >
                    <MenuItem key={1} value={"quantile"}>Quantile</MenuItem>
                    <MenuItem key={2} value={"quantize"}>Quantize</MenuItem>
                  </Select>
                </FormControl>
              </ListItem>
              {data.typeMap === "polygons" && <ListItem disablePadding style={{ display: "flex" }}>
                <ColorLens style={{ marginLeft: 20, marginTop: 18, marginRight: 5 }} fontSize="medium" />
                <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                  <InputLabel id="demo-simple-select-standard-label">Paleta</InputLabel>
                  <Select
                    labelId="demo-simple-select-standard-label"
                    id="demo-simple-select-standard"
                    value={scaleColor}
                    onChange={(e) => { setScaleColor(e.target.value) }}
                    label="Paleta"
                  >
                    <MenuItem key={1} value={"Sequencial"}>Sequencial</MenuItem>
                    <MenuItem key={2} value={"Divergente"} > Divergente</MenuItem>
                  </Select>
                </FormControl>
              </ListItem>}
            </List>
          }
        </Box>
      </Drawer >
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Toolbar />
        <Map
          data={data}
          coordinates={[lat, lon]}
          zoom={11}
          type={data.typeMap}
          variable={variable}
          scaleMethod={scaleMethod}
          scaleColor={scaleColor}
        // dataMakers={data}
        // makerVariable={variable}
        // route={route}
        />
      </Box>
    </Box >
  );
}

export default Home;